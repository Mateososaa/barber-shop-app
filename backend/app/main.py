from datetime import datetime, timedelta
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
import app.models as models
import app.schemas as schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Barber Shop API",
    description="API REST para la gestión de turnos de barbería",
    version="1.0.0"
)

# --- CONFIGURACIÓN DE CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FUNCIÓN AUXILIAR DE ESTADO DINÁMICO ---
def calcular_estado_turno(inicio: datetime, fin: datetime) -> str:
    ahora = datetime.now()
    if ahora < inicio:
        return "Reservado"
    elif inicio <= ahora <= fin:
        return "En Curso"
    else:
        return "Finalizado"


@app.get("/")
def read_root():
    return {"status": "ok", "message": "API de Barbería conectada exitosamente"}


# ==========================================
# 1. ENDPOINTS DE SERVICIOS
# ==========================================
@app.post("/services/", response_model=schemas.ServiceResponse, status_code=status.HTTP_201_CREATED, tags=["Servicios"])
def create_service(service: schemas.ServiceCreate, db: Session = Depends(get_db)):
    db_service = models.Service(**service.model_dump())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@app.get("/services/", response_model=List[schemas.ServiceResponse], tags=["Servicios"])
def get_services(db: Session = Depends(get_db)):
    return db.query(models.Service).all()


# ==========================================
# 2. ENDPOINTS DE USUARIOS
# ==========================================
@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Usuarios"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    db_user = models.User(
        nombre=user.nombre,
        email=user.email,
        password_hash=user.password,
        rol=user.rol
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[schemas.UserResponse], tags=["Usuarios"])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


# ==========================================
# 3. ENDPOINTS DE TURNOS (APPOINTMENTS)
# ==========================================
@app.post("/appointments/", response_model=schemas.AppointmentResponse, status_code=status.HTTP_201_CREATED, tags=["Turnos"])
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    ahora = datetime.now()

    # 1. Validar que no sea una fecha/hora pasada
    if appointment.fecha_hora_inicio < ahora:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No podés agendar un turno en una fecha u hora pasada."
        )

    # 2. Validar bloques de 30 minutos (:00 o :30)
    if appointment.fecha_hora_inicio.minute not in (0, 30) or appointment.fecha_hora_inicio.second != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los turnos deben programarse exactos a la hora o a la media hora (ej: 14:00 o 14:30)."
        )

    # 3. Verificar existencia del servicio
    service = db.query(models.Service).filter(models.Service.id == appointment.servicio_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="El servicio no existe")

    # 4. Calcular fin según duración del servicio
    fecha_inicio = appointment.fecha_hora_inicio
    fecha_fin = fecha_inicio + timedelta(minutes=service.duracion_minutos)

    # 5. Validar solapamiento de horarios para el barbero
    overlapping = db.query(models.Appointment).filter(
        models.Appointment.barbero_id == appointment.barbero_id,
        models.Appointment.fecha_hora_inicio < fecha_fin,
        models.Appointment.fecha_hora_fin > fecha_inicio
    ).first()

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El barbero ya tiene un turno reservado en ese horario."
        )

    # 6. Guardar el turno con el estado inicial calculado
    db_appointment = models.Appointment(
        cliente_id=appointment.cliente_id,
        barbero_id=appointment.barbero_id,
        servicio_id=appointment.servicio_id,
        fecha_hora_inicio=fecha_inicio,
        fecha_hora_fin=fecha_fin,
        estado=calcular_estado_turno(fecha_inicio, fecha_fin)
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@app.get("/appointments/", response_model=List[schemas.AppointmentResponse], tags=["Turnos"])
def get_appointments(db: Session = Depends(get_db)):
    appointments = db.query(models.Appointment).all()
    # Recalcular dinámicamente el estado en tiempo real antes de enviar la respuesta
    for app_item in appointments:
        app_item.estado = calcular_estado_turno(app_item.fecha_hora_inicio, app_item.fecha_hora_fin)
    return appointments

@app.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Turnos"])
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El turno no existe."
        )
    db.delete(appointment)
    db.commit()
    return None