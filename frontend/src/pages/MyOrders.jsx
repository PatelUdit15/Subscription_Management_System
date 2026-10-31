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
      background: '#F6F6F6',
      minHeight: '100vh'
    }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #875A7B 0%, #A6789C 100%)',
        padding: '2.5rem 2rem',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '2rem',
                fontWeight: '700',
                margin: 0
              }}>
                My Orders
              </h1>
              <p style={{ opacity: 0.9, marginTop: '0.25rem', fontSize: '0.95rem' }}>
                View and track all your orders
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
        maxWidth: '1200px',
        margin: '-1.5rem auto 0',
        padding: '0 2rem 3rem',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #EADBE7',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(46, 46, 46, 0.08)'
        }}>
          {/* Orders Table */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              color: '#6B6B6B',
              padding: '3rem',
              fontSize: '1rem'
            }}>
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#2E2E2E',
                fontFamily: 'Gabarito, sans-serif',
                marginBottom: '0.5rem'
              }}>
                No orders yet
              </h3>
              <p style={{ color: '#6B6B6B', marginBottom: '2rem' }}>
                Start shopping to see your orders here
              </p>
              <button
                onClick={() => navigate('/shop/products')}
                style={{
                  padding: '0.85rem 2rem',
                  background: '#875A7B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  fontFamily: 'Quicksand, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(135, 90, 123, 0.3)'
                }}
                onMouseEnter={(e) => e.target.style.background = '#A6789C'}
                onMouseLeave={(e) => e.target.style.background = '#875A7B'}
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
                    borderBottom: '2px solid #EADBE7'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#875A7B',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      fontFamily: 'Gabarito, sans-serif'
                    }}>
                      Order
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#875A7B',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      fontFamily: 'Gabarito, sans-serif'
                    }}>
                      Order Date
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#875A7B',
                      fontSize: '0.95rem',
                      fontWeight: '700',
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
                          if (!e.target.closest('.order-id-link')) {
                            handleOrderClick(order.id);
                          }
                        }}
                        style={{
                          borderBottom: expandedOrderId === order.id ? 'none' : (index < orders.length - 1 ? '1px solid #EADBE7' : 'none'),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: expandedOrderId === order.id ? '#F6F6F6' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (expandedOrderId !== order.id) {
                            e.currentTarget.style.background = '#F6F6F6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (expandedOrderId !== order.id) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <td style={{
                          padding: '1.25rem 1rem',
                          color: '#2E2E2E',
                          fontSize: '1rem',
                          fontWeight: '700'
                        }}>
                          <span 
                            className="order-id-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/shop/order/${order.id}`);
                            }}
                            style={{
                              color: '#875A7B',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontFamily: 'Gabarito, sans-serif'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#A6789C'}
                            onMouseLeave={(e) => e.target.style.color = '#875A7B'}
                          >
                            Order #{order.id}
                          </span>
                        </td>
                        <td style={{
                          padding: '1.25rem 1rem',
                          textAlign: 'center',
                          color: '#6B6B6B',
                          fontSize: '0.9rem'
                        }}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A'}
                        </td>
                        <td style={{
                          padding: '1.25rem 1rem',
                          textAlign: 'right'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '1rem'
                          }}>
                            <span style={{
                              color: '#2E2E2E',
                              fontSize: '1.2rem',
                              fontWeight: '700',
                              fontFamily: 'Gabarito, sans-serif'
                            }}>
                              ${order.total_amount?.toFixed(2) || '0.00'}
                            </span>
                            <div style={{
                              padding: '0.35rem 0.85rem',
                              background: '#dcfce7',
                              color: '#166534',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
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
                            borderBottom: index < orders.length - 1 ? '2px solid #EADBE7' : 'none'
                          }}>
                            <div style={{
                              background: '#F6F6F6',
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
                                    color: '#875A7B',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    fontFamily: 'Gabarito, sans-serif',
                                    marginBottom: '1rem'
                                  }}>
                                    Your Information
                                  </h4>
                                  <div style={{
                                    background: 'white',
                                    border: '1px solid #EADBE7',
                                    borderRadius: '10px',
                                    padding: '1rem'
                                  }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                      <div style={{ color: '#6B6B6B', fontSize: '0.8rem', fontWeight: '600' }}>Plan</div>
                                      <div style={{ color: '#2E2E2E', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {orderDetails[order.id].order_lines?.[0]?.plan_name || 'N/A'}
                                      </div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                      <div style={{ color: '#6B6B6B', fontSize: '0.8rem', fontWeight: '600' }}>Start Date</div>
                                      <div style={{ color: '#2E2E2E', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {orderDetails[order.id].created_at ? new Date(orderDetails[order.id].created_at).toLocaleDateString() : 'N/A'}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ color: '#6B6B6B', fontSize: '0.8rem', fontWeight: '600' }}>End Date</div>
                                      <div style={{ color: '#2E2E2E', fontSize: '0.95rem', fontWeight: '600' }}>-</div>
                                    </div>
                                  </div>

                                  <h4 style={{
                                    color: '#875A7B',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    fontFamily: 'Gabarito, sans-serif',
                                    marginTop: '1.5rem',
                                    marginBottom: '1rem'
                                  }}>
                                    Last Payment
                                  </h4>
                                  <div style={{
                                    background: 'white',
                                    border: '1px solid #EADBE7',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div>
                                      <div style={{ color: '#6B6B6B', fontSize: '0.8rem', fontWeight: '600' }}>Payment Date</div>
                                      <div style={{ color: '#2E2E2E', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {orderDetails[order.id].created_at ? new Date(orderDetails[order.id].created_at).toLocaleDateString() : 'N/A'}
                                      </div>
                                    </div>
                                    <div style={{
                                      padding: '0.35rem 0.75rem',
                                      background: '#dcfce7',
                                      color: '#166534',
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
                                    color: '#875A7B',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    fontFamily: 'Gabarito, sans-serif',
                                    marginBottom: '1rem'
                                  }}>
                                    Invoicing and Shipping Address
                                  </h4>
                                  <div style={{
                                    background: 'white',
                                    border: '1px solid #EADBE7',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    marginBottom: '1rem'
                                  }}>
                                    <div style={{ color: '#6B6B6B', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                      Invoice Address
                                    </div>
                                    <div style={{ color: '#2E2E2E', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                      {orderDetails[order.id].billing_address || 'N/A'}
                                    </div>
                                  </div>
                                  <div style={{
                                    background: 'white',
                                    border: '1px solid #EADBE7',
                                    borderRadius: '10px',
                                    padding: '1rem'
                                  }}>
                                    <div style={{ color: '#6B6B6B', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                      Delivery Address
                                    </div>
                                    <div style={{ color: '#2E2E2E', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                      {orderDetails[order.id].shipping_address || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Products Table */}
                              <div style={{
                                marginTop: '2rem',
                                paddingTop: '2rem',
                                borderTop: '2px solid #EADBE7'
                              }}>
                                <h4 style={{
                                  color: '#875A7B',
                                  fontSize: '1.1rem',
                                  fontWeight: '700',
                                  fontFamily: 'Gabarito, sans-serif',
                                  marginBottom: '1rem'
                                }}>
                                  Products
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '2px solid #EADBE7' }}>
                                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#875A7B', fontSize: '0.9rem', fontWeight: '700' }}>Product</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'center', color: '#875A7B', fontSize: '0.9rem', fontWeight: '700' }}>Quantity</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'right', color: '#875A7B', fontSize: '0.9rem', fontWeight: '700' }}>Unit Price</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'right', color: '#875A7B', fontSize: '0.9rem', fontWeight: '700' }}>Taxes</th>
                                      <th style={{ padding: '0.75rem', textAlign: 'right', color: '#875A7B', fontSize: '0.9rem', fontWeight: '700' }}>Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {orderDetails[order.id].order_lines?.map((line, idx) => (
                                      <tr key={line.id} style={{ borderBottom: idx < orderDetails[order.id].order_lines.length - 1 ? '1px solid #EADBE7' : 'none' }}>
                                        <td style={{ padding: '1rem 0.75rem', color: '#2E2E2E' }}>
                                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{line.product_name}</div>
                                          <div style={{ fontSize: '0.8rem', color: '#6B6B6B' }}>10% tax on your order</div>
                                        </td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: '#2E2E2E', fontWeight: '600' }}>
                                          {line.quantity}
                                        </td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#2E2E2E' }}>
                                          ${line.unit_price?.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#6B6B6B' }}>
                                          10%
                                        </td>
                                        <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#2E2E2E', fontWeight: '700' }}>
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
                                  borderTop: '2px solid #EADBE7',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  gap: '0.75rem'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                                    <span style={{ color: '#6B6B6B' }}>Untaxed Amount:</span>
                                    <span style={{ color: '#2E2E2E', fontWeight: '600' }}>
                                      ${(orderDetails[order.id].total_amount / 1.1).toFixed(2)}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px' }}>
                                    <span style={{ color: '#6B6B6B' }}>Taxes (10%):</span>
                                    <span style={{ color: '#2E2E2E', fontWeight: '600' }}>
                                      ${(orderDetails[order.id].total_amount * 0.1 / 1.1).toFixed(2)}
                                    </span>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '250px',
                                    paddingTop: '0.75rem',
                                    borderTop: '1px solid #EADBE7'
                                  }}>
                                    <span style={{ color: '#875A7B', fontSize: '1.15rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif' }}>Total:</span>
                                    <span style={{ color: '#875A7B', fontSize: '1.15rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif' }}>
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
                padding: '1rem 1.25rem',
                background: '#EADBE7',
                borderRadius: '10px',
                color: '#2E2E2E',
                fontSize: '0.9rem',
                lineHeight: 1.6
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
