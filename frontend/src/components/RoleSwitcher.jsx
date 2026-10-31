import React from 'react';
import { useAuth } from '../context/AuthContext';

const RoleSwitcher = () => {
  const { currentUser, switchRole } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      padding: '1rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 29, 57, 0.2)',
      zIndex: 9999,
      fontFamily: 'Quicksand, sans-serif'
    }}>
      <div style={{
        fontSize: '0.85rem',
        color: '#49769F',
        marginBottom: '0.5rem',
        fontWeight: '600'
      }}>
        🔧 Dev Mode - Switch Role
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => switchRole('admin')}
          style={{
            padding: '0.5rem 1rem',
            background: currentUser?.role === 'admin' ? '#0A4174' : '#BDD8E9',
            color: currentUser?.role === 'admin' ? 'white' : '#001D39',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Admin
        </button>
        <button
          onClick={() => switchRole('portal')}
          style={{
            padding: '0.5rem 1rem',
            background: currentUser?.role === 'portal' ? '#0A4174' : '#BDD8E9',
            color: currentUser?.role === 'portal' ? 'white' : '#001D39',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Customer
        </button>
      </div>
    </div>
  );
};

export default RoleSwitcher;
