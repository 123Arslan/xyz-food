import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, isDonor, isReceiver, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '9999px', border: '5px solid #e5e7eb', borderTop: '5px solid #10b981' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole === 'donor' && !isDonor) {
    // Redirect receiver or admin to their correct dashboards
    if (isReceiver) {
      return <Navigate to="/receiver-dashboard" replace />;
    }
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (allowedRole === 'receiver' && !isReceiver) {
    // Redirect donor or admin to their correct dashboards
    if (isDonor) {
      return <Navigate to="/donor-dashboard" replace />;
    }
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (allowedRole === 'admin' && !isAdmin) {
    // Redirect donor or receiver to their correct dashboards
    if (isDonor) {
      return <Navigate to="/donor-dashboard" replace />;
    }
    if (isReceiver) {
      return <Navigate to="/receiver-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
