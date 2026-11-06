    import { useEffect, useState } from 'react';
import barberApi from '../api/barberApi';

export const AppointmentList = ({ refreshTrigger }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const response = await barberApi.get('/appointments/');
      setAppointments(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar turnos:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [refreshTrigger]);

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

  if (loading) return <div className="text-center my-3"><div className="spinner-border text-dark" role="status"></div></div>;

  return (
    <div className="card shadow-sm border-0 my-4">
      <div className="card-body p-4">
        <h4 className="card-title fw-bold mb-3">
          <i className="bi bi-calendar-check me-2"></i>Turnos Agendados
        </h4>

        {appointments.length === 0 ? (
          <p className="text-muted">No hay turnos registrados actualmente.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Cliente ID</th>
                  <th>Barbero ID</th>
                  <th>Servicio ID</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((app) => (
                  <tr key={app.id}>
                    <td>#{app.id}</td>
                    <td>Cliente {app.cliente_id}</td>
                    <td>Barbero {app.barbero_id}</td>
                    <td>Servicio {app.servicio_id}</td>
                    <td>{formatFecha(app.fecha_hora_inicio)}</td>
                    <td>{formatFecha(app.fecha_hora_fin)}</td>
                    <td>
                      <span className="badge bg-success">{app.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};