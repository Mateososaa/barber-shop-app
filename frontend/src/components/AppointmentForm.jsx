import { useState, useEffect } from 'react';
import barberApi from '../api/barberApi';

export const AppointmentForm = ({ onAppointmentCreated }) => {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);

  const [formData, setFormData] = useState({
    cliente_id: '',
    barbero_id: '',
    servicio_id: '',
    fecha: '',
    hora: ''
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, servicesRes] = await Promise.all([
          barberApi.get('/users/'),
          barberApi.get('/services/')
        ]);
        setUsers(usersRes.data);
        setServices(servicesRes.data);
      } catch (err) {
        console.error('Error al obtener datos iniciales:', err);
      }
    };
    fetchData();
  }, []);

  // Listener global: solo deselecciona si el clic fue AFUERA de las tarjetas de servicio Y AFUERA del formulario de reserva
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const clickedOnServiceCard = e.target.closest('.service-card-item');
      const clickedOnFormContainer = e.target.closest('.reservation-form-container');

      // Si no tocó ninguna tarjeta de servicio ni nada dentro del formulario de datos, deseleccionamos
      if (!clickedOnServiceCard && !clickedOnFormContainer) {
        setFormData((prev) => (prev.servicio_id ? { ...prev, servicio_id: '' } : prev));
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectService = (e, serviceId) => {
    e.stopPropagation();

    if (formData.servicio_id === serviceId.toString()) {
      setFormData({ ...formData, servicio_id: '' });
    } else {
      setFormData({ ...formData, servicio_id: serviceId.toString() });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!formData.servicio_id) {
      return setError('Por favor seleccioná un servicio haciendo clic en una de las tarjetas.');
    }

    const fechaHoraInicio = `${formData.fecha}T${formData.hora}`;

    try {
      const response = await barberApi.post('/appointments/', {
        cliente_id: parseInt(formData.cliente_id),
        barbero_id: parseInt(formData.barbero_id),
        servicio_id: parseInt(formData.servicio_id),
        fecha_hora_inicio: fechaHoraInicio
      });

      setMessage('¡Turno reservado exitosamente!');
      setFormData({ cliente_id: '', barbero_id: '', servicio_id: '', fecha: '', hora: '' });
      if (onAppointmentCreated) onAppointmentCreated(response.data);
    } catch (err) {
      if (err.response && (err.response.status === 409 || err.response.status === 400)) {
        setError(err.response.data.detail);
      } else {
        setError('Ocurrió un error al intentar agendar el turno.');
      }
    }
  };

  const barberos = users.filter((u) => u.rol === 'BARBERO');
  const clientes = users.filter((u) => u.rol === 'CLIENTE');
  const selectedService = services.find((s) => s.id.toString() === formData.servicio_id);
  const selectedBarber = barberos.find((b) => b.id.toString() === formData.barbero_id);

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. SECCIÓN DE SERVICIOS */}
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
            <span>
              <i className="bi bi-scissors text-warning me-2"></i>1. Seleccioná tu Servicio
            </span>
            {selectedService ? (
              <span className="badge bg-success rounded-pill px-3 py-2 fw-semibold">
                <i className="bi bi-check2 me-1"></i>{selectedService.nombre} (${selectedService.precio})
              </span>
            ) : (
              <span className="text-muted small fw-normal">
                Haz clic en un servicio para elegirlo
              </span>
            )}
          </h5>

          <div className="row g-3">
            {services.map((s) => {
              const isSelected = formData.servicio_id === s.id.toString();

              return (
                <div key={s.id} className="col-md-6 col-lg-4">
                  <div
                    className={`service-card-item p-3 rounded-4 border transition-all cursor-pointer h-100 d-flex flex-column justify-content-between ${
                      isSelected
                        ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                        : 'border-light bg-light hover-shadow'
                    }`}
                    onClick={(e) => handleSelectService(e, s.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0">{s.nombre}</h6>
                        <span className="fw-bold text-success fs-5">${s.precio}</span>
                      </div>
                      <p className="text-muted small mb-3">
                        <i className="bi bi-clock me-1"></i>{s.duracion_minutos} min
                      </p>
                    </div>

                    <div className="text-end">
                      <span className={`badge rounded-pill ${isSelected ? 'bg-primary' : 'bg-secondary bg-opacity-25 text-dark'}`}>
                        {isSelected ? 'Seleccionado' : 'Elegir'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. FORMULARIO DE DETALLES DEL TURNO (Protegido con la clase reservation-form-container) */}
      <div className="reservation-form-container card shadow-sm border-0 rounded-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-calendar-event text-primary me-2"></i>2. Completá los Datos de la Reserva
          </h5>

          {message && <div className="alert alert-success rounded-3">{message}</div>}
          {error && <div className="alert alert-danger rounded-3">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted">Cliente</label>
                <select
                  className="form-select rounded-3 py-2"
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted">Barbero</label>
                <select
                  className="form-select rounded-3 py-2"
                  name="barbero_id"
                  value={formData.barbero_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar Barbero...</option>
                  {barberos.map((b) => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted">Fecha</label>
                <input
                  type="date"
                  className="form-control rounded-3 py-2"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  min={today}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted">Hora Disponible</label>
                <select
                  className="form-select rounded-3 py-2"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar Hora...</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} hs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resumen Final de Reserva */}
            {selectedService && (
              <div className="p-3 bg-light border rounded-3 mt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-bold text-primary">{selectedService.nombre}</span>
                    {selectedBarber && <span className="text-muted ms-2">con {selectedBarber.nombre}</span>}
                    {formData.fecha && formData.hora && (
                      <div className="small text-muted mt-1">
                        <i className="bi bi-calendar3 me-1"></i>
                        {formData.fecha} a las {formData.hora} hs ({selectedService.duracion_minutos} min)
                      </div>
                    )}
                  </div>
                  <div className="fs-4 fw-bold text-success">${selectedService.precio}</div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-dark w-100 mt-4 py-2.5 fw-bold rounded-3">
              Confirmar Reserva
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};