import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
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

  // Check role-based access
  if (requiredRole) {
    if (requiredRole === 'admin' && currentUser.role !== 'admin') {
      // Non-admin trying to access admin routes
      return <Navigate to="/shop" replace />;
    }
    
    if (requiredRole === 'portal' && currentUser.role === 'admin') {
      // Admin trying to access customer routes
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
