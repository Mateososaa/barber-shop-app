import { useState, useEffect } from 'react';
import barberApi from '../api/barberApi';

export const BarberList = () => {
  const [users, setUsers] = useState([]);
  const [newBarber, setNewBarber] = useState({ nombre: '', email: '', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await barberApi.get('/users/');
      setUsers(res.data);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const barberos = users.filter((u) => u.rol === 'BARBERO');

  const handleEditClick = (barber) => {
    setEditingId(barber.id);
    setNewBarber({
      nombre: barber.nombre,
      email: barber.email,
      password: ''
    });
    setMessage(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewBarber({ nombre: '', email: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      if (editingId) {
        // Petición PUT para actualizar
        await barberApi.put(`/users/${editingId}`, {
          ...newBarber,
          rol: 'BARBERO'
        });
        setMessage('¡Barbero actualizado con éxito!');
        setEditingId(null);
      } else {
        // Petición POST para crear
        await barberApi.post('/users/', {
          ...newBarber,
          rol: 'BARBERO'
        });
        setMessage('¡Barbero registrado con éxito!');
      }

      setNewBarber({ nombre: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      setError(
        editingId
          ? 'Error al actualizar el barbero (verifica el email).'
          : 'Error al registrar el barbero (verifica que el email no esté en uso).'
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este barbero? Se eliminarán también sus turnos y horarios.')) return;
    try {
      await barberApi.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('No se pudo eliminar el barbero.');
    }
  };

  return (
    <div className="row g-4">
      {/* Formulario de Alta / Edición de Barbero */}
      <div className="col-md-5">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
              <span>
                <i className={`bi ${editingId ? 'bi-pencil-square text-warning' : 'bi-person-plus-fill text-primary'} me-2`}></i>
                {editingId ? 'Editar Barbero' : 'Nuevo Barbero'}
              </span>
              {editingId && (
                <button className="btn btn-sm btn-outline-secondary" onClick={handleCancelEdit}>
                  Cancelar
                </button>
              )}
            </h5>

            {message && <div className="alert alert-success rounded-3 py-2 small">{message}</div>}
            {error && <div className="alert alert-danger rounded-3 py-2 small">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Nombre Completo</label>
                <input
                  type="text"
                  className="form-control rounded-3 py-2"
                  value={newBarber.nombre}
                  onChange={(e) => setNewBarber({ ...newBarber, nombre: e.target.value })}
                  placeholder="Ej: Martin Palermo"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Email Profesional</label>
                <input
                  type="email"
                  className="form-control rounded-3 py-2"
                  value={newBarber.email}
                  onChange={(e) => setNewBarber({ ...newBarber, email: e.target.value })}
                  placeholder="barbero@estudio.com"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">
                  {editingId ? 'Nueva Contraseña (o actual)' : 'Contraseña Acceso'}
                </label>
                <input
                  type="password"
                  className="form-control rounded-3 py-2"
                  value={newBarber.password}
                  onChange={(e) => setNewBarber({ ...newBarber, password: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                className={`btn w-100 fw-bold rounded-3 py-2 ${
                  editingId ? 'btn-warning text-dark' : 'btn-dark'
                }`}
              >
                {editingId ? 'Guardar Cambios' : 'Guardar Barbero'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lista de Barberos Registrados */}
      <div className="col-md-7">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-people-fill me-2"></i>Equipo de Barberos
            </h5>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {barberos.map((b) => (
                    <tr key={b.id} className={editingId === b.id ? 'table-warning' : ''}>
                      <td>#{b.id}</td>
                      <td className="fw-bold">{b.nombre}</td>
                      <td className="text-muted">{b.email}</td>
                      <td className="text-end">
                        <div className="btn-group">
                          <button
                            className="btn btn-outline-primary btn-sm rounded-start-3"
                            onClick={() => handleEditClick(b)}
                            title="Editar barbero"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm rounded-end-3"
                            onClick={() => handleDelete(b.id)}
                            title="Eliminar barbero"
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