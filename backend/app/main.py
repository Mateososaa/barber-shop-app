from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

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

# ... (resto de tus endpoints abajo igual)

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
    # Verificar si el email ya existe
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Nota: En producción debemos encriptar la contraseña (ej: passlib/bcrypt)
    db_user = models.User(
        nombre=user.nombre,
        email=user.email,
        password_hash=user.password,  # temporal
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
    # 1. Verificar que el servicio existe
    service = db.query(models.Service).filter(models.Service.id == appointment.servicio_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="El servicio no existe")

    # 2. Calcular fecha_hora_fin según la duración del servicio
    fecha_inicio = appointment.fecha_hora_inicio
    fecha_fin = fecha_inicio + timedelta(minutes=service.duracion_minutos)

    # 3. Validar solapamiento de horarios para el barbero
    # Condición: NuevoInicio < ExistenteFin AND NuevoFin > ExistenteInicio
    overlapping = db.query(models.Appointment).filter(
        models.Appointment.barbero_id == appointment.barbero_id,
        models.Appointment.estado == "RESERVADO",
        models.Appointment.fecha_hora_inicio < fecha_fin,
        models.Appointment.fecha_hora_fin > fecha_inicio
    ).first()

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El barbero ya tiene un turno reservado en ese rango horario."
        )

    # 4. Crear el turno si está disponible
    db_appointment = models.Appointment(
        cliente_id=appointment.cliente_id,
        barbero_id=appointment.barbero_id,
        servicio_id=appointment.servicio_id,
        fecha_hora_inicio=fecha_inicio,
        fecha_hora_fin=fecha_fin,
        estado="RESERVADO"
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@app.get("/appointments/", response_model=List[schemas.AppointmentResponse], tags=["Turnos"])
def get_appointments(db: Session = Depends(get_db)):
    return db.query(models.Appointment).all()