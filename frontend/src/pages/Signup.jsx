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
    // Password requirements from specification:
    // - Length > 8 characters (at least 9 characters long)
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one special character
    if (!password || password.length <= 8) {
      return 'Password length must be greater than 8 characters (at least 9 characters long)';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter (A-Z)';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter (a-z)';
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return 'Password must contain at least one special character (e.g. !@#$%^&*)';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate name
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters)');
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
      // Public registration strictly registers Customer accounts ('portal')
      // Rule from specification: "Only Admin can create Internal Users."
      const response = await axios.post('/auth/signup', {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: 'portal'
      });
      
      const { access_token, user } = response.data;
      
      // Store token and user
      login(access_token, user);
      
      // Redirect to customer portal
      navigate('/shop');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwd = formData.password;
  const pwdValidation = {
    length: pwd.length > 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    special: /[^a-zA-Z0-9]/.test(pwd)
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A4174 0%, #001D39 100%)',
      fontFamily: 'Quicksand, sans-serif',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '2.5rem 2.5rem 1.5rem 2.5rem',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0A4174 0%, #49769F 100%)',
            color: 'white',
            fontSize: '1.75rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 16px rgba(10, 65, 116, 0.2)'
          }}>
            🛍️
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '1.65rem',
            fontWeight: '700',
            fontFamily: 'Gabarito, sans-serif',
            color: '#0f172a'
          }}>
            Create Customer Account
          </h1>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: '#64748b',
            fontSize: '0.92rem'
          }}>
            Sign up to view products, purchase recurring subscriptions, and manage billing
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem 2.5rem 2.5rem 2.5rem' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '0.4rem'
              }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Jane Customer"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'Quicksand, sans-serif'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '0.4rem'
              }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'Quicksand, sans-serif'
                }}
              />
            </div>

            {/* Password Rules Checklist */}
            <div style={{
              padding: '0.75rem 1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.78rem',
              color: '#475569'
            }}>
              <strong style={{ color: '#0f172a' }}>Password Requirements:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginTop: '0.4rem' }}>
                <span style={{ color: pwdValidation.length ? '#166534' : '#64748b' }}>
                  {pwdValidation.length ? '✓' : '○'} &gt; 8 characters
                </span>
                <span style={{ color: pwdValidation.upper ? '#166534' : '#64748b' }}>
                  {pwdValidation.upper ? '✓' : '○'} Uppercase (A-Z)
                </span>
                <span style={{ color: pwdValidation.lower ? '#166534' : '#64748b' }}>
                  {pwdValidation.lower ? '✓' : '○'} Lowercase (a-z)
                </span>
                <span style={{ color: pwdValidation.special ? '#166534' : '#64748b' }}>
                  {pwdValidation.special ? '✓' : '○'} Special char (!@#$)
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '0.4rem'
              }}>
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter strong password"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'Quicksand, sans-serif'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '0.4rem'
              }}>
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'Quicksand, sans-serif'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: '#0A4174',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                fontFamily: 'Quicksand, sans-serif'
              }}
            >
              {loading ? 'Creating account...' : 'Create Customer Account'}
            </button>
          </form>

          {/* Notice about staff accounts */}
          <div style={{
            marginTop: '1.5rem',
            padding: '0.75rem',
            background: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #bfdbfe',
            fontSize: '0.78rem',
            color: '#1e40af',
            lineHeight: '1.4'
          }}>
            <strong>Staff Notice:</strong> Internal User and Administrator accounts cannot be created via public registration. Per system rules, staff members must be created by a System Administrator.
          </div>

          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: '#64748b'
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#0A4174',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
