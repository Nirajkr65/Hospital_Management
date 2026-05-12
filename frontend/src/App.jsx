import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DisplayBoard from './pages/DisplayBoard';
import Navbar from './components/Navbar';

// A generic protected route
const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Role-based protected route
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useContext(AuthContext);
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (user && !allowedRoles.includes(user.role)) {
    // If logged in but unauthorized role, send to their respective dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return children;
};

// Router logic to redirect root to the correct dashboard based on role
const RootRedirect = () => {
  const { user, token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role) return <Navigate to={`/${user.role}`} replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <>
    <Navbar />
    <Routes>
      <Route path="/display" element={<DisplayBoard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Root redirect handles logged in user sending to right dashboard */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Patient Routes */}
      <Route path="/patient" element={
        <RoleProtectedRoute allowedRoles={['patient']}>
          <PatientDashboard />
        </RoleProtectedRoute>
      } />
      
      {/* Doctor Routes */}
      <Route path="/doctor" element={
        <RoleProtectedRoute allowedRoles={['doctor']}>
          <DoctorDashboard />
        </RoleProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <RoleProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </RoleProtectedRoute>
      } />
      
      {/* Catch-all redirect */}
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
