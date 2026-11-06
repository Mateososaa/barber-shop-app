from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), default="CLIENTE")  # CLIENTE, BARBERO, ADMIN

    appointments = relationship("Appointment", foreign_keys="Appointment.cliente_id", back_populates="cliente")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    duracion_minutos = Column(Integer, nullable=False)
    precio = Column(Float, nullable=False)

    appointments = relationship("Appointment", back_populates="servicio")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    barbero_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    servicio_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    fecha_hora_inicio = Column(DateTime, nullable=False)
    fecha_hora_fin = Column(DateTime, nullable=False)
    estado = Column(String(20), default="RESERVADO")

    cliente = relationship("User", foreign_keys=[cliente_id], back_populates="appointments")
    servicio = relationship("Service", back_populates="appointments")  # Corregido a appointments