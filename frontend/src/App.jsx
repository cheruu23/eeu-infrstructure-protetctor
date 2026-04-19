import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import ApproverDashboard from './pages/ApproverDashboard';
import ElectricianDashboard from './pages/ElectricianDashboard';
import AdminDashboard from './pages/AdminDashboard';

function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/"         element={user ? <Navigate to={`/${user.role}`} /> : <Home />} />
        <Route path="/login"    element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
        <Route path="/citizen"  element={<PrivateRoute role="citizen"><CitizenDashboard /></PrivateRoute>} />
        <Route path="/approver" element={<PrivateRoute role="approver"><ApproverDashboard /></PrivateRoute>} />
        <Route path="/electrician" element={<PrivateRoute role="electrician"><ElectricianDashboard /></PrivateRoute>} />
        <Route path="/admin"    element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="*"         element={<Navigate to={user ? `/${user.role}` : '/'} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
