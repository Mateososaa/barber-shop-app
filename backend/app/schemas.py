from pydantic import BaseModel
from datetime import datetime, time
from typing import List, Optional

# --- SCHEMAS HORARIOS ---
class WorkScheduleBase(BaseModel):
    dia_semana: int # 0 a 6
    hora_apertura: time
    hora_cierre: time

class WorkScheduleCreate(WorkScheduleBase):
    pass

class WorkScheduleResponse(WorkScheduleBase):
    id: int
    barbero_id: int

    class Config:
        from_attributes = True

# --- SCHEMAS USUARIO ---
class UserBase(BaseModel):
    nombre: str
    email: str
    rol: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    horarios: List[WorkScheduleResponse] = []

    class Config:
        from_attributes = True

# --- SCHEMAS SERVICIO ---
class ServiceBase(BaseModel):
    nombre: str
    duracion_minutos: int
    precio: float

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int

    class Config:
        from_attributes = True

# --- SCHEMAS TURNOS (APPOINTMENTS) ---
class AppointmentBase(BaseModel):
    cliente_id: int
    barbero_id: int
    servicio_id: int
    fecha_hora_inicio: datetime

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentResponse(AppointmentBase):
    id: int
    fecha_hora_fin: datetime
    estado: str

    class Config:
        from_attributes = True