import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomerHome = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      fontFamily: 'Quicksand, sans-serif',
      background: '#1a1a1a',
      minHeight: '100vh'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        background: '#2a2a2a',
        border: '2px solid #d97706',
        borderRadius: '0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Left: Logo and Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{
            padding: '0.75rem 1.5rem',
            border: '2px solid #d97706',
            borderRadius: '8px',
            color: '#d97706',
            fontWeight: '600',
            fontSize: '1.1rem',
            fontFamily: 'Gabarito, sans-serif'
          }}>
            Company Logo
          </div>

          <button
            onClick={() => navigate('/shop')}
            style={{
              background: 'transparent',
              color: '#d97706',
              border: 'none',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Home
          </button>

          <button
            onClick={() => navigate('/shop/products')}
            style={{
              background: 'transparent',
              color: '#d97706',
              border: 'none',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Shop
          </button>

          <button
            onClick={() => navigate('/shop/dashboard')}
            style={{
              background: 'transparent',
              color: '#d97706',
              border: 'none',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            My Account
          </button>
        </div>

        {/* Right: Cart, Profile, Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          <button
            onClick={() => navigate('/shop/cart')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: '#d97706',
              border: '2px solid #d97706',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#d97706';
              e.target.style.color = '#1a1a1a';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#d97706';
            }}
          >
            Cart
          </button>

          <button
            onClick={() => navigate('/shop/my-profile')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: '#d97706',
              border: '2px solid #d97706',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#d97706';
              e.target.style.color = '#1a1a1a';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#d97706';
            }}
          >
            My Profile
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: '#d97706',
              border: '2px solid #d97706',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'absolute',
              top: '60px',
              right: '0'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#d97706';
              e.target.style.color = '#1a1a1a';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#d97706';
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 100px)',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '5rem',
            fontFamily: 'Gabarito, cursive',
            color: '#d97706',
            fontWeight: '700',
            marginBottom: '2rem',
            textShadow: '0 0 20px rgba(217, 119, 6, 0.3)'
          }}>
            HOME Page
          </h1>

          <p style={{
            fontSize: '1.5rem',
            color: '#d97706',
            marginBottom: '3rem',
            opacity: 0.8
          }}>
            Welcome back, {currentUser?.name || 'Customer'}!
          </p>

          <div style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => navigate('/shop/products')}
              style={{
                padding: '1rem 2.5rem',
                background: '#d97706',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#b45309';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#d97706';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Start Shopping
            </button>

            <button
              onClick={() => navigate('/shop/dashboard')}
              style={{
                padding: '1rem 2.5rem',
                background: 'transparent',
                color: '#d97706',
                border: '2px solid #d97706',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#d97706';
                e.target.style.color = '#1a1a1a';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#d97706';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
