import { useState } from 'react';
import { AppointmentForm } from './components/AppointmentForm';
import { AppointmentList } from './components/AppointmentList';
import { ServiceManagement } from './components/ServiceManagement';
import { BarberList } from './components/BarberList';
import { BarberScheduleManagement } from './components/BarberScheduleManagement';

function App() {
  const [currentView, setCurrentView] = useState('cliente');
  const [adminTab, setAdminTab] = useState('agenda'); // 'agenda' | 'servicios' | 'barberos' | 'horarios'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Navbar Principal */}
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
              <i className="bi bi-speedometer2 me-1"></i>Panel Dueño / Admin
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container my-4 flex-grow-1">
        {currentView === 'cliente' ? (
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Banner de Bienvenida */}
              <div className="bg-dark text-white p-4 p-md-5 rounded-4 shadow-sm mb-4 position-relative overflow-hidden">
                <div className="position-relative z-1">
                  <span className="badge bg-warning text-dark mb-2 px-3 py-2 rounded-pill fw-bold">
                    Reserva Online 24/7
                  </span>
                  <h1 className="display-6 fw-bold mb-2">Tu estilo, en manos de profesionales</h1>
                  <p className="text-white-50 lead mb-0">
                    Elegí tu servicio, barbero y horario en 2 sencillos pasos.
                  </p>
                </div>
              </div>

              {/* Único flujo interactivo de Reserva */}
              <AppointmentForm onAppointmentCreated={handleRefresh} />
            </div>
          </div>
        ) : (
          <div>
            {/* Encabezado y Navegación del Admin */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
              <div>
                <h2 className="fw-bold mb-1">
                  <i className="bi bi-gear-fill me-2 text-primary"></i>Centro de Control Barbería
                </h2>
                <p className="text-muted mb-0">Gestión integral de turnos, servicios, equipo y jornadas</p>
              </div>

              {/* Botones de navegación en sub-pestañas */}
              <div className="btn-group shadow-sm">
                <button
                  className={`btn ${adminTab === 'agenda' ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => setAdminTab('agenda')}
                >
                  <i className="bi bi-calendar-check me-1"></i>Agenda
                </button>
                <button
                  className={`btn ${adminTab === 'servicios' ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => setAdminTab('servicios')}
                >
                  <i className="bi bi-stars me-1"></i>Servicios
                </button>
                <button
                  className={`btn ${adminTab === 'barberos' ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => setAdminTab('barberos')}
                >
                  <i className="bi bi-people me-1"></i>Barberos
                </button>
                <button
                  className={`btn ${adminTab === 'horarios' ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => setAdminTab('horarios')}
                >
                  <i className="bi bi-clock-history me-1"></i>Horarios
                </button>
              </div>
            </div>

            {/* Sub-vistas Admin */}
            {adminTab === 'agenda' && <AppointmentList refreshTrigger={refreshTrigger} />}
            {adminTab === 'servicios' && <ServiceManagement onServicesUpdated={handleRefresh} />}
            {adminTab === 'barberos' && <BarberList />}
            {adminTab === 'horarios' && <BarberScheduleManagement />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;