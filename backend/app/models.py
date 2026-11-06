from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Time
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False)  # 'CLIENTE', 'BARBERO', 'ADMIN'

    # Relación con horarios de trabajo (si es barbero)
    horarios = relationship("WorkSchedule", back_populates="barbero", cascade="all, delete-orphan")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    duracion_minutos = Column(Integer, nullable=False)
    precio = Column(Float, nullable=False)

class WorkSchedule(Base):
    __tablename__ = "work_schedules"

    id = Column(Integer, primary_key=True, index=True)
    barbero_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dia_semana = Column(Integer, nullable=False)  # 0 = Lunes, 1 = Martes, ..., 6 = Domingo
    hora_apertura = Column(Time, nullable=False)
    hora_cierre = Column(Time, nullable=False)

    barbero = relationship("User", back_populates="horarios")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    barbero_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    servicio_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    fecha_hora_inicio = Column(DateTime, nullable=False)
    fecha_hora_fin = Column(DateTime, nullable=False)
    estado = Column(String, nullable=False)