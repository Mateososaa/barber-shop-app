import { useState, useEffect } from 'react';
import barberApi from '../api/barberApi';

export const AppointmentForm = ({ onAppointmentCreated }) => {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [formData, setFormData] = useState({
    cliente_id: '',
    servicio_id: '',
    barbero_id: '',
    fecha: '',
    hora: ''
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];

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

  // Listener global para deseleccionar servicio al hacer clic afuera
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const clickedOnServiceCard = e.target.closest('.service-card-item');
      const clickedOnFormContainer = e.target.closest('.reservation-form-container');

      if (!clickedOnServiceCard && !clickedOnFormContainer) {
        setFormData((prev) => (prev.servicio_id ? { ...prev, servicio_id: '' } : prev));
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Buscar slots libres en la base de datos cuando cambia la fecha o el barbero
  useEffect(() => {
    if (!formData.fecha) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const params = { fecha: formData.fecha };
        if (formData.barbero_id) params.barbero_id = formData.barbero_id;

        const res = await barberApi.get('/appointments/available-slots/', { params });
        setAvailableSlots(res.data);
      } catch (err) {
        console.error('Error al obtener turnos disponibles:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [formData.fecha, formData.barbero_id]);

  const handleSelectService = (e, serviceId) => {
    e.stopPropagation();
    if (formData.servicio_id === serviceId.toString()) {
      setFormData({ ...formData, servicio_id: '' });
    } else {
      setFormData({ ...formData, servicio_id: serviceId.toString() });
    }
  };

  const handleSelectSlot = (slot) => {
    setFormData({
      ...formData,
      hora: slot.hora,
      barbero_id: slot.barbero_id.toString()
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!formData.servicio_id) {
      return setError('Por favor seleccioná un servicio haciendo clic en una de las tarjetas.');
    }
    if (!formData.hora || !formData.barbero_id) {
      return setError('Por favor elegí un horario disponible.');
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
      setFormData({ cliente_id: '', servicio_id: '', barbero_id: '', fecha: '', hora: '' });
      setAvailableSlots([]);
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

      {/* 2. BÚSQUEDA Y DISPONIBILIDAD DE HORARIOS */}
      <div className="reservation-form-container card shadow-sm border-0 rounded-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-calendar-event text-primary me-2"></i>2. Elegí Fecha y Barbero
          </h5>

          {message && <div className="alert alert-success rounded-3">{message}</div>}
          {error && <div className="alert alert-danger rounded-3">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Cliente */}
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted">Cliente</label>
                <select
                  className="form-select rounded-3 py-2"
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  required
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.email})</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted">1. Seleccionar Día</label>
                <input
                  type="date"
                  className="form-control rounded-3 py-2"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value, hora: '' })}
                  min={today}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  required
                />
              </div>

              {/* Barbero Opcional / Filtrar */}
              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted">2. Barbero (Opcional)</label>
                <select
                  className="form-select rounded-3 py-2"
                  value={formData.barbero_id}
                  onChange={(e) => setFormData({ ...formData, barbero_id: e.target.value, hora: '' })}
                >
                  <option value="">Cualquier Barbero Disponible</option>
                  {barberos.map((b) => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* GRILLA DE HORARIOS DISPONIBLES */}
            {formData.fecha && (
              <div className="mt-4">
                <h6 className="fw-bold text-secondary mb-3">
                  <i className="bi bi-clock-history me-1"></i>Turnos Disponibles para el {formData.fecha}
                </h6>

                {loadingSlots ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
                    <span className="ms-2 text-muted small">Buscando franjas horarias libres...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="alert alert-warning rounded-3 small">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    No hay turnos disponibles para esta fecha o barbero. Probá seleccionando otro día o barbero.
                  </div>
                ) : (
                  <div className="row g-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {availableSlots.map((slot, idx) => {
                      const isSelected = formData.hora === slot.hora && formData.barbero_id === slot.barbero_id.toString();

                      return (
                        <div key={idx} className="col-6 col-sm-4 col-md-3">
                          <button
                            type="button"
                            className={`btn w-100 btn-sm p-2 rounded-3 text-start border transition-all ${
                              isSelected
                                ? 'btn-primary shadow-sm'
                                : 'btn-outline-secondary text-dark border-opacity-25'
                            }`}
                            onClick={() => handleSelectSlot(slot)}
                          >
                            <div className="fw-bold fs-6">{slot.hora} hs</div>
                            <div className="small opacity-75 text-truncate">
                              <i className="bi bi-person me-1"></i>{slot.barbero_nombre}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Resumen Final de Reserva */}
            {selectedService && formData.fecha && formData.hora && (
              <div className="p-3 bg-light border rounded-3 mt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-bold text-primary">{selectedService.nombre}</span>
                    {selectedBarber && <span className="text-muted ms-2">con {selectedBarber.nombre}</span>}
                    <div className="small text-muted mt-1">
                      <i className="bi bi-calendar3 me-1"></i>
                      {formData.fecha} a las {formData.hora} hs ({selectedService.duracion_minutos} min)
                    </div>
                  </div>
                  <div className="fs-4 fw-bold text-success">${selectedService.precio}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-dark w-100 mt-4 py-2.5 fw-bold rounded-3"
              disabled={!formData.fecha || !formData.hora || !formData.servicio_id}
            >
              Confirmar Reserva
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};