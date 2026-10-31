import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    updateCartCount();
    
    // Listen for cart updates
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateCartCount = () => {
    try {
      const cart = localStorage.getItem('cart');
      if (cart) {
        const items = JSON.parse(cart);
        const total = items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Error reading cart:', error);
      setCartCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
      {/* Top Navbar - Clean White */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 3px rgba(46, 46, 46, 0.05)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem'
        }}>
          {/* Left: Logo + Menu Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            {/* Logo */}
            <Link 
              to="/shop"
              style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#875A7B',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4L4 10V22L16 28L28 22V10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 16L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 16V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 16L28 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              SubscriptionFlow
            </Link>

            {/* Menu Links */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <Link
                to="/shop"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.95rem',
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#875A7B'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
              >
                Home
              </Link>

              {/* My Account Dropdown in Navbar */}
              <div style={{ position: 'relative' }} ref={accountMenuRef}>
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.5rem 0',
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.95rem',
                    color: showAccountMenu ? '#875A7B' : '#6B6B6B',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#875A7B'}
                  onMouseLeave={(e) => {
                    if (!showAccountMenu) e.currentTarget.style.color = '#6B6B6B';
                  }}
                >
                  <span>My Account</span>
                  <span style={{
                    fontSize: '0.65rem',
                    display: 'inline-block',
                    transform: showAccountMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▼
                  </span>
                </button>

                {showAccountMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: 0,
                    background: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(135, 90, 123, 0.15)',
                    minWidth: '190px',
                    overflow: 'hidden',
                    zIndex: 1000,
                    border: '1px solid #EADBE7'
                  }}>
                    <div
                      onClick={() => {
                        navigate('/shop/orders');
                        setShowAccountMenu(false);
                      }}
                      style={{
                        padding: '0.85rem 1.25rem',
                        cursor: 'pointer',
                        color: '#2E2E2E',
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F6F6F6';
                        e.currentTarget.style.color = '#875A7B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#2E2E2E';
                      }}
                    >
                      <span>📦</span> My orders
                    </div>

                    <div
                      onClick={() => {
                        navigate('/shop/subscriptions');
                        setShowAccountMenu(false);
                      }}
                      style={{
                        padding: '0.85rem 1.25rem',
                        cursor: 'pointer',
                        color: '#2E2E2E',
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'all 0.2s ease',
                        borderTop: '1px solid #F6F6F6'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F6F6F6';
                        e.currentTarget.style.color = '#875A7B';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#2E2E2E';
                      }}
                    >
                      <span>🔄</span> My Subscription
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Cart, User & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Cart Icon with Badge */}
            <Link
              to="/shop/cart"
              style={{
                position: 'relative',
                color: '#6B6B6B',
                fontSize: '1.25rem',
                padding: '0.5rem',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#875A7B'}
              onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
            >
              🛒
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: cartCount > 0 ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: '700',
                fontFamily: 'Quicksand, sans-serif'
              }}>
                {cartCount}
              </span>
            </Link>

            {/* Profile Button (Clickable) */}
            <button
              onClick={() => navigate('/shop/profile')}
              style={{
                background: '#F6F6F6',
                border: '1px solid #EADBE7',
                color: '#2E2E2E',
                padding: '0.5rem 1.15rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EADBE7';
                e.currentTarget.style.color = '#875A7B';
                e.currentTarget.style.borderColor = '#875A7B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F6F6F6';
                e.currentTarget.style.color = '#2E2E2E';
                e.currentTarget.style.borderColor = '#EADBE7';
              }}
              title="View Profile Settings"
            >
              <span>👤</span>
              <span>{currentUser?.name || 'Profile'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        background: '#2E2E2E',
        color: 'white',
        padding: '3rem 2rem 2rem',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem'
        }}>
          {/* Company Info */}
          <div>
            <h3 style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '1.25rem',
              marginBottom: '1rem'
            }}>
              SubscriptionFlow Pro
            </h3>
            <p style={{
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.9rem',
              opacity: 0.8,
              lineHeight: 1.6,
              color: '#6B6B6B'
            }}>
              Streamline your business with our subscription management platform.
            </p>
          </div>

          {/* Support Links */}
          <div>
            <h4 style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '1rem',
              marginBottom: '1rem'
            }}>
              Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.9rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
                >
                  Help Center
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.9rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
                >
                  Contact Us
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.9rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '1rem',
              marginBottom: '1rem'
            }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.9rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
                >
                  Terms of Service
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.9rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
                >
                  Privacy Policy
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.9rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
                >
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          maxWidth: '1400px',
          margin: '2rem auto 0',
          paddingTop: '2rem',
          borderTop: '1px solid #3a3a3a',
          textAlign: 'center',
          fontFamily: 'Quicksand, sans-serif',
          fontSize: '0.85rem',
          color: '#6B6B6B'
        }}>
          © 2026 SubscriptionFlow Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
