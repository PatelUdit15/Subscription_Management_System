import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = request token, 2 = reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Auto-detect reset link parameters from URL (?mode=reset&token=...&email=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'reset' && params.get('token')) {
      setShowForgotModal(true);
      setForgotStep(2);
      setResetToken(params.get('token'));
      if (params.get('email')) setForgotEmail(params.get('email'));
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });

      const { access_token, user } = response.data;

      // Store token and user context
      login(access_token, user);

      // Route based on role:
      // - Admin and Internal Staff -> Back-Office Operational Console (/admin)
      // - Customer Portal users -> Customer Store (/shop)
      if (user.role === 'admin' || user.role === 'internal') {
        navigate('/admin');
      } else {
        navigate('/shop');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (!err.response) {
        setError('Cannot reach server. Please ensure the backend is running at http://localhost:8000.');
      } else {
        setError(err.response?.data?.detail || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Password Reset Handlers
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await axios.post('/auth/forgot-password', {
        email: forgotEmail.toLowerCase().trim()
      });
      setForgotSuccess('Reset token generated! Please set your new password below.');
      if (res.data.reset_token) {
        setResetToken(res.data.reset_token);
        setForgotStep(2);
      }
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'Failed to request password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleExecuteReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (newPassword !== confirmPassword) {
      setForgotError('New passwords do not match');
      return;
    }

    if (newPassword.length <= 8) {
      setForgotError('Password length must be greater than 8 characters (at least 9 characters)');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setForgotError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setForgotError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      setForgotError('Password must contain at least one special character (e.g. !@#$%^&*)');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await axios.post('/auth/reset-password', {
        token: resetToken.trim(),
        new_password: newPassword
      });
      setSuccessMsg(res.data?.message || 'Password reset successfully! Please sign in.');
      setShowForgotModal(false);
      setFormData({ email: forgotEmail, password: newPassword });
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A4174 0%, #001D39 100%)',
      fontFamily: 'Quicksand, sans-serif',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
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
            background: 'linear-gradient(135deg, #0A4174 0%, #875A7B 100%)',
            color: 'white',
            fontSize: '1.75rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 16px rgba(10, 65, 116, 0.2)'
          }}>
            🏢
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '1.65rem',
            fontWeight: '700',
            fontFamily: 'Gabarito, sans-serif',
            color: '#0f172a'
          }}>
            Subscription Management
          </h1>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: '#64748b',
            fontSize: '0.92rem'
          }}>
            Sign in with your email and password
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

          {successMsg && (
            <div style={{
              background: '#f0fdf4',
              color: '#166534',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>✓</span>
              <span>{successMsg}</span>
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
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border 0.2s',
                  fontFamily: 'Quicksand, sans-serif'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0A4174'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem'
              }}>
                <label style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#334155'
                }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(formData.email);
                    setForgotError('');
                    setForgotSuccess('');
                    setForgotStep(1);
                    setShowForgotModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0A4174',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border 0.2s',
                  fontFamily: 'Quicksand, sans-serif'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0A4174'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
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
                transition: 'background 0.2s ease',
                fontFamily: 'Quicksand, sans-serif'
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.background = '#001D39'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.background = '#0A4174'; }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div style={{
            marginTop: '1.75rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            fontSize: '0.8rem',
            color: '#475569'
          }}>
            <div style={{ fontWeight: '700', marginBottom: '0.4rem', color: '#0f172a' }}>
              Standard Accounts:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div 
                onClick={() => setFormData({ email: 'admin@subscriptionflow.com', password: 'admin123' })}
                style={{ cursor: 'pointer', padding: '0.2rem 0', color: '#0A4174' }}
                title="Click to fill"
              >
                <strong>Admin:</strong> admin@subscriptionflow.com <span style={{ color: '#64748b' }}>(admin123)</span>
              </div>
              <div 
                onClick={() => setFormData({ email: 'internal@brightloop.com', password: 'Internal@123' })}
                style={{ cursor: 'pointer', padding: '0.2rem 0', color: '#047857' }}
                title="Click to fill"
              >
                <strong>Internal Staff:</strong> internal@brightloop.com <span style={{ color: '#64748b' }}>(Internal@123)</span>
              </div>
              <div 
                onClick={() => setFormData({ email: 'customer@example.com', password: 'customer123' })}
                style={{ cursor: 'pointer', padding: '0.2rem 0', color: '#b45309' }}
                title="Click to fill"
              >
                <strong>Customer Portal:</strong> customer@example.com <span style={{ color: '#64748b' }}>(customer123)</span>
              </div>
            </div>
          </div>

          {/* Signup link for customers */}
          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: '#64748b'
          }}>
            New customer?{' '}
            <Link
              to="/signup"
              style={{
                color: '#0A4174',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              Create customer account
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            fontFamily: 'Quicksand, sans-serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontFamily: 'Gabarito, sans-serif', color: '#111827' }}>
                {forgotStep === 1 ? 'Verify Email for Password Reset' : 'Choose New Password'}
              </h2>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#9ca3af'
                }}
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestReset}>
                <p style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.5', marginTop: 0 }}>
                  Enter your registered email address. We will verify your account and issue a secure password reset token.
                </p>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: '#374151' }}>
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. user@brightloop.com"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#0A4174',
                      color: 'white',
                      fontWeight: '700',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {forgotLoading ? 'Verifying...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExecuteReset}>
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                  color: '#475569'
                }}>
                  <strong>Password Requirements:</strong>
                  <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0 }}>
                    <li>Length greater than 8 characters (at least 9)</li>
                    <li>At least one uppercase letter (A-Z)</li>
                    <li>At least one lowercase letter (a-z)</li>
                    <li>At least one special character (!@#$%^&*)</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: '#374151' }}>
                    Reset Token *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste reset token"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: '#374151' }}>
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong password (> 8 chars)"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem', color: '#374151' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#0A4174',
                      color: 'white',
                      fontWeight: '700',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {forgotLoading ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
