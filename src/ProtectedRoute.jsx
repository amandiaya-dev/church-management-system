import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, userRole, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If admin-only route and user is not admin, redirect to dashboard
  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;