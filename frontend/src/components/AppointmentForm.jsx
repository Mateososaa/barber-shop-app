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

  return (
    <div className="card shadow-sm border-0 rounded-4">
      <div className="card-body p-4">
        <h4 className="card-title fw-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-calendar-plus text-primary"></i>Agendar Turno
        </h4>

        {message && <div className="alert alert-success rounded-3">{message}</div>}
        {error && <div className="alert alert-danger rounded-3">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Cliente</label>
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
              <label className="form-label fw-bold small text-muted">Barbero</label>
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

            <div className="col-12">
              <label className="form-label fw-bold small text-muted">Servicio</label>
              <select
                className="form-select rounded-3 py-2"
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
              <label className="form-label fw-bold small text-muted">Fecha del Turno</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 rounded-start-3">
                  <i className="bi bi-calendar-event text-primary"></i>
                </span>
                <input
                  type="date"
                  className="form-control border-start-0 rounded-end-3 py-2"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  min={today}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Hora del Turno</label>
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

          <button type="submit" className="btn btn-dark w-100 mt-4 py-2.5 fw-bold rounded-3">
            Confirmar Reserva
          </button>
        </form>
      </div>
    </div>
  );
};