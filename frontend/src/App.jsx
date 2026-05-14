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


const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};


const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useContext(AuthContext);
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (user && !allowedRoles.includes(user.role)) {

    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return children;
};


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
      

      <Route path="/" element={<RootRedirect />} />
      

      <Route path="/patient" element={
        <RoleProtectedRoute allowedRoles={['patient']}>
          <PatientDashboard />
        </RoleProtectedRoute>
      } />
      

      <Route path="/doctor" element={
        <RoleProtectedRoute allowedRoles={['doctor']}>
          <DoctorDashboard />
        </RoleProtectedRoute>
      } />
      

      <Route path="/admin" element={
        <RoleProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </RoleProtectedRoute>
      } />
      

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
