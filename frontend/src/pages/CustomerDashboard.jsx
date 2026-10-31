import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StripePaymentModal from '../components/StripePaymentModal';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  // Determine active tab from URL
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/invoices')) return 'invoices';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/subscriptions')) return 'subscriptions';
    if (path.includes('/profile')) return 'profile';
    return 'orders'; // default
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [loading, setLoading] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  
  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);
  
  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [stripeInvoice, setStripeInvoice] = useState(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState({});
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);

  const handleToggleInvoice = async (invoiceId) => {
    if (expandedInvoiceId === invoiceId) {
      setExpandedInvoiceId(null);
      return;
    }
    setExpandedInvoiceId(invoiceId);
    if (!invoiceDetails[invoiceId]) {
      try {
        setLoadingInvoiceId(invoiceId);
        const res = await axios.get(`/my/invoices/${invoiceId}`);
        setInvoiceDetails(prev => ({ ...prev, [invoiceId]: res.data }));
      } catch (err) {
        console.error('Error loading invoice details:', err);
      } finally {
        setLoadingInvoiceId(null);
      }
    }
  };

  const handleToggleOrder = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!orderDetails[orderId]) {
      try {
        setLoadingOrderId(orderId);
        const res = await axios.get(`/my/orders/${orderId}`);
        setOrderDetails(prev => ({ ...prev, [orderId]: res.data }));
      } catch (err) {
        console.error('Error loading order details:', err);
      } finally {
        setLoadingOrderId(null);
      }
    }
  };

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchProfile();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else if (activeTab === 'invoices') {
      fetchInvoices();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/my/profile');
      setProfile(response.data);
      setProfileForm({ 
        name: response.data.name, 
        email: response.data.email,
        currentPassword: '',
        newPassword: ''
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

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/my/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/my/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updateData = {
        name: profileForm.name,
        email: profileForm.email
      };
      
      if (profileForm.newPassword) {
        updateData.current_password = profileForm.currentPassword;
        updateData.new_password = profileForm.newPassword;
      }
      
      const response = await axios.put('/my/profile', updateData);
      alert('Profile updated successfully!');
      setProfileForm({ ...profileForm, currentPassword: '', newPassword: '' });
      fetchProfile();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }
    
    try {
      await axios.post(`/my/subscriptions/${subscriptionId}/cancel`);
      alert('Subscription cancelled successfully');
      fetchSubscriptions();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to cancel subscription');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontWeight: '600',
      display: 'inline-block'
    };
    
    if (status === 'active' || status === 'completed' || status === 'paid') {
      return { ...baseStyle, background: '#dcfce7', color: '#166534' };
    } else if (status === 'pending' || status === 'paused') {
      return { ...baseStyle, background: '#fef3c7', color: '#92400e' };
    } else if (status === 'cancelled' || status === 'expired') {
      return { ...baseStyle, background: '#fee2e2', color: '#991b1b' };
    }
    return { ...baseStyle, background: '#f4f4f5', color: '#52525b' };
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '3rem 2rem',
      fontFamily: 'Quicksand, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Gabarito, sans-serif',
          fontSize: '2rem',
          color: '#18181b',
          marginBottom: '0.5rem'
        }}>
          {activeTab === 'profile'
            ? 'Profile Settings'
            : activeTab === 'subscriptions'
            ? 'My Subscriptions'
            : activeTab === 'invoices'
            ? 'My Invoices'
            : 'My Orders'}
        </h1>
        <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
          {activeTab === 'profile'
            ? 'Manage your personal details and account password'
            : activeTab === 'subscriptions'
            ? 'View and manage your active subscription plans and billing cycles'
            : activeTab === 'invoices'
            ? 'View and track your invoices, tax breakdowns, and complete online payments'
            : 'Track your order history, view invoices, and complete payments'}
        </p>
      </div>

      {/* Tabs Navigation - only show between Orders and Invoices when on orders/invoices page, completely removed from Profile page */}
      {activeTab !== 'profile' && activeTab !== 'subscriptions' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb',
            overflowX: 'auto'
          }}>
            {[
              { id: 'orders', label: '📦 Orders', path: '/shop/orders' },
              { id: 'invoices', label: '📄 Invoices & Payments', path: '/shop/invoices' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(tab.path);
                }}
                style={{
                  flex: 1,
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: activeTab === tab.id ? '#f9fafb' : 'white',
                  color: activeTab === tab.id ? '#875A7B' : '#71717a',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: activeTab === tab.id ? '700' : '500',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid #875A7B' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) e.target.style.background = '#fafafa';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) e.target.style.background = 'white';
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>

        {/* Tab Content */}
        <div style={{ padding: '2rem' }}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '1.5rem',
                color: '#18181b',
                marginBottom: '1.5rem'
              }}>
                Profile Settings
              </h2>
              
              <form onSubmit={handleProfileUpdate} style={{ maxWidth: '600px' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#18181b',
                    fontWeight: '500'
                  }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '0.95rem',
                      fontFamily: 'Quicksand, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#18181b',
                    fontWeight: '500'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '0.95rem',
                      fontFamily: 'Quicksand, sans-serif'
                    }}
                  />
                </div>

                <div style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '1.5rem',
                  marginTop: '2rem',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontFamily: 'Gabarito, sans-serif',
                    fontSize: '1.1rem',
                    color: '#18181b',
                    marginBottom: '1rem'
                  }}>
                    Change Password
                  </h3>
                  <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Leave blank if you don't want to change your password
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#18181b',
                    fontWeight: '500'
                  }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={profileForm.currentPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '0.95rem',
                      fontFamily: 'Quicksand, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#18181b',
                    fontWeight: '500'
                  }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={profileForm.newPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '0.95rem',
                      fontFamily: 'Quicksand, sans-serif'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#71717a' : '#18181b',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.background = '#27272a';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.target.style.background = '#18181b';
                  }}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>

              {/* Sign Out Section */}
              <div style={{
                marginTop: '3rem',
                paddingTop: '2rem',
                borderTop: '2px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '1.1rem',
                  color: '#18181b',
                  marginBottom: '1rem'
                }}>
                  Account Actions
                </h3>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                >
                  <span>🚪</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '1.5rem',
                color: '#18181b',
                marginBottom: '1.5rem'
              }}>
                Order History
              </h2>

              {loading ? (
                <div style={{ textAlign: 'center', color: '#71717a', padding: '2rem' }}>
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  background: '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                  <h3 style={{
                    fontFamily: 'Gabarito, sans-serif',
                    fontSize: '1.25rem',
                    color: '#18181b',
                    marginBottom: '0.5rem'
                  }}>
                    No orders yet
                  </h3>
                  <p style={{ color: '#71717a', marginBottom: '1.5rem' }}>
                    Start shopping to see your orders here
                  </p>
                  <button
                    onClick={() => navigate('/shop/products')}
                    style={{
                      background: '#18181b',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#27272a'}
                    onMouseLeave={(e) => e.target.style.background = '#18181b'}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map(order => {
                    const isExpanded = expandedOrderId === order.id;
                    const details = orderDetails[order.id];

                    return (
                      <div
                        key={order.id}
                        style={{
                          background: '#f9fafb',
                          border: `1px solid ${isExpanded ? '#875A7B' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          padding: '1.5rem',
                          transition: 'all 0.2s ease',
                          boxShadow: isExpanded ? '0 4px 16px rgba(135, 90, 123, 0.12)' : 'none'
                        }}
                      >
                        <div
                          onClick={() => handleToggleOrder(order.id)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <div>
                            <div style={{
                              fontFamily: 'Gabarito, sans-serif',
                              fontSize: '1.15rem',
                              color: '#875A7B',
                              fontWeight: '700',
                              marginBottom: '0.35rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span>Order #{order.id}</span>
                              <span style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: '500' }}>
                                {isExpanded ? '▲ Hide Details' : '▼ View Items'}
                              </span>
                            </div>
                            <div style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            <div style={{ color: '#71717a', fontSize: '0.9rem' }}>
                              {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontFamily: 'Gabarito, sans-serif',
                              fontSize: '1.35rem',
                              color: '#18181b',
                              fontWeight: '700',
                              marginBottom: '0.4rem'
                            }}>
                              ₹{order.total_amount.toFixed(2)}
                            </div>
                            <div style={getStatusBadgeStyle(order.status)}>
                              {order.status}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Order Lines */}
                        {isExpanded && (
                          <div style={{
                            marginTop: '1.25rem',
                            paddingTop: '1.25rem',
                            borderTop: '1px solid #EADBE7'
                          }}>
                            {loadingOrderId === order.id ? (
                              <div style={{ textAlign: 'center', color: '#71717a', padding: '1rem' }}>
                                Loading order items...
                              </div>
                            ) : (
                              <div>
                                <h4 style={{
                                  fontFamily: 'Gabarito, sans-serif',
                                  fontSize: '1rem',
                                  fontWeight: '600',
                                  color: '#2E2E2E',
                                  marginBottom: '0.75rem'
                                }}>
                                  Purchased Items
                                </h4>
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                      <tr style={{ background: '#f4f4f5', color: '#71717a', textAlign: 'left' }}>
                                        <th style={{ padding: '0.6rem 0.8rem', borderRadius: '6px 0 0 6px' }}>Item</th>
                                        <th style={{ padding: '0.6rem 0.8rem' }}>Plan</th>
                                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Qty</th>
                                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Price</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(details?.order_lines || []).map((line, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                          <td style={{ padding: '0.65rem 0.8rem', fontWeight: '600', color: '#2E2E2E' }}>
                                            {line.product_name}
                                          </td>
                                          <td style={{ padding: '0.65rem 0.8rem', color: '#6B6B6B' }}>
                                            {line.plan_name || 'Standard'}
                                          </td>
                                          <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', color: '#6B6B6B' }}>
                                            {line.quantity}
                                          </td>
                                          <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', fontWeight: '700', color: '#2E2E2E' }}>
                                            ₹{line.total_price.toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div>
              <h2 style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '1.5rem',
                color: '#18181b',
                marginBottom: '1.5rem'
              }}>
                My Subscriptions
              </h2>

              {loading ? (
                <div style={{ textAlign: 'center', color: '#71717a', padding: '2rem' }}>
                  Loading subscriptions...
                </div>
              ) : subscriptions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  background: '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
                  <h3 style={{
                    fontFamily: 'Gabarito, sans-serif',
                    fontSize: '1.25rem',
                    color: '#18181b',
                    marginBottom: '0.5rem'
                  }}>
                    No subscriptions yet
                  </h3>
                  <p style={{ color: '#71717a', marginBottom: '1.5rem' }}>
                    Subscribe to a service to see your subscriptions here
                  </p>
                  <button
                    onClick={() => navigate('/shop/products')}
                    style={{
                      background: '#18181b',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#27272a'}
                    onMouseLeave={(e) => e.target.style.background = '#18181b'}
                  >
                    Browse Services
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {subscriptions.map(sub => (
                    <div
                      key={sub.id}
                      style={{
                        background: '#f9fafb',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div style={{
                        fontFamily: 'Gabarito, sans-serif',
                        fontSize: '1.1rem',
                        color: '#18181b',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        {sub.product_name}
                      </div>
                      <div style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        {sub.plan_name}
                      </div>
                      
                      <div style={getStatusBadgeStyle(sub.status)}>
                        {sub.status}
                      </div>
                      
                      <div style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                          Started: {new Date(sub.start_date).toLocaleDateString()}
                        </div>
                        {sub.next_billing_date && sub.status === 'active' && (
                          <div style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            Next Billing: {new Date(sub.next_billing_date).toLocaleDateString()}
                          </div>
                        )}
                        {sub.end_date && (
                          <div style={{ color: '#71717a', fontSize: '0.85rem' }}>
                            Ended: {new Date(sub.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {sub.status === 'active' && (
                        <button
                          onClick={() => handleCancelSubscription(sub.id)}
                          style={{
                            width: '100%',
                            marginTop: '1rem',
                            background: 'white',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#ef4444';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.color = '#ef4444';
                          }}
                        >
                          Cancel Subscription
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{
                    fontFamily: 'Gabarito, sans-serif',
                    fontSize: '1.5rem',
                    color: '#18181b',
                    margin: 0
                  }}>
                    Invoice History & Payments
                  </h2>
                  <p style={{ color: '#71717a', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    View and track your invoices, tax breakdowns, and complete online payments
                  </p>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', color: '#71717a', padding: '2rem' }}>
                  Loading invoices...
                </div>
              ) : invoices.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  background: '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                  <h3 style={{
                    fontFamily: 'Gabarito, sans-serif',
                    fontSize: '1.25rem',
                    color: '#18181b',
                    marginBottom: '0.5rem'
                  }}>
                    No invoices yet
                  </h3>
                  <p style={{ color: '#71717a' }}>
                    Your invoices and tax receipts will appear here after you make a purchase
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {invoices.map(invoice => {
                    const isExpanded = expandedInvoiceId === invoice.id;
                    const details = invoiceDetails[invoice.id];
                    const subtotal = invoice.subtotal != null ? invoice.subtotal : (invoice.total_amount ? invoice.total_amount / 1.18 : 0);
                    const taxAmt = invoice.tax_amount != null ? invoice.tax_amount : (invoice.total_amount ? invoice.total_amount - subtotal : 0);

                    return (
                      <div
                        key={invoice.id}
                        style={{
                          background: '#f9fafb',
                          border: `1px solid ${isExpanded ? '#875A7B' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          padding: '1.5rem',
                          transition: 'all 0.2s ease',
                          boxShadow: isExpanded ? '0 4px 16px rgba(135, 90, 123, 0.12)' : 'none'
                        }}
                      >
                        <div
                          onClick={() => handleToggleInvoice(invoice.id)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <div>
                            <div style={{
                              fontFamily: 'Gabarito, sans-serif',
                              fontSize: '1.15rem',
                              color: '#875A7B',
                              fontWeight: '700',
                              marginBottom: '0.35rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span>{invoice.number || `INV-${invoice.id}`}</span>
                              <span style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: '500' }}>
                                {isExpanded ? '▲ Hide Details' : '▼ View Breakdown'}
                              </span>
                            </div>
                            <div style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                              Issued: {new Date(invoice.date_issued).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              {' • '}
                              Due: {new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{
                                background: '#EADBE7',
                                color: '#875A7B',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}>
                                Subtotal: ₹{subtotal.toFixed(2)}
                              </span>
                              <span style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}>
                                Tax (GST 18%): ₹{taxAmt.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                            <div style={{
                              fontFamily: 'Gabarito, sans-serif',
                              fontSize: '1.35rem',
                              color: '#18181b',
                              fontWeight: '700'
                            }}>
                              ₹{(invoice.total_amount || 0).toFixed(2)}
                            </div>
                            <div style={getStatusBadgeStyle(invoice.status)}>
                              {invoice.status}
                            </div>
                            {invoice.status !== 'paid' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStripeInvoice(invoice);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.5rem 1rem',
                                  background: 'linear-gradient(135deg, #635BFF 0%, #0A2540 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(99, 91, 255, 0.3)',
                                  marginTop: '0.25rem'
                                }}
                              >
                                ⚡ Pay with Stripe Gateway
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Itemized Breakdown with Taxes */}
                        {isExpanded && (
                          <div style={{
                            marginTop: '1.25rem',
                            paddingTop: '1.25rem',
                            borderTop: '1px solid #EADBE7'
                          }}>
                            {loadingInvoiceId === invoice.id ? (
                              <div style={{ textAlign: 'center', color: '#71717a', padding: '1rem' }}>
                                Loading line items and tax calculations...
                              </div>
                            ) : (
                              <div>
                                <h4 style={{
                                  fontFamily: 'Gabarito, sans-serif',
                                  fontSize: '1rem',
                                  fontWeight: '600',
                                  color: '#2E2E2E',
                                  marginBottom: '0.75rem'
                                }}>
                                  Itemized Details & Tax Calculation
                                </h4>
                                <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                      <tr style={{ background: '#f4f4f5', color: '#71717a', textAlign: 'left' }}>
                                        <th style={{ padding: '0.6rem 0.8rem', borderRadius: '6px 0 0 6px' }}>Item</th>
                                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Qty</th>
                                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Tax Rate</th>
                                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Tax Amount</th>
                                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Line Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(details?.invoice_lines && details.invoice_lines.length > 0 ? details.invoice_lines : [{
                                        product_name: invoice.number || 'Subscription Service',
                                        quantity: 1,
                                        unit_price: subtotal,
                                        tax_rate: 18,
                                        tax_amount: taxAmt,
                                        total_with_tax: invoice.total_amount
                                      }]).map((line, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                          <td style={{ padding: '0.65rem 0.8rem', fontWeight: '600', color: '#2E2E2E' }}>
                                            {line.product_name || 'Service Product'}
                                          </td>
                                          <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', color: '#6B6B6B' }}>
                                            {line.quantity || 1}
                                          </td>
                                          <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', color: '#6B6B6B' }}>
                                            ₹{(line.unit_price || line.price_subtotal || 0).toFixed(2)}
                                          </td>
                                          <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', color: '#6B6B6B' }}>
                                            {line.tax_rate || 18}%
                                          </td>
                                          <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', color: '#1e40af', fontWeight: '600' }}>
                                            +₹{(line.tax_amount != null ? line.tax_amount : (line.price_subtotal || line.unit_price || 0) * 0.18).toFixed(2)}
                                          </td>
                                          <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', fontWeight: '700', color: '#2E2E2E' }}>
                                            ₹{(line.total_with_tax || (line.unit_price || 0) * 1.18).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <div style={{
                                    background: 'white',
                                    border: '1px solid #EADBE7',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    minWidth: '260px'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#6B6B6B', fontSize: '0.9rem' }}>
                                      <span>Subtotal:</span>
                                      <span style={{ fontWeight: '600', color: '#2E2E2E' }}>₹{(details?.subtotal || subtotal).toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#1e40af', fontSize: '0.9rem' }}>
                                      <span>GST Tax (18%):</span>
                                      <span style={{ fontWeight: '600' }}>+₹{(details?.tax_amount || taxAmt).toFixed(2)}</span>
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      paddingTop: '0.5rem',
                                      borderTop: '1px solid #EADBE7',
                                      fontSize: '1.05rem',
                                      fontWeight: '700',
                                      color: '#875A7B'
                                    }}>
                                      <span>Total Amount:</span>
                                      <span>₹{(details?.total_amount || invoice.total_amount).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stripe Payment Modal for Customer Portal */}
      {stripeInvoice && (
        <StripePaymentModal
          isOpen={!!stripeInvoice}
          onClose={() => setStripeInvoice(null)}
          invoice={stripeInvoice}
          customerName={currentUser?.name || profile.name}
          isCustomerPortal={true}
          onSuccess={() => {
            fetchInvoices();
            fetchSubscriptions();
          }}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
