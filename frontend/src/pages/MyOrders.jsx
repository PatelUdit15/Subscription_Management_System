import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const MyOrders = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/my/orders');
      console.log('Orders response:', response.data);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
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

  const handleOrderClick = async (orderId) => {
    // Toggle expansion
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      
      // Fetch order details if not already loaded
      if (!orderDetails[orderId]) {
        try {
          const response = await axios.get(`/my/orders/${orderId}`);
          setOrderDetails(prev => ({
            ...prev,
            [orderId]: response.data
          }));
        } catch (error) {
          console.error('Error fetching order details:', error);
        }
      }
    }
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
                onClick={() => navigate('/shop/my-profile')}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  color: '#d97706',
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
                onClick={() => navigate('/shop/my-orders')}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: '#d97706',
                  color: '#1a1a1a',
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
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 2rem'
      }}>
        <div style={{
          background: '#2a2a2a',
          border: '2px solid #d97706',
          borderRadius: '12px',
          padding: '2rem'
        }}>
          {/* Header */}
          <div style={{
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid #d97706'
          }}>
            <h1 style={{
              color: '#d97706',
              fontSize: '1.5rem',
              fontWeight: '600',
              fontFamily: 'Gabarito, sans-serif',
              marginBottom: '0.5rem'
            }}>
              Order
            </h1>
          </div>

          {/* Orders Table */}
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
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '2px solid #d97706'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#d97706',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      fontFamily: 'Gabarito, sans-serif'
                    }}>
                      Order
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#d97706',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      fontFamily: 'Gabarito, sans-serif'
                    }}>
                      Order Date
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#d97706',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      fontFamily: 'Gabarito, sans-serif'
                    }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <React.Fragment key={order.id}>
                      <tr
                        onClick={(e) => {
                          // Only expand if not clicking the order ID
                          if (!e.target.closest('.order-id-link')) {
                            handleOrderClick(order.id);
                          }
                        }}
                        style={{
                          borderBottom: expandedOrderId === order.id ? 'none' : (index < orders.length - 1 ? '1px solid #d97706' : 'none'),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: expandedOrderId === order.id ? '#1a1a1a' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (expandedOrderId !== order.id) {
                            e.currentTarget.style.background = '#1a1a1a';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (expandedOrderId !== order.id) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <td style={{
                          padding: '1.5rem 1rem',
                          color: '#d97706',
                          fontSize: '1.1rem',
                          fontWeight: '700'
                        }}>
                          <span 
                            className="order-id-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/shop/order/${order.id}`);
                            }}
                            style={{
                              color: '#3b82f6',
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#60a5fa'}
                            onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
                          >
                            Order #{order.id}
                          </span>
                        </td>
                        <td style={{
                          padding: '1.5rem 1rem',
                          textAlign: 'center',
                          color: '#d97706',
                          fontSize: '0.9rem',
                          opacity: 0.8
                        }}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A'}
                        </td>
                        <td style={{
                          padding: '1.5rem 1rem',
                          textAlign: 'center',
                          color: '#d97706',
                          fontSize: '0.9rem',
                          opacity: 0.8
                        }}>
                          {order.items_count || 0} item{order.items_count !== 1 ? 's' : ''}
                        </td>
                        <td style={{
                          padding: '1.5rem 1rem',
                          textAlign: 'right'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '1rem'
                          }}>
                            <span style={{
                              color: '#d97706',
                              fontSize: '1.3rem',
                              fontWeight: '700',
                              fontFamily: 'Gabarito, sans-serif'
                            }}>
                              ${order.total_amount?.toFixed(2) || '0.00'}
                            </span>
                            <div style={{
                              padding: '0.5rem 1rem',
                              background: '#10b981',
                              color: '#1a1a1a',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {order.status}
                            </div>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Section */}
                      {expandedOrderId === order.id && orderDetails[order.id] && (
                        <tr>
                          <td colSpan="4" style={{
                            padding: 0,
                            borderBottom: index < orders.length - 1 ? '2px solid #d97706' : 'none'
                          }}>
                            <div style={{
                              background: '#1a1a1a',
                              padding: '2rem',
                              animation: 'slideDown 0.3s ease'
                            }}>
                              {/* Order Details Content */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '2rem',
                                marginBottom: '2rem'
                              }}>
                                {/* Left Column - Order Info */}
                                <div>
                                  <h4 style={{
                                    color: '#d97706',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    marginBottom: '1rem'
                                  }}>
                                    Your Information
                                  </h4>
                                  <div style={{
                                    background: '#2a2a2a',
                                    border: '1px solid #d97706',
                                    borderRadius: '8px',
                                    padding: '1rem'
                                  }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                      <div style={{ color: '#d97706', fontSize: '0.8rem', opacity: 0.7 }}>Plan</div>
                                      <div style={{ color: '#d97706', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {orderDetails[order.id].order_lines?.[0]?.plan_name || 'N/A'}
                                      </div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                      <div style={{ color: '#d97706', fontSize: '0.8rem', opacity: 0.7 }}>Start Date</div>
                                      <div style={{ color: '#d97706', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {orderDetails[order.id].created_at ? new Date(orderDetails[order.id].created_at).toLocaleDateString() : 'N/A'}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ color: '#d97706', fontSize: '0.8rem', opacity: 0.7 }}>End Date</div>
                                      <div style={{ color: '#d97706', fontSize: '0.95rem', fontWeight: '600' }}>-</div>
                                    </div>
                                  </div>

                                  <h4 style={{
                                    color: '#d97706',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    marginTop: '1.5rem',
                                    marginBottom: '1rem'
                                  }}>
                                    Last Payment
                                  </h4>
                                  <div style={{
                                    background: '#2a2a2a',
                                    border: '1px solid #d97706',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div>
                                      <div style={{ color: '#d97706', fontSize: '0.8rem', opacity: 0.7 }}>Payment Date</div>
                                      <div style={{ color: '#d97706', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {orderDetails[order.id].created_at ? new Date(orderDetails[order.id].created_at).toLocaleDateString() : 'N/A'}
                                      </div>
                                    </div>
                                    <div style={{
                                      padding: '0.4rem 0.8rem',
                                      background: '#10b981',
                                      color: '#1a1a1a',
                                      borderRadius: '6px',
                                      fontSize: '0.8rem',
                                      fontWeight: '600'
                                    }}>
                                      Paid
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column - Addresses */}
                                <div>
                                  <h4 style={{
                                    color: '#d97706',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    marginBottom: '1rem'
                                  }}>
                                    Invoicing and Shipping Address
                                  </h4>
                                  <div style={{
                                    background: '#2a2a2a',
                                    border: '1px solid #d97706',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '1rem'
                                  }}>
                                    <div style={{ color: '#d97706', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                                      Invoice Address
                                    </div>
                                    <div style={{ color: '#d97706', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                      {orderDetails[order.id].billing_address || 'N/A'}
                                    </div>
                                  </div>
                                  <div style={{
                                    background: '#2a2a2a',
                                    border: '1px solid #d97706',
                                    borderRadius: '8px',
                                    padding: '1rem'
                                  }}>
                                    <div style={{ color: '#d97706', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                                      Delivery Address
                                    </div>
                                    <div style={{ color: '#d97706', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                      {orderDetails[order.id].shipping_address || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Products Table */}
                              <div style={{
                                marginTop: '2rem',
                                paddingTop: '2rem',
                                borderTop: '2px solid #d97706'
                              }}>
                                <h4 style={{
                                  color: '#d97706',
                                  fontSize: '1.2rem',
                                  fontWeight: '600',
                                  marginBottom: '1rem'
                                }}>
                                  Products
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '2px solid #d97706' }}>
                                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#d97706', fontSize: '0.9rem' }}>Product</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'center', color: '#d97706', fontSize: '0.9rem' }}>Quantity</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'right', color: '#d97706', fontSize: '0.9rem' }}>Unit Price</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'right', color: '#d97706', fontSize: '0.9rem' }}>Taxes</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'right', color: '#d97706', fontSize: '0.9rem' }}>Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {orderDetails[order.id].order_lines?.map((line, idx) => (
                                      <tr key={line.id} style={{ borderBottom: idx < orderDetails[order.id].order_lines.length - 1 ? '1px solid #d97706' : 'none' }}>
                                        <td style={{ padding: '1rem 0.75rem', color: '#d97706' }}>
                                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{line.product_name}</div>
                                          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>10% tax on your order</div>
                                        </td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: '#d97706', fontWeight: '600' }}>
                                          {line.quantity}
                                        </td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#d97706' }}>
                                          ${line.unit_price?.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#d97706' }}>
                                          10%
                                        </td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#d97706', fontWeight: '700' }}>
                                          ${line.total_price?.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                {/* Totals */}
                                <div style={{
                                  marginTop: '1.5rem',
                                  paddingTop: '1rem',
                                  borderTop: '2px solid #d97706',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  gap: '0.75rem'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                                    <span style={{ color: '#d97706' }}>Untaxed Amount:</span>
                                    <span style={{ color: '#d97706', fontWeight: '600' }}>
                                      ${(orderDetails[order.id].total_amount / 1.1).toFixed(2)}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                                    <span style={{ color: '#d97706' }}>Taxes (10%):</span>
                                    <span style={{ color: '#d97706', fontWeight: '600' }}>
                                      ${(orderDetails[order.id].total_amount * 0.1 / 1.1).toFixed(2)}
                                    </span>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '250px',
                                    paddingTop: '0.75rem',
                                    borderTop: '1px solid #d97706'
                                  }}>
                                    <span style={{ color: '#d97706', fontSize: '1.2rem', fontWeight: '700' }}>Total:</span>
                                    <span style={{ color: '#d97706', fontSize: '1.2rem', fontWeight: '700' }}>
                                      ${orderDetails[order.id].total_amount?.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {/* Note */}
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
                <strong>Note:</strong> Click on any order to view detailed information. Orders are listed from most recent to oldest.
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MyOrders;
