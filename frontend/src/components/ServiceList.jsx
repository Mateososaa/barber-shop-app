import { useEffect, useState } from 'react';
import barberApi from '../api/barberApi';

export const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await barberApi.get('/services/');
        setServices(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar servicios:', error);
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-dark" role="status"></div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 rounded-4">
      <div className="card-body p-4">
        <h4 className="card-title fw-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-stars text-warning"></i>Nuestros Servicios
        </h4>
        <p className="text-muted small mb-4">Conocé lo que ofrecemos en nuestro salón</p>

        <div className="d-flex flex-column gap-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center hover-shadow"
            >
              <div>
                <h6 className="fw-bold mb-1">{service.nombre}</h6>
                <span className="text-muted small">
                  <i className="bi bi-clock me-1"></i>{service.duracion_minutos} min
                </span>
              </div>
              <div className="text-end">
                <span className="fs-5 fw-bold text-success">${service.precio}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};