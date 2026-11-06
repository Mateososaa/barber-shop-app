import { useState } from 'react';
import barberApi from '../api/barberApi';

export const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await barberApi.post('/login', { email, password });
      const { access_token, user } = response.data;

      // Guardar sesión en localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      onLoginSuccess(user);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Email o contraseña incorrectos.');
      } else {
        setError('Error al intentar iniciar sesión.');
      }
    }
  };

  return (
    <div className="row justify-content-center my-5">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4 text-center">
            <div className="bg-dark text-warning rounded-circle d-inline-flex p-3 mb-3">
              <i className="bi bi-shield-lock-fill fs-2"></i>
            </div>
            <h4 className="fw-bold mb-1">Acceso Administrativo</h4>
            <p className="text-muted small mb-4">Ingresá tus credenciales para gestionar el negocio</p>

            {error && <div className="alert alert-danger rounded-3 py-2 small">{error}</div>}

            <form onSubmit={handleSubmit} className="text-start">
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Email</label>
                <input
                  type="email"
                  className="form-control rounded-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@estudio.com"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold text-muted">Contraseña</label>
                <input
                  type="password"
                  className="form-control rounded-3 py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-dark w-100 fw-bold rounded-3 py-2.5">
                Iniciar Sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};