import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Password must be at least 8 characters with at least one uppercase, one lowercase, and one number
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate name
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    // Validate email format
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/auth/signup', {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: 'portal' // All signups are regular users
      });
      
      const { access_token, user } = response.data;
      
      // Store token and user
      login(access_token, user);
      
      // Redirect to user shop
      navigate('/shop');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #001D39 0%, #0A4174 50%, #49769F 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 29, 57, 0.3)',
        padding: '3rem',
        width: '100%',
        maxWidth: '450px'
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '2rem',
            color: '#001D39',
            marginBottom: '0.5rem'
          }}>
            Create Account
          </h1>
          <p style={{
            fontFamily: 'Quicksand, sans-serif',
            color: '#49769F',
            fontSize: '0.95rem'
          }}>
            Sign up to get started
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '0.9rem',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#001D39',
              marginBottom: '0.5rem'
            }}>
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: '2px solid #BDD8E9',
                fontSize: '0.95rem',
                fontFamily: 'Quicksand, sans-serif',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0A4174';
                e.target.style.boxShadow = '0 0 0 3px rgba(10, 65, 116, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#BDD8E9';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#001D39',
              marginBottom: '0.5rem'
            }}>
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: '2px solid #BDD8E9',
                fontSize: '0.95rem',
                fontFamily: 'Quicksand, sans-serif',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0A4174';
                e.target.style.boxShadow = '0 0 0 3px rgba(10, 65, 116, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#BDD8E9';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#001D39',
              marginBottom: '0.5rem'
            }}>
              Password *
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
                border: '2px solid #BDD8E9',
                fontSize: '0.95rem',
                fontFamily: 'Quicksand, sans-serif',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0A4174';
                e.target.style.boxShadow = '0 0 0 3px rgba(10, 65, 116, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#BDD8E9';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{
              fontSize: '0.75rem',
              color: '#71717a',
              marginTop: '0.5rem',
              fontFamily: 'Quicksand, sans-serif'
            }}>
              Must be 8+ characters with uppercase, lowercase, and number
            </div>
          </div>

          {/* Confirm Password Field */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#001D39',
              marginBottom: '0.5rem'
            }}>
              Confirm Password *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: '2px solid #BDD8E9',
                fontSize: '0.95rem',
                fontFamily: 'Quicksand, sans-serif',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0A4174';
                e.target.style.boxShadow = '0 0 0 3px rgba(10, 65, 116, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#BDD8E9';
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
              background: loading ? '#6EA2B3' : 'linear-gradient(135deg, #0A4174 0%, #001D39 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'Quicksand, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 29, 57, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 29, 57, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 29, 57, 0.2)';
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontFamily: 'Quicksand, sans-serif',
          fontSize: '0.9rem',
          color: '#49769F'
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#0A4174',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
