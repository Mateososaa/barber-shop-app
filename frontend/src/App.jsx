import { useState } from 'react';
import { ServiceList } from './components/ServiceList';
import { AppointmentForm } from './components/AppointmentForm';
import { AppointmentList } from './components/AppointmentList';

function App() {
  const [refreshAppointments, setRefreshAppointments] = useState(0);

  const handleAppointmentCreated = () => {
    // Incrementamos el contador para disparar el useEffect de la lista
    setRefreshAppointments((prev) => prev + 1);
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">
            <i className="bi bi-scissors me-2"></i>Barbería Studio
          </a>
        </div>
      </nav>

      <main className="container py-3">
        <ServiceList />
        <AppointmentForm onAppointmentCreated={handleAppointmentCreated} />
        <AppointmentList refreshTrigger={refreshAppointments} />
      </main>
    </div>
  );
}

export default App;