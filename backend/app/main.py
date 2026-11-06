from datetime import datetime, timedelta
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
import app.models as models
import app.schemas as schemas
from app.auth import create_access_token, get_current_user
from datetime import date, time

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

@app.put("/services/{service_id}", response_model=schemas.ServiceResponse, tags=["Servicios"])
def update_service(service_id: int, updated: schemas.ServiceCreate, db: Session = Depends(get_db)):
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    for key, value in updated.model_dump().items():
        setattr(service, key, value)
    db.commit()
    db.refresh(service)
    return service

@app.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Servicios"])
def delete_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    db.delete(service)
    db.commit()
    return None

# ==========================================
# 2. ENDPOINTS DE USUARIOS Y HORARIOS
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

@app.post("/users/{barber_id}/schedules/", response_model=schemas.WorkScheduleResponse, tags=["Usuarios"])
def add_barber_schedule(barber_id: int, schedule: schemas.WorkScheduleCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == barber_id, models.User.rol == "BARBERO").first()
    if not user:
        raise HTTPException(status_code=404, detail="El barbero no existe")
    
    new_schedule = models.WorkSchedule(**schedule.model_dump(), barbero_id=barber_id)
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule

# ==========================================
# 3. ENDPOINTS DE TURNOS (APPOINTMENTS)
# ==========================================

@app.get("/appointments/available-slots/", tags=["Turnos"])
def get_available_slots(fecha: str, barbero_id: Optional[int] = None, db: Session = Depends(get_db)):
    try:
        fecha_dt = datetime.strptime(fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usar YYYY-MM-DD")

    dia_semana = fecha_dt.weekday() # 0 = Lunes, 6 = Domingo

    # Obtener barberos a filtrar
    query_barberos = db.query(models.User).filter(models.User.rol == "BARBERO")
    if barbero_id:
        query_barberos = query_barberos.filter(models.User.id == barbero_id)
    barberos = query_barberos.all()

    # Obtener turnos ya ocupados en ese día
    inicio_dia = datetime.combine(fecha_dt, time.min)
    fin_dia = datetime.combine(fecha_dt, time.max)
    turnos_ocupados = db.query(models.Appointment).filter(
        models.Appointment.fecha_hora_inicio >= inicio_dia,
        models.Appointment.fecha_hora_inicio <= fin_dia
    ).all()

    # Construir grilla de horas disponibles (bloques de 30 min entre 08:00 y 21:00)
    slots_disponibles = []

    for b in barberos:
        # Obtener horarios de trabajo del barbero para este día de la semana
        horarios_trabajo = db.query(models.WorkSchedule).filter(
            models.WorkSchedule.barbero_id == b.id,
            models.WorkSchedule.dia_semana == dia_semana
        ).all()

        for h in horarios_trabajo:
            # Generar intervalos de 30 minutos dentro de la jornada
            hora_actual = datetime.combine(fecha_dt, h.hora_apertura)
            hora_cierre = datetime.combine(fecha_dt, h.hora_cierre)

            while hora_actual < hora_cierre:
                fin_slot = hora_actual + timedelta(minutes=30)

                # Si es hoy, filtrar horas que ya pasaron
                if hora_actual > datetime.now():
                    # Verificar que no se solape con un turno ocupado
                    ocupado = any(
                        t.barbero_id == b.id and t.fecha_hora_inicio < fin_slot and t.fecha_hora_fin > hora_actual
                        for t in turnos_ocupados
                    )

                    if not ocupado:
                        slots_disponibles.append({
                            "hora": hora_actual.strftime("%H:%M"),
                            "barbero_id": b.id,
                            "barbero_nombre": b.nombre
                        })

                hora_actual = fin_slot

    # Ordenar resultados por hora
    slots_disponibles.sort(key=lambda x: x["hora"])
    return slots_disponibles

@app.post("/appointments/", response_model=schemas.AppointmentResponse, status_code=status.HTTP_201_CREATED, tags=["Turnos"])
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    ahora = datetime.now()

    # 1. Validar fecha pasada
    if appointment.fecha_hora_inicio < ahora:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No podés agendar un turno en una fecha u hora pasada."
        )

    # 2. Validar bloques de 30 minutos
    if appointment.fecha_hora_inicio.minute not in (0, 30) or appointment.fecha_hora_inicio.second != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los turnos deben programarse exactos a la hora o a la media hora (ej: 14:00 o 14:30)."
        )

    # 3. Verificar servicio
    service = db.query(models.Service).filter(models.Service.id == appointment.servicio_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="El servicio no existe")

    fecha_inicio = appointment.fecha_hora_inicio
    fecha_fin = fecha_inicio + timedelta(minutes=service.duracion_minutos)

    # 4. Validar si el barbero trabaja en ese día y franja horaria (si tiene horarios asignados)
    dia_semana_turno = fecha_inicio.weekday()
    hora_inicio_turno = fecha_inicio.time()
    hora_fin_turno = fecha_fin.time()

    horarios_barbero = db.query(models.WorkSchedule).filter(
        models.WorkSchedule.barbero_id == appointment.barbero_id
    ).all()

    if horarios_barbero:
        horario_valido = db.query(models.WorkSchedule).filter(
            models.WorkSchedule.barbero_id == appointment.barbero_id,
            models.WorkSchedule.dia_semana == dia_semana_turno,
            models.WorkSchedule.hora_apertura <= hora_inicio_turno,
            models.WorkSchedule.hora_cierre >= hora_fin_turno
        ).first()

        if not horario_valido:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El barbero no trabaja en ese día u horario."
            )

    # 5. Validar solapamientos
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
    appointments = db.query(models.Appointment).order_by(models.Appointment.fecha_hora_inicio.asc()).all()
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

@app.put("/users/{user_id}", response_model=schemas.UserResponse, tags=["Usuarios"])
def update_user(user_id: int, updated: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar si el nuevo email ya pertenece a otro usuario
    existing = db.query(models.User).filter(models.User.email == updated.email, models.User.id != user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado por otro usuario")

    user.nombre = updated.nombre
    user.email = updated.email
    user.password_hash = updated.password  # En prod usar hash
    user.rol = updated.rol

    db.commit()
    db.refresh(user)
    return user

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Usuarios"])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(user)
    db.commit()
    return None

# Endpoint de autenticación
@app.post("/login", response_model=schemas.TokenResponse, tags=["Autenticación"])
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    # Verificación directa de password (o hashing si tenés contraseñas encriptadas)
    if not user or user.password_hash != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    access_token = create_access_token(data={"sub": user.email, "rol": user.rol})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Usuarios"])
def delete_barber_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(models.WorkSchedule).filter(models.WorkSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Franja horaria no encontrada")
    
    db.delete(schedule)
    db.commit()
    return None