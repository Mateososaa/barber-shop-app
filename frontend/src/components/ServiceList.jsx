import { useEffect, useState } from 'react';
import barberApi from '../api/barberApi';

export const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    barberApi.get('/services/')
      .then((response) => {
        setServices(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al obtener servicios:', err);
        setError('No se pudieron cargar los servicios');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center my-4"><div className="spinner-border text-primary" role="status"></div></div>;
  if (error) return <div className="alert alert-danger my-4">{error}</div>;

  return (
    <div className="container my-4">
      <h3 className="mb-3"><i className="bi bi-scissors me-2"></i>Nuestros Servicios</h3>
      <div className="row">
        {services.length === 0 ? (
          <p>No hay servicios registrados aún.</p>
        ) : (
          services.map((s) => (
            <div key={s.id} className="col-md-4 mb-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="card-title fw-bold">{s.nombre}</h5>
                  <p className="card-text text-muted mb-1">
                    <i className="bi bi-clock me-1"></i>{s.duracion_minutos} minutos
                  </p>
                  <p className="card-text text-success fw-bold fs-5 mb-0">
                    ${s.precio}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};