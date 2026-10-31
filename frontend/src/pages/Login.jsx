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

  // Forgot / Reset Password state (OTP via Google Mail)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = request OTP, 2 = verify OTP & reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

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

  // OTP-based Password Reset Handlers
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const emailTrimmed = forgotEmail.toLowerCase().trim();
      const res = await axios.post('/auth/forgot-password', {
        email: emailTrimmed
      });
      setForgotStep(2);
      setCountdown(30);
      setOtp('');
      const successMsg = res.data?.message || `A 6-digit verification code has been sent to ${emailTrimmed} via Google Mail.`;
      setForgotSuccess(res.data?.dev_otp ? `${successMsg} [Dev OTP: ${res.data.dev_otp}]` : successMsg);
    } catch (err) {
      if (!err.response) {
        setForgotError('Cannot reach backend server. Please ensure the backend is running at http://localhost:8000.');
      } else {
        setForgotError(err.response?.data?.detail || 'Failed to send verification code. Please check your email.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || forgotLoading) return;
    await handleRequestOtp();
  };

  const handleExecuteReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError('Please enter the 6-digit verification code sent to your Google Mail.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('New passwords do not match');
      return;
    }

    if (newPassword.length <= 8) {
      setForgotError('Password length must be greater than 8 characters (at least 9 characters)');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setForgotError('Password must contain at least one uppercase letter (A-Z)');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setForgotError('Password must contain at least one lowercase letter (a-z)');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]/.test(newPassword)) {
      setForgotError('Password must contain at least one special character (e.g. !@#$%^&*)');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await axios.post('/auth/reset-password', {
        email: forgotEmail.toLowerCase().trim(),
        otp: cleanOtp,
        new_password: newPassword
      });
      setSuccessMsg(res.data?.message || 'Password reset successfully! Please sign in with your new password.');
      setShowForgotModal(false);
      setFormData(prev => ({ ...prev, email: forgotEmail, password: '' }));
    } catch (err) {
      if (!err.response) {
        setForgotError('Cannot reach backend server. Please ensure the backend is running at http://localhost:8000.');
      } else {
        setForgotError(err.response?.data?.detail || 'Failed to reset password. Please check your verification code.');
      }
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

      {/* Forgot / Reset Password Modal (OTP via Google Mail) */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '490px',
            padding: '2.25rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            fontFamily: 'Quicksand, sans-serif',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#F1F5F9', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', color: '#0A4174', marginBottom: '0.5rem' }}>
                  <span>📧</span> Google Mail OTP Verification
                </div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Gabarito, sans-serif', color: '#0f172a', fontWeight: '700' }}>
                  {forgotStep === 1 ? 'Forgot Password?' : 'Enter Verification Code'}
                </h2>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fee2e2',
                padding: '0.8rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️</span>
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div style={{
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #dcfce7',
                padding: '0.8rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>✓</span>
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOtp}>
                <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.55', marginTop: 0, marginBottom: '1.5rem' }}>
                  Enter your registered email address. We will send a 6-digit OTP verification code via Google Mail to securely reset your password.
                </p>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.45rem', color: '#1e293b' }}>
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. user@brightloop.com"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      fontFamily: 'Quicksand, sans-serif',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0A4174'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      color: '#475569',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontFamily: 'Quicksand, sans-serif'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      padding: '0.75rem 1.6rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#0A4174',
                      color: 'white',
                      fontWeight: '700',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontFamily: 'Quicksand, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(10, 65, 116, 0.25)',
                      opacity: forgotLoading ? 0.75 : 1
                    }}
                  >
                    <span>✉️</span>
                    <span>{forgotLoading ? 'Sending OTP...' : 'Send Verification Code'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExecuteReset}>
                {/* Active Email Pill */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.7rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <span style={{ color: '#64748b' }}>OTP sent to: </span>
                    <strong style={{ color: '#0A4174' }}>{forgotEmail}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#875A7B',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      padding: 0
                    }}
                  >
                    Change Email
                  </button>
                </div>

                {/* 6-Digit OTP Input */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                      6-Digit Verification Code (OTP) *
                    </label>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || forgotLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: countdown > 0 ? '#94a3b8' : '#0A4174',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: countdown > 0 ? 'default' : 'pointer',
                        padding: 0
                      }}
                    >
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="------"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #cbd5e1',
                      fontSize: '1.6rem',
                      letterSpacing: '10px',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontWeight: '800',
                      color: '#0A4174',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0A4174'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>

                {/* Password Strength Checklist */}
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                  color: '#475569'
                }}>
                  <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '0.35rem' }}>
                    Password Complexity Rules:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                    <div style={{ color: newPassword.length > 8 ? '#16a34a' : '#64748b' }}>
                      {newPassword.length > 8 ? '✓' : '•'} Over 8 characters ({newPassword.length})
                    </div>
                    <div style={{ color: /[A-Z]/.test(newPassword) ? '#16a34a' : '#64748b' }}>
                      {/[A-Z]/.test(newPassword) ? '✓' : '•'} 1+ Uppercase (A-Z)
                    </div>
                    <div style={{ color: /[a-z]/.test(newPassword) ? '#16a34a' : '#64748b' }}>
                      {/[a-z]/.test(newPassword) ? '✓' : '•'} 1+ Lowercase (a-z)
                    </div>
                    <div style={{ color: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]/.test(newPassword) ? '#16a34a' : '#64748b' }}>
                      {/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]/.test(newPassword) ? '✓' : '•'} 1+ Special (!@#$...)
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', color: '#1e293b' }}>
                    New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                        fontFamily: 'Quicksand, sans-serif'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0A4174'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        color: '#64748b'
                      }}
                    >
                      {showNewPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', color: '#1e293b' }}>
                    Confirm New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                        fontFamily: 'Quicksand, sans-serif'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0A4174'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        color: '#64748b'
                      }}
                    >
                      {showConfirmPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    style={{
                      padding: '0.75rem 1.3rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: '#475569',
                      fontFamily: 'Quicksand, sans-serif'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || otp.length !== 6}
                    style={{
                      padding: '0.75rem 1.6rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#0A4174',
                      color: 'white',
                      fontWeight: '700',
                      cursor: forgotLoading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontFamily: 'Quicksand, sans-serif',
                      boxShadow: '0 4px 12px rgba(10, 65, 116, 0.25)',
                      opacity: forgotLoading || otp.length !== 6 ? 0.7 : 1
                    }}
                  >
                    {forgotLoading ? 'Updating Password...' : 'Reset Password'}
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
