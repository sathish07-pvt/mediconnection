import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SelectRole from './pages/auth/SelectRole';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Dashboards
import PatientDashboard from './pages/patient/Dashboard';
import CaretakerDashboard from './pages/caretaker/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';

import { useEffect } from 'react';
import { startReminderEngine } from './offline/reminderEngine';

function App() {
  useEffect(() => {
    startReminderEngine();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Landing Page (Split Layout: Left Project Image/Preview + Right Sign In / Role Selection) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/select-role" element={<SelectRole />} />

        {/* Protected Dashboards (with Left Sidebar Navigation) */}
        <Route element={<DashboardLayout />}>
          <Route path="/patient/*" element={<PatientDashboard />} />
          <Route path="/caretaker/*" element={<CaretakerDashboard />} />
          <Route path="/doctor/*" element={<DoctorDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
