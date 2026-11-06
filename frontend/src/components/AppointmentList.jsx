import { useEffect, useState } from 'react';
import barberApi from '../api/barberApi';

export const AppointmentList = ({ refreshTrigger }) => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [statusTab, setStatusTab] = useState('activos'); // 'activos' | 'finalizados' | 'todos'

  const fetchData = async () => {
    try {
      const [appRes, servRes] = await Promise.all([
        barberApi.get('/appointments/'),
        barberApi.get('/services/')
      ]);
      setAppointments(appRes.data);
      setServices(servRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar agenda:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Estás seguro de cancelar el turno #${id}?`)) return;

    try {
      await barberApi.delete(`/appointments/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error al eliminar turno:', err);
      alert('No se pudo cancelar el turno.');
    }
  };

  const formatFecha = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case 'Reservado':
        return <span className="badge bg-success fw-bold">Reservado</span>;
      case 'En Curso':
        return <span className="badge bg-warning text-dark fw-bold">En Curso</span>;
      case 'Finalizado':
        return <span className="badge bg-danger fw-bold">Finalizado</span>;
      default:
        return <span className="badge bg-secondary">{estado}</span>;
    }
  };

  // 1. Filtrado por fecha
  let filteredAppointments = filterDate
    ? appointments.filter((app) => app.fecha_hora_inicio.startsWith(filterDate))
    : appointments;

  // 2. Filtrado por Pestaña de Estado
  if (statusTab === 'activos') {
    filteredAppointments = filteredAppointments.filter(
      (app) => app.estado === 'Reservado' || app.estado === 'En Curso'
    );
  } else if (statusTab === 'finalizados') {
    filteredAppointments = filteredAppointments.filter((app) => app.estado === 'Finalizado');
  }

  // 3. Ordenamiento cronológico (más antiguos/próximos primero)
  filteredAppointments.sort(
    (a, b) => new Date(a.fecha_hora_inicio) - new Date(b.fecha_hora_inicio)
  );

  const getServiceInfo = (servicioId) => {
    const service = services.find((s) => s.id === servicioId);
    return service ? `${service.nombre} ($${service.precio})` : `Servicio #${servicioId}`;
  };

  const totalEstimado = filteredAppointments.reduce((acc, app) => {
    const service = services.find((s) => s.id === app.servicio_id);
    return acc + (service ? service.precio : 0);
  }, 0);

  if (loading) return <div className="text-center my-4"><div className="spinner-border text-dark" role="status"></div></div>;

  return (
    <div>
      {/* Tarjetas de métricas rápidas */}
      <div className="row mb-4">
        <div className="col-md-6 mb-2">
          <div className="card border-0 shadow-sm bg-dark text-white">
            <div className="card-body d-flex justify-content-between align-items-center p-3">
              <div>
                <h6 className="card-subtitle text-white-50 mb-1">Turnos Visibles</h6>
                <h3 className="card-title mb-0 fw-bold">{filteredAppointments.length}</h3>
              </div>
              <i className="bi bi-calendar-event fs-1 text-white-50"></i>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-2">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body d-flex justify-content-between align-items-center p-3">
              <div>
                <h6 className="card-subtitle text-white-50 mb-1">Recaudación Estimada</h6>
                <h3 className="card-title mb-0 fw-bold">${totalEstimado}</h3>
              </div>
              <i className="bi bi-cash-stack fs-1 text-white-50"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Agenda con Filtros */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
            <h4 className="card-title fw-bold mb-0">
              <i className="bi bi-calendar-check me-2"></i>Agenda de Turnos
            </h4>

            {/* Filtro por Día */}
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 fw-bold text-nowrap">Filtrar Día:</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-calendar-event text-primary"></i>
                </span>
                <input
                  type="date"
                  className="form-control border-start-0"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                />
              </div>
              {filterDate && (
                <button
                  className="btn btn-sm btn-outline-secondary text-nowrap"
                  onClick={() => setFilterDate('')}
                  title="Limpiar filtro"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Pestañas de estado (Tabs) */}
          <ul className="nav nav-pills mb-3 border-bottom pb-2">
            <li className="nav-item">
              <button
                className={`nav-link btn-sm ${statusTab === 'activos' ? 'active bg-dark' : 'text-dark'}`}
                onClick={() => setStatusTab('activos')}
              >
                <i className="bi bi-play-circle me-1"></i>Activos (Reservados / En Curso)
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn-sm ${statusTab === 'finalizados' ? 'active bg-danger' : 'text-dark'}`}
                onClick={() => setStatusTab('finalizados')}
              >
                <i className="bi bi-check2-circle me-1"></i>Finalizados
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn-sm ${statusTab === 'todos' ? 'active bg-secondary' : 'text-dark'}`}
                onClick={() => setStatusTab('todos')}
              >
                <i className="bi bi-list-stars me-1"></i>Todos
              </button>
            </li>
          </ul>

          {filteredAppointments.length === 0 ? (
            <p className="text-muted my-3">No hay turnos para la vista o fecha seleccionada.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Barbero</th>
                    <th>Servicio</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Estado</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((app) => (
                    <tr key={app.id}>
                      <td>#{app.id}</td>
                      <td>Cliente #{app.cliente_id}</td>
                      <td>Barbero #{app.barbero_id}</td>
                      <td>{getServiceInfo(app.servicio_id)}</td>
                      <td>{formatFecha(app.fecha_hora_inicio)}</td>
                      <td>{formatFecha(app.fecha_hora_fin)}</td>
                      <td>{renderBadgeEstado(app.estado)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(app.id)}
                          title="Cancelar turno"
                        >
                          <i className="bi bi-trash me-1"></i>Cancelar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};