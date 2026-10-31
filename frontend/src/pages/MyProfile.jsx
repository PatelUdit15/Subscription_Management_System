import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const MyProfile = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('user_details');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

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
    if (activeTab === 'my_orders') {
      fetchOrders();
    }
  }, [activeTab]);

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/my/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'completed' || status === 'delivered') return '#10b981';
    if (status === 'pending' || status === 'processing') return '#f59e0b';
    if (status === 'cancelled') return '#ef4444';
    return '#71717a';
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
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{
            padding: '0.75rem 1.5rem',
            border: '2px solid #d97706',
            borderRadius: '8px',
            color: '#d97706',
            fontWeight: '600',
            fontSize: '1.1rem',
            fontFamily: 'Gabarito, sans-serif',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/shop')}>
            Company Logo
          </div>

          <button onClick={() => navigate('/shop')} style={{
            background: 'transparent',
            color: '#d97706',
            border: 'none',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Home
          </button>

          <button onClick={() => navigate('/shop/products')} style={{
            background: 'transparent',
            color: '#d97706',
            border: 'none',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Shop
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          <button onClick={() => navigate('/shop/cart')} style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            color: '#d97706',
            border: '2px solid #d97706',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Cart
          </button>

          <div style={{ position: 'relative' }}>
            <button style={{
              padding: '0.75rem 1.5rem',
              background: '#d97706',
              color: '#1a1a1a',
              border: '2px solid #d97706',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              My Profile
            </button>

            {/* Dropdown */}
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '0',
              background: '#2a2a2a',
              border: '2px solid #d97706',
              borderRadius: '8px',
              minWidth: '150px',
              zIndex: 1000
            }}>
              <button
                onClick={() => setActiveTab('user_details')}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: activeTab === 'user_details' ? '#d97706' : 'transparent',
                  color: activeTab === 'user_details' ? '#1a1a1a' : '#d97706',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  borderRadius: '6px 6px 0 0'
                }}
              >
                User Details
              </button>
              <button
                onClick={() => setActiveTab('my_orders')}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: activeTab === 'my_orders' ? '#d97706' : 'transparent',
                  color: activeTab === 'my_orders' ? '#1a1a1a' : '#d97706',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  borderRadius: '0 0 6px 6px'
                }}
              >
                My Orders
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '3rem 2rem'
      }}>
        {/* User Details Tab */}
        {activeTab === 'user_details' && (
          <div style={{
            background: '#2a2a2a',
            border: '2px solid #d97706',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <h1 style={{
              color: '#d97706',
              fontSize: '2.5rem',
              fontWeight: '700',
              fontFamily: 'Gabarito, cursive',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              User Details Page
            </h1>

            <form onSubmit={handleSaveProfile}>
              {/* User Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#d97706',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  User Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={userForm.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#1a1a1a',
                    color: '#d97706',
                    border: '2px solid #d97706',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#d97706',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#1a1a1a',
                    color: '#d97706',
                    border: '2px solid #d97706',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Phone Number */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#d97706',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={userForm.phone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#1a1a1a',
                    color: '#d97706',
                    border: '2px solid #d97706',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Address */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#d97706',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={userForm.address}
                  onChange={handleInputChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#1a1a1a',
                    color: '#d97706',
                    border: '2px solid #d97706',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'Quicksand, sans-serif'
                  }}
                />
              </div>

              {/* City and State */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#d97706',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={userForm.city}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#1a1a1a',
                      color: '#d97706',
                      border: '2px solid #d97706',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: '#d97706',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={userForm.state}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#1a1a1a',
                      color: '#d97706',
                      border: '2px solid #d97706',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Zip Code and Country */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#d97706',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={userForm.zipCode}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#1a1a1a',
                      color: '#d97706',
                      border: '2px solid #d97706',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: '#d97706',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={userForm.country}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#1a1a1a',
                      color: '#d97706',
                      border: '2px solid #d97706',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading ? '#71717a' : '#d97706',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = '#b45309';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.background = '#d97706';
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            {/* Additional Info Note */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#1a1a1a',
              border: '1px solid #d97706',
              borderRadius: '8px',
              color: '#d97706',
              fontSize: '0.9rem',
              opacity: 0.8
            }}>
              <strong>Note:</strong> Other details following related to user preferences, notification settings, and account security can be added here.
            </div>
          </div>
        )}

        {/* My Orders Tab */}
        {activeTab === 'my_orders' && (
          <div style={{
            background: '#2a2a2a',
            border: '2px solid #d97706',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <h1 style={{
              color: '#d97706',
              fontSize: '2.5rem',
              fontWeight: '700',
              fontFamily: 'Gabarito, cursive',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              My Orders
            </h1>

            {loading ? (
              <div style={{
                textAlign: 'center',
                color: '#d97706',
                padding: '3rem',
                fontSize: '1.2rem'
              }}>
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#d97706'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  No orders yet
                </h3>
                <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                  Start shopping to see your orders here
                </p>
                <button
                  onClick={() => navigate('/shop/products')}
                  style={{
                    padding: '1rem 2rem',
                    background: '#d97706',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      background: '#1a1a1a',
                      border: '2px solid #d97706',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{
                        color: '#d97706',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        Order #{order.id}
                      </div>
                      <div style={{
                        color: '#d97706',
                        fontSize: '0.9rem',
                        opacity: 0.8,
                        marginBottom: '0.25rem'
                      }}>
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div style={{
                        color: '#d97706',
                        fontSize: '0.9rem',
                        opacity: 0.8
                      }}>
                        {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        color: '#d97706',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem'
                      }}>
                        ${order.total_amount?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: getStatusColor(order.status),
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
