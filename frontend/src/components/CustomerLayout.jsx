import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    updateCartCount();
    
    // Listen for cart updates
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
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

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/shop?search=${searchQuery}`);
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
                  fontWeight: '500',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#875A7B'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
              >
                Home
              </Link>
              <Link
                to="/shop/products"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.95rem',
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#875A7B'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
              >
                Shop
              </Link>
              <Link
                to="/shop/about"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.95rem',
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#875A7B'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
              >
                About Us
              </Link>
              <Link
                to="/shop/contact"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.95rem',
                  color: '#6B6B6B',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#875A7B'}
                onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Right: Search, Cart, Account */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Search Icon */}
            <button
              onClick={() => document.getElementById('search-input')?.focus()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B6B6B',
                fontSize: '1.25rem',
                padding: '0.5rem',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#875A7B'}
              onMouseLeave={(e) => e.target.style.color = '#6B6B6B'}
            >
              🔍
            </button>

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

            {/* My Account Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                style={{
                  background: '#875A7B',
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#A6789C'}
                onMouseLeave={(e) => e.target.style.background = '#875A7B'}
              >
                <span>👤</span>
                <span>{currentUser?.name || 'My Account'}</span>
              </button>

              {showAccountMenu && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  minWidth: '200px',
                  overflow: 'hidden',
                  zIndex: 1000,
                  border: '1px solid #e5e7eb'
                }}>
                  <div
                    onClick={() => { navigate('/shop/dashboard'); setShowAccountMenu(false); }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: '#2E2E2E',
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#F6F6F6'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    My Dashboard
                  </div>
                  <div
                    onClick={() => { navigate('/shop/orders'); setShowAccountMenu(false); }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: '#2E2E2E',
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#F6F6F6'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    My Orders
                  </div>
                  <div
                    onClick={() => { navigate('/shop/subscriptions'); setShowAccountMenu(false); }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: '#2E2E2E',
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#F6F6F6'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    My Subscriptions
                  </div>
                  <div
                    onClick={() => { navigate('/shop/profile'); setShowAccountMenu(false); }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: '#2E2E2E',
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#F6F6F6'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    Profile Settings
                  </div>
                  <div
                    onClick={handleLogout}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s ease',
                      borderTop: '1px solid #F6F6F6'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#EADBE7'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    Logout
                  </div>
                </div>
              )}
            </div>
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
