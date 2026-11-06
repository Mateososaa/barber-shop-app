import { useState, useEffect } from 'react';
import barberApi from '../api/barberApi';

export const AppointmentForm = ({ onAppointmentCreated }) => {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    barbero_id: '',
    servicio_id: '',
    fecha_hora_inicio: ''
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Fecha y hora actual formateada en hora local (YYYY-MM-DDTHH:mm) para el atributo min
  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  // Cargar barberos, clientes y servicios para los selects
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await barberApi.post('/appointments/', {
        cliente_id: parseInt(formData.cliente_id),
        barbero_id: parseInt(formData.barbero_id),
        servicio_id: parseInt(formData.servicio_id),
        fecha_hora_inicio: formData.fecha_hora_inicio
      });

      setMessage('¡Turno reservado exitosamente!');
      setFormData({ cliente_id: '', barbero_id: '', servicio_id: '', fecha_hora_inicio: '' });
      if (onAppointmentCreated) onAppointmentCreated(response.data);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError(err.response.data.detail);
      } else {
        setError('Ocurrió un error al intentar agendar el turno.');
      }
    }
  };

  const barberos = users.filter((u) => u.rol === 'BARBERO');
  const clientes = users.filter((u) => u.rol === 'CLIENTE');

  return (
    <div className="card shadow-sm border-0 my-4">
      <div className="card-body p-4">
        <h4 className="card-title fw-bold mb-3">
          <i className="bi bi-calendar-plus me-2"></i>Agendar Turno
        </h4>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Cliente</label>
              <select
                className="form-select"
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
              <label className="form-label fw-bold">Barbero</label>
              <select
                className="form-select"
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
              <label className="form-label fw-bold">Servicio</label>
              <select
                className="form-select"
                name="servicio_id"
                value={formData.servicio_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar Servicio...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre} (${s.precio})</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Fecha y Hora del Turno</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-calendar-event text-primary"></i>
                </span>
                <input
                  type="datetime-local"
                  className="form-control border-start-0"
                  name="fecha_hora_inicio"
                  value={formData.fecha_hora_inicio}
                  onChange={handleChange}
                  min={minDateTime}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  required
                />
              </div>
              <small className="form-text text-muted">
                Hacé clic en el campo para desplegar el almanaque.
              </small>
            </div>
          </div>

          <button type="submit" className="btn btn-dark w-100 mt-4 py-2 fw-bold">
            Confirmar Reserva
          </button>
        </form>
      </div>
    </div>
  );
};