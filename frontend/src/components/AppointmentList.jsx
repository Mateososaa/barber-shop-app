import { useState, useEffect, useCallback } from 'react';
import barberApi from '../api/barberApi';

export const AppointmentList = ({ refreshTrigger, user }) => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Filtros
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState('activos'); // 'activos' | 'finalizados' | 'todos'

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      
      // Si el usuario logueado es BARBERO, forzamos filtrar solo sus turnos
      if (user && user.rol === 'BARBERO') {
        params.barbero_id = user.id;
      } else if (selectedBarberId) {
        params.barbero_id = selectedBarberId;
      }

      const [appRes, servRes, usersRes] = await Promise.all([
        barberApi.get('/appointments/', { params }),
        barberApi.get('/services/'),
        barberApi.get('/users/')
      ]);

      setAppointments(appRes.data);
      setServices(servRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Error al cargar la agenda:', err);
    }
  }, [user, selectedBarberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de cancelar/eliminar este turno?')) return;
    try {
      await barberApi.delete(`/appointments/${id}`);
      fetchData();
    } catch (err) {
      alert('Error al cancelar el turno.');
    }
  };

  const getServiceInfo = (id) => services.find((s) => s.id === id) || { nombre: 'Servicio', precio: 0 };
  const getUserInfo = (id) => users.find((u) => u.id === id) || { nombre: 'Usuario' };

  const barberos = users.filter((u) => u.rol === 'BARBERO');
  const isBarberoRole = user && user.rol === 'BARBERO';

  // Filtrado de turnos en el frontend por fecha y estado
  const filteredAppointments = appointments.filter((app) => {
    // Si por algún motivo el backend mandó otros turnos, los filtramos en frontend también si es barbero
    if (isBarberoRole && app.barbero_id !== user.id) {
      return false;
    }

    // Filtro por fecha
    if (filterDate) {
      const fechaTurno = app.fecha_hora_inicio.split('T')[0];
      if (fechaTurno !== filterDate) return false;
    }

    // Filtro por pestañas de estado
    if (activeTab === 'activos') return app.estado === 'Reservado' || app.estado === 'En Curso';
    if (activeTab === 'finalizados') return app.estado === 'Finalizado';
    return true;
  });

  return (
    <div className="card shadow-sm border-0 rounded-4">
      <div className="card-body p-4">
        {/* Encabezado y Filtros */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h5 className="fw-bold mb-1">
              <i className="bi bi-calendar-check-fill text-primary me-2"></i>
              {isBarberoRole ? `Mi Agenda Personal (${user.nombre})` : 'Agenda General de Turnos'}
            </h5>
            <p className="text-muted small mb-0">
              {isBarberoRole
                ? 'Visualizando solo tus citas asignadas'
                : 'Gestión y control de turnos de la barbería'}
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            {/* Solo se muestra el selector de barberos si es ADMIN */}
            {!isBarberoRole && (
              <select
                className="form-select form-select-sm rounded-3"
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
              >
                <option value="">Todos los Barberos</option>
                {barberos.map((b) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            )}

            {/* Filtro por fecha */}
            <input
              type="date"
              className="form-control form-control-sm rounded-3"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />

            {filterDate && (
              <button className="btn btn-sm btn-outline-secondary rounded-3" onClick={() => setFilterDate('')}>
                Limpiar fecha
              </button>
            )}
          </div>
        </div>

        {/* Pestañas de Estado */}
        <div className="d-flex gap-2 border-bottom pb-3 mb-3">
          <button
            className={`btn btn-sm rounded-pill ${activeTab === 'activos' ? 'btn-primary' : 'btn-light text-muted'}`}
            onClick={() => setActiveTab('activos')}
          >
            Próximos y En Curso ({filteredAppointments.filter(a => a.estado !== 'Finalizado').length})
          </button>
          <button
            className={`btn btn-sm rounded-pill ${activeTab === 'finalizados' ? 'btn-primary' : 'btn-light text-muted'}`}
            onClick={() => setActiveTab('finalizados')}
          >
            Finalizados ({filteredAppointments.filter(a => a.estado === 'Finalizado').length})
          </button>
          <button
            className={`btn btn-sm rounded-pill ${activeTab === 'todos' ? 'btn-primary' : 'btn-light text-muted'}`}
            onClick={() => setActiveTab('todos')}
          >
            Todos ({filteredAppointments.length})
          </button>
        </div>

        {/* Tabla de Turnos */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-calendar-x fs-1 opacity-50 mb-2 d-block"></i>
            No hay turnos registrados con los filtros seleccionados.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  {!isBarberoRole && <th>Barbero</th>}
                  <th>Estado</th>
                  <th className="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((app) => {
                  const service = getServiceInfo(app.servicio_id);
                  const client = getUserInfo(app.cliente_id);
                  const barber = getUserInfo(app.barbero_id);
                  const fechaFormatted = new Date(app.fecha_hora_inicio).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={app.id}>
                      <td className="fw-semibold">{fechaFormatted} hs</td>
                      <td>
                        <div className="fw-bold">{client.nombre}</div>
                        <div className="small text-muted">{client.email}</div>
                      </td>
                      <td>
                        <span className="fw-semibold text-primary">{service.nombre}</span>
                        <div className="small text-success fw-bold">${service.precio}</div>
                      </td>
                      {!isBarberoRole && <td>{barber.nombre}</td>}
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            app.estado === 'Reservado'
                              ? 'bg-success'
                              : app.estado === 'En Curso'
                              ? 'bg-warning text-dark'
                              : 'bg-danger'
                          }`}
                        >
                          {app.estado}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-danger btn-sm rounded-3"
                          onClick={() => handleDelete(app.id)}
                          title="Cancelar Turno"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};