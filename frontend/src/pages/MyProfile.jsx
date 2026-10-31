import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const MyProfile = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // User Details Form
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/my/profile');
      setUserForm({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        zipCode: response.data.zip_code || '',
        country: response.data.country || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put('/my/profile', {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        address: userForm.address,
        city: userForm.city,
        state: userForm.state,
        zip_code: userForm.zipCode,
        country: userForm.country
      });
      alert('✓ Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#FFFFFF',
    color: '#2E2E2E',
    border: '2px solid #EADBE7',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontFamily: 'Quicksand, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    color: '#2E2E2E',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    fontFamily: 'Quicksand, sans-serif'
  };

  return (
    <div style={{
      fontFamily: 'Quicksand, sans-serif',
      background: '#F6F6F6',
      minHeight: '100vh'
    }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #875A7B 0%, #A6789C 100%)',
        padding: '2.5rem 2rem',
        color: 'white'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '2rem',
                fontWeight: '700',
                margin: 0
              }}>
                My Profile
              </h1>
              <p style={{ opacity: 0.9, marginTop: '0.25rem', fontSize: '0.95rem' }}>
                Manage your personal information and contact settings
              </p>
            </div>
            <button
              onClick={() => navigate('/shop')}
              style={{
                padding: '0.6rem 1.5rem',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                fontFamily: 'Quicksand, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '900px',
        margin: '-1.5rem auto 0',
        padding: '0 2rem 3rem',
        position: 'relative',
        zIndex: 2
      }}>
        {/* User Details Profile Card */}
        <div style={{
          background: 'white',
          border: '1px solid #EADBE7',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 4px 12px rgba(46, 46, 46, 0.08)'
        }}>
          <h2 style={{
            color: '#2E2E2E',
            fontSize: '1.5rem',
            fontWeight: '700',
            fontFamily: 'Gabarito, sans-serif',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid #EADBE7'
          }}>
            Personal Information
          </h2>

          <form onSubmit={handleSaveProfile}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={userForm.name}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                  onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleInputChange}
                  required
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                  onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={userForm.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                  onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
                />
              </div>

              <div>
                <label style={labelStyle}>Country</label>
                <input
                  type="text"
                  name="country"
                  value={userForm.country}
                  onChange={handleInputChange}
                  placeholder="e.g. United States"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                  onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Street Address</label>
              <input
                type="text"
                name="address"
                value={userForm.address}
                onChange={handleInputChange}
                placeholder="123 Main St, Apt 4B"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  name="city"
                  value={userForm.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                  onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
                />
              </div>

              <div>
                <label style={labelStyle}>State / Province</label>
                <input
                  type="text"
                  name="state"
                  value={userForm.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                  onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
                />
              </div>

              <div>
                <label style={labelStyle}>ZIP / Postal Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={userForm.zipCode}
                  onChange={handleInputChange}
                  placeholder="ZIP Code"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                  onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #EADBE7'
            }}>
              <button
                type="button"
                onClick={fetchUserProfile}
                style={{
                  padding: '0.85rem 1.75rem',
                  background: 'white',
                  color: '#6B6B6B',
                  border: '2px solid #EADBE7',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  fontFamily: 'Quicksand, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#875A7B';
                  e.target.style.color = '#875A7B';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#EADBE7';
                  e.target.style.color = '#6B6B6B';
                }}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.85rem 2rem',
                  background: '#875A7B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  fontFamily: 'Quicksand, sans-serif',
                  cursor: loading ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(135, 90, 123, 0.3)',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = '#A6789C';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.background = '#875A7B';
                }}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
