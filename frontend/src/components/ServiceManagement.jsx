import { useState, useEffect } from 'react';
import barberApi from '../api/barberApi';

export const ServiceManagement = ({ onServicesUpdated }) => {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({ nombre: '', duracion_minutos: 30, precio: '' });
  const [editingId, setEditingId] = useState(null); // ID del servicio que se está editando
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchServices = async () => {
    try {
      const res = await barberApi.get('/services/');
      setServices(res.data);
    } catch (err) {
      console.error('Error al cargar servicios:', err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Cargar los datos del servicio en el formulario para editar
  const handleEditClick = (service) => {
    setEditingId(service.id);
    setFormData({
      nombre: service.nombre,
      duracion_minutos: service.duracion_minutos,
      precio: service.precio
    });
    setMessage(null);
    setError(null);
  };

  // Cancelar la edición y limpiar formulario
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', duracion_minutos: 30, precio: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      if (editingId) {
        // Petición PUT para actualizar
        await barberApi.put(`/services/${editingId}`, {
          nombre: formData.nombre,
          duracion_minutos: parseInt(formData.duracion_minutos),
          precio: parseFloat(formData.precio)
        });
        setMessage('¡Servicio actualizado con éxito!');
        setEditingId(null);
      } else {
        // Petición POST para crear
        await barberApi.post('/services/', {
          nombre: formData.nombre,
          duracion_minutos: parseInt(formData.duracion_minutos),
          precio: parseFloat(formData.precio)
        });
        setMessage('¡Servicio agregado con éxito!');
      }

      setFormData({ nombre: '', duracion_minutos: 30, precio: '' });
      fetchServices();
      if (onServicesUpdated) onServicesUpdated();
    } catch (err) {
      setError(editingId ? 'Error al actualizar el servicio.' : 'Error al crear el servicio.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;
    try {
      await barberApi.delete(`/services/${id}`);
      fetchServices();
      if (onServicesUpdated) onServicesUpdated();
    } catch (err) {
      alert('No se pudo eliminar el servicio.');
    }
  };

  return (
    <div className="row g-4">
      {/* Formulario de Alta / Edición */}
      <div className="col-md-5">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
              <span>
                <i className={`bi ${editingId ? 'bi-pencil-square text-warning' : 'bi-plus-circle text-primary'} me-2`}></i>
                {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
              </span>
              {editingId && (
                <button className="btn btn-sm btn-outline-secondary" onClick={handleCancelEdit}>
                  Cancelar
                </button>
              )}
            </h5>

            {message && <div className="alert alert-success rounded-3">{message}</div>}
            {error && <div className="alert alert-danger rounded-3">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Nombre del Servicio</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Corte + Barba"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Duración (minutos)</label>
                <select
                  className="form-select rounded-3"
                  name="duracion_minutos"
                  value={formData.duracion_minutos}
                  onChange={handleChange}
                >
                  <option value="30">30 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Precio ($)</label>
                <input
                  type="number"
                  className="form-control rounded-3"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  placeholder="Ej: 5000"
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn w-100 fw-bold rounded-3 py-2 ${
                  editingId ? 'btn-warning text-dark' : 'btn-dark'
                }`}
              >
                {editingId ? 'Guardar Cambios' : 'Guardar Servicio'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabla de servicios existentes */}
      <div className="col-md-7">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-scissors me-2"></i>Servicios Existentes
            </h5>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Nombre</th>
                    <th>Duración</th>
                    <th>Precio</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className={editingId === s.id ? 'table-warning' : ''}>
                      <td className="fw-semibold">{s.nombre}</td>
                      <td>{s.duracion_minutos} min</td>
                      <td className="text-success fw-bold">${s.precio}</td>
                      <td className="text-end">
                        <div className="btn-group">
                          <button
                            className="btn btn-outline-primary btn-sm rounded-start-3"
                            onClick={() => handleEditClick(s)}
                            title="Editar servicio"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm rounded-end-3"
                            onClick={() => handleDelete(s.id)}
                            title="Eliminar servicio"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};