import { useState, useEffect } from 'react';
import barberApi from '../api/barberApi';

export const BarberManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  
  // Formulario nuevo barbero
  const [newBarber, setNewBarber] = useState({ nombre: '', email: '', password: '' });

  // Formulario nuevo horario
  const [schedule, setSchedule] = useState({
    dia_semana: 0,
    hora_apertura: '09:00',
    hora_cierre: '18:00'
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const fetchUsers = async () => {
    try {
      const res = await barberApi.get('/users/');
      setUsers(res.data);
      // Seleccionar el primer barbero automáticamente si no hay ninguno seleccionado
      const barberosList = res.data.filter((u) => u.rol === 'BARBERO');
      if (barberosList.length > 0 && !selectedBarberId) {
        setSelectedBarberId(barberosList[0].id.toString());
      }
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const barberos = users.filter((u) => u.rol === 'BARBERO');
  const activeBarber = barberos.find((b) => b.id.toString() === selectedBarberId);

  const handleCreateBarber = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await barberApi.post('/users/', {
        ...newBarber,
        rol: 'BARBERO'
      });
      setMessage('¡Barbero registrado con éxito!');
      setNewBarber({ nombre: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      setError('Error al registrar el barbero (verifica que el email no exista).');
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!selectedBarberId) return alert('Seleccioná un barbero.');

    try {
      await barberApi.post(`/users/${selectedBarberId}/schedules/`, {
        dia_semana: parseInt(schedule.dia_semana),
        hora_apertura: schedule.hora_apertura,
        hora_cierre: schedule.hora_cierre
      });
      setMessage('¡Franja horaria asignada correctamente!');
      fetchUsers();
    } catch (err) {
      setError('Error al agregar la franja horaria.');
    }
  };

  // Organizar los horarios del barbero seleccionado en las 7 casillas de la semana
  const getScheduleForDay = (dayIndex) => {
    if (!activeBarber || !activeBarber.horarios) return [];
    return activeBarber.horarios.filter((h) => h.dia_semana === dayIndex);
  };

  return (
    <div className="row g-4">
      {/* Columna Izquierda: Crear Barbero y Agregar Franja */}
      <div className="col-lg-4">
        {/* Card 1: Nuevo Barbero */}
        <div className="card shadow-sm border-0 rounded-4 mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-person-plus-fill text-primary me-2"></i>Registrar Barbero
            </h5>

            {message && <div className="alert alert-success rounded-3 py-2 small">{message}</div>}
            {error && <div className="alert alert-danger rounded-3 py-2 small">{error}</div>}

            <form onSubmit={handleCreateBarber}>
              <div className="mb-2">
                <label className="form-label small fw-bold text-muted mb-1">Nombre Completo</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  value={newBarber.nombre}
                  onChange={(e) => setNewBarber({ ...newBarber, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-bold text-muted mb-1">Email</label>
                <input
                  type="email"
                  className="form-control form-control-sm rounded-3"
                  value={newBarber.email}
                  onChange={(e) => setNewBarber({ ...newBarber, email: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted mb-1">Contraseña</label>
                <input
                  type="password"
                  className="form-control form-control-sm rounded-3"
                  value={newBarber.password}
                  onChange={(e) => setNewBarber({ ...newBarber, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-dark btn-sm w-100 fw-bold rounded-3 py-2">
                Guardar Barbero
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Asignar Horario */}
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-clock-fill text-warning me-2"></i>Asignar Horario
            </h5>

            <form onSubmit={handleAddSchedule} className="row g-2">
              <div className="col-12 mb-1">
                <label className="form-label small fw-bold text-muted mb-1">Barbero Seleccionado</label>
                <select
                  className="form-select form-select-sm rounded-3 fw-semibold text-primary"
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {barberos.map((b) => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-muted mb-1">Día de Trabajo</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={schedule.dia_semana}
                  onChange={(e) => setSchedule({ ...schedule, dia_semana: e.target.value })}
                >
                  {diasSemana.map((dia, idx) => (
                    <option key={idx} value={idx}>{dia}</option>
                  ))}
                </select>
              </div>

              <div className="col-6">
                <label className="form-label small fw-bold text-muted mb-1">Apertura</label>
                <input
                  type="time"
                  className="form-control form-control-sm rounded-3"
                  value={schedule.hora_apertura}
                  onChange={(e) => setSchedule({ ...schedule, hora_apertura: e.target.value })}
                  required
                />
              </div>

              <div className="col-6">
                <label className="form-label small fw-bold text-muted mb-1">Cierre</label>
                <input
                  type="time"
                  className="form-control form-control-sm rounded-3"
                  value={schedule.hora_cierre}
                  onChange={(e) => setSchedule({ ...schedule, hora_cierre: e.target.value })}
                  required
                />
              </div>

              <div className="col-12 mt-3">
                <button type="submit" className="btn btn-warning btn-sm w-100 fw-bold rounded-3 py-2 text-dark">
                  + Añadir a la Semana
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Vista Semanal del Barbero */}
      <div className="col-lg-8">
        <div className="card shadow-sm border-0 rounded-4 h-100">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-1">
                  <i className="bi bi-calendar-week-fill me-2 text-primary"></i>
                  Jornada Semanal
                </h5>
                <p className="text-muted small mb-0">
                  {activeBarber ? `Horarios configurados para ${activeBarber.nombre}` : 'Seleccioná un barbero para ver su semana'}
                </p>
              </div>

              {/* Selector de barbero rápido */}
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-dark px-3 py-2 rounded-pill">
                  {activeBarber ? activeBarber.nombre : 'Sin Selección'}
                </span>
              </div>
            </div>

            {/* Grilla Semanal (7 días) */}
            <div className="row g-3">
              {diasSemana.map((dia, idx) => {
                const daySchedules = getScheduleForDay(idx);
                const isWorking = daySchedules.length > 0;

                return (
                  <div key={idx} className="col-md-6 col-xl-4">
                    <div className={`p-3 rounded-4 border ${isWorking ? 'bg-white border-primary border-opacity-50 shadow-sm' : 'bg-light border-0'}`}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className={`fw-bold small ${isWorking ? 'text-primary' : 'text-muted'}`}>
                          {dia}
                        </span>
                        <span className={`badge ${isWorking ? 'bg-primary' : 'bg-secondary bg-opacity-25 text-muted'} rounded-pill`}>
                          {isWorking ? 'Activo' : 'Franco'}
                        </span>
                      </div>

                      {isWorking ? (
                        <div className="d-flex flex-column gap-1">
                          {daySchedules.map((h) => (
                            <div key={h.id} className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 small fw-semibold d-flex justify-content-between align-items-center">
                              <span>
                                <i className="bi bi-clock me-1"></i>
                                {h.hora_apertura.slice(0, 5)} hs - {h.hora_cierre.slice(0, 5)} hs
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted small mb-0 fst-italic">Sin horario asignado</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};