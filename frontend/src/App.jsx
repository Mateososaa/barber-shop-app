import { useState } from 'react';
import { ServiceList } from './components/ServiceList';
import { AppointmentForm } from './components/AppointmentForm';
import { AppointmentList } from './components/AppointmentList';

function App() {
  const [currentView, setCurrentView] = useState('cliente');
  const [refreshAppointments, setRefreshAppointments] = useState(0);

  const handleAppointmentCreated = () => {
    setRefreshAppointments((prev) => prev + 1);
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Header / Navbar Profesional */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm py-3">
        <div className="container">
          <a className="navbar-brand fw-bold d-flex align-items-center gap-2 fs-4" href="#">
            <i className="bi bi-scissors text-warning fs-3"></i>
            <span>Barbería <span className="text-warning">Studio</span></span>
          </a>

          <div className="d-flex gap-2 bg-secondary bg-opacity-25 p-1 rounded-pill border border-secondary border-opacity-50">
            <button
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                currentView === 'cliente' ? 'btn-warning text-dark shadow-sm' : 'btn-link text-white-50 text-decoration-none'
              }`}
              onClick={() => setCurrentView('cliente')}
            >
              <i className="bi bi-person-circle me-1"></i>Vista Cliente
            </button>
            <button
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                currentView === 'barbero' ? 'btn-warning text-dark shadow-sm' : 'btn-link text-white-50 text-decoration-none'
              }`}
              onClick={() => setCurrentView('barbero')}
            >
              <i className="bi bi-speedometer2 me-1"></i>Panel Barbero
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="container my-4 flex-grow-1">
        {currentView === 'cliente' ? (
          <div>
            {/* Banner de Bienvenida */}
            <div className="bg-dark text-white p-4 p-md-5 rounded-4 shadow-sm mb-4 position-relative overflow-hidden">
              <div className="position-relative z-1 col-md-8">
                <span className="badge bg-warning text-dark mb-2 px-3 py-2 rounded-pill fw-bold">
                  Reserva Online 24/7
                </span>
                <h1 className="display-6 fw-bold mb-2">Tu estilo, en manos de profesionales</h1>
                <p className="text-white-50 lead mb-0">
                  Elegí tu servicio preferido y agendá tu turno en segundos de forma rápida y sencilla.
                </p>
              </div>
            </div>

            {/* Grilla en 2 Columnas para Desktop */}
            <div className="row g-4">
              <div className="col-lg-5">
                <ServiceList />
              </div>
              <div className="col-lg-7">
                <AppointmentForm onAppointmentCreated={handleAppointmentCreated} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="fw-bold mb-1">
                  <i className="bi bi-calendar3-range me-2 text-primary"></i>Panel de Gestión
                </h2>
                <p className="text-muted mb-0">Administración de agenda y facturación diaria</p>
              </div>
            </div>
            <AppointmentList refreshTrigger={refreshAppointments} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-top py-3 text-center text-muted text-small mt-auto">
        <div className="container">
          <small>© {new Date().getFullYear()} Barbería Studio — Sistema de Gestión de Turnos</small>
        </div>
      </footer>
    </div>
  );
}

export default App;