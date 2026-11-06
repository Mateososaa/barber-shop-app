from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# --- SCHEMAS DE SERVICIOS ---
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

# --- SCHEMAS DE USUARIOS ---
class UserBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: Optional[str] = "CLIENTE"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# --- SCHEMAS DE TURNOS (APPOINTMENTS) ---
class AppointmentCreate(BaseModel):
    cliente_id: int
    barbero_id: int
    servicio_id: int
    fecha_hora_inicio: datetime

class AppointmentResponse(BaseModel):
    id: int
    cliente_id: int
    barbero_id: int
    servicio_id: int
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    estado: str

    class Config:
        from_attributes = True