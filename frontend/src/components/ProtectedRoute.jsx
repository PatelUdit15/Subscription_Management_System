import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole, allowedRoles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'Quicksand, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            animation: 'spin 1s linear infinite'
          }}>
            ⏳
          </div>
          <div style={{ color: '#71717a', fontSize: '1.1rem' }}>
            Loading...
          </div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Determine allowed roles
  let permitted = allowedRoles;
  if (!permitted && requiredRole) {
    if (requiredRole === 'admin') {
      // Back-office administration and operational workspace
      permitted = ['admin', 'internal'];
    } else if (requiredRole === 'admin_only') {
      // Strictly administrator only
      permitted = ['admin'];
    } else if (requiredRole === 'portal') {
      // Customer Portal is strictly for customer / subscriber users
      permitted = ['portal'];
    } else {
      permitted = [requiredRole];
    }
  }

  if (permitted && !permitted.includes(currentUser.role)) {
    // If a customer tries to access admin / operational routes
    if (currentUser.role === 'portal') {
      return <Navigate to="/shop" replace />;
    }
    // If staff (internal user or admin) tries to access customer portal routes
    if (currentUser.role === 'internal' || currentUser.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
