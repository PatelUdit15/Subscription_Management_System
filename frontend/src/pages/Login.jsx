import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email: formData.email, loginType });
      
      const response = await axios.post('/auth/login', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });
      
      console.log('Login response:', response.data);
      
      const { access_token, user } = response.data;
      
      console.log('User role:', user.role, 'Login type:', loginType);
      
      // Verify role matches login type
      if (loginType === 'admin') {
        if (user.role !== 'admin') {
          setError('Access denied. Admin credentials required.');
          setLoading(false);
          return;
        }
      } else {
        if (user.role === 'admin') {
          setError('Please use Admin Login for administrator accounts.');
          setLoading(false);
          return;
        }
      }
      
      // Store token and user
      console.log('Calling login function with token and user');
      login(access_token, user);
      
      // Redirect based on role
      const redirectPath = (user.role === 'admin' || user.role === 'internal') ? '/admin' : '/shop';
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(err.response?.data?.detail || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchLoginType = (type) => {
    setLoginType(type);
    setError('');
    setFormData({ email: '', password: '' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: loginType === 'admin' 
        ? 'linear-gradient(135deg, #875A7B 0%, #A6789C 100%)'
        : 'linear-gradient(135deg, #001D39 0%, #0A4174 50%, #49769F 100%)',
      padding: '2rem',
      transition: 'background 0.3s ease'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: loginType === 'admin'
          ? '0 20px 60px rgba(135, 90, 123, 0.3)'
          : '0 20px 60px rgba(0, 29, 57, 0.3)',
        padding: '3rem',
        width: '100%',
        maxWidth: '450px'
      }}>
        {/* Login Type Switcher */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          background: '#f3f4f6',
          padding: '0.5rem',
          borderRadius: '12px'
        }}>
          <button
            type="button"
            onClick={() => switchLoginType('user')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: loginType === 'user' ? '#0A4174' : 'transparent',
              color: loginType === 'user' ? 'white' : '#6B6B6B',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Quicksand, sans-serif',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            👤 Login as User
          </button>
          <button
            type="button"
            onClick={() => switchLoginType('admin')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: loginType === 'admin' ? '#875A7B' : 'transparent',
              color: loginType === 'admin' ? 'white' : '#6B6B6B',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'Quicksand, sans-serif',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            👨‍💼 Login as Admin
          </button>
        </div>

        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '1rem'
          }}>
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4L4 10V22L16 28L28 22V10L16 4Z" stroke={loginType === 'admin' ? '#875A7B' : '#0A4174'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 16L4 10" stroke={loginType === 'admin' ? '#875A7B' : '#0A4174'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 16V28" stroke={loginType === 'admin' ? '#875A7B' : '#0A4174'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 16L28 10" stroke={loginType === 'admin' ? '#875A7B' : '#0A4174'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '2rem',
            color: '#2E2E2E',
            marginBottom: '0.5rem'
          }}>
            {loginType === 'admin' ? 'Admin Portal' : 'Welcome Back'}
          </h1>
          <p style={{
            fontFamily: 'Quicksand, sans-serif',
            color: '#6B6B6B',
            fontSize: '0.95rem'
          }}>
            {loginType === 'admin' 
              ? 'Sign in with administrator credentials' 
              : 'Sign in to your account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: loginType === 'admin' ? '#EADBE7' : '#fee2e2',
            color: loginType === 'admin' ? '#875A7B' : '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '0.9rem',
            border: loginType === 'admin' ? '1px solid #A6789C' : '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2E2E2E',
              marginBottom: '0.5rem'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder={loginType === 'admin' ? 'admin@subscriptionflow.com' : 'you@example.com'}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: '2px solid #EADBE7',
                fontSize: '0.95rem',
                fontFamily: 'Quicksand, sans-serif',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = loginType === 'admin' ? '#875A7B' : '#0A4174';
                e.target.style.boxShadow = loginType === 'admin' 
                  ? '0 0 0 3px rgba(135, 90, 123, 0.1)'
                  : '0 0 0 3px rgba(10, 65, 116, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#EADBE7';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#2E2E2E',
              marginBottom: '0.5rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: '2px solid #EADBE7',
                fontSize: '0.95rem',
                fontFamily: 'Quicksand, sans-serif',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = loginType === 'admin' ? '#875A7B' : '#0A4174';
                e.target.style.boxShadow = loginType === 'admin' 
                  ? '0 0 0 3px rgba(135, 90, 123, 0.1)'
                  : '0 0 0 3px rgba(10, 65, 116, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#EADBE7';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading 
                ? '#A6789C' 
                : loginType === 'admin' 
                  ? '#875A7B' 
                  : 'linear-gradient(135deg, #0A4174 0%, #001D39 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'Quicksand, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: loginType === 'admin'
                ? '0 4px 12px rgba(135, 90, 123, 0.2)'
                : '0 4px 12px rgba(0, 29, 57, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = loginType === 'admin' ? '#A6789C' : '#0A4174';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = loginType === 'admin'
                  ? '0 6px 20px rgba(135, 90, 123, 0.3)'
                  : '0 6px 20px rgba(0, 29, 57, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = loginType === 'admin' 
                  ? '#875A7B' 
                  : 'linear-gradient(135deg, #0A4174 0%, #001D39 100%)';
              }
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = loginType === 'admin'
                ? '0 4px 12px rgba(135, 90, 123, 0.2)'
                : '0 4px 12px rgba(0, 29, 57, 0.2)';
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Signup Link - Only for User Login */}
        {loginType === 'user' && (
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '0.9rem',
            color: '#6B6B6B'
          }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: '#0A4174',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Sign up
            </Link>
          </div>
        )}

        {/* Admin Note */}
        {loginType === 'admin' && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#F6F6F6',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontFamily: 'Quicksand, sans-serif',
            color: '#6B6B6B',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#875A7B' }}>
              🔒 Admin Access Only
            </div>
            <div>Admin accounts are pre-configured. Contact system administrator for access.</div>
          </div>
        )}

        {/* Quick Test Accounts */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#F6F6F6',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontFamily: 'Quicksand, sans-serif',
          color: '#6B6B6B'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#2E2E2E' }}>Test Credentials:</div>
          {loginType === 'admin' ? (
            <div>Admin: admin@subscriptionflow.com / admin123</div>
          ) : (
            <div>User: customer@example.com / customer123</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
