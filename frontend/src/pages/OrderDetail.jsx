import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const OrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { logout } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/my/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
    } finally {
      setLoading(false);
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
                Order Details
              </h1>
              <p style={{ opacity: 0.9, marginTop: '0.25rem', fontSize: '0.95rem' }}>
                Order #{orderId}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => navigate('/shop/my-orders')}
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
                ← Back to Orders
              </button>
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
                Home
              </button>
            </div>
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
          padding: '2.5rem',
          boxShadow: '0 4px 12px rgba(46, 46, 46, 0.08)'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              color: '#6B6B6B',
              padding: '3rem',
              fontSize: '1rem'
            }}>
              Loading order details...
            </div>
          ) : !order ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{
                color: '#2E2E2E',
                fontSize: '1.3rem',
                fontFamily: 'Gabarito, sans-serif',
                marginBottom: '0.5rem'
              }}>
                Order not found
              </h3>
              <p style={{ color: '#6B6B6B' }}>
                This order may not exist or you may not have access to it.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{
                marginBottom: '2rem',
                paddingBottom: '1.25rem',
                borderBottom: '2px solid #EADBE7'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{
                    color: '#2E2E2E',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    fontFamily: 'Gabarito, sans-serif',
                    margin: 0
                  }}>
                    Order #{order.id}
                  </h2>
                  <span style={{
                    padding: '0.4rem 1rem',
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: '#F6F6F6',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #EADBE7'
                }}>
                  <div style={{ color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Order Date
                  </div>
                  <div style={{ color: '#2E2E2E', fontSize: '1.05rem', fontWeight: '600' }}>
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div style={{
                  background: '#F6F6F6',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #EADBE7'
                }}>
                  <div style={{ color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Status
                  </div>
                  <div style={{ color: '#2E2E2E', fontSize: '1.05rem', fontWeight: '600', textTransform: 'capitalize' }}>
                    {order.status}
                  </div>
                </div>

                <div style={{
                  background: '#F6F6F6',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #EADBE7'
                }}>
                  <div style={{ color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Shipping Address
                  </div>
                  <div style={{ color: '#2E2E2E', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {order.shipping_address || 'N/A'}
                  </div>
                </div>

                <div style={{
                  background: '#F6F6F6',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #EADBE7'
                }}>
                  <div style={{ color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Billing Address
                  </div>
                  <div style={{ color: '#2E2E2E', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {order.billing_address || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div style={{
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '2px solid #EADBE7'
              }}>
                <h3 style={{
                  color: '#875A7B',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  fontFamily: 'Gabarito, sans-serif',
                  marginBottom: '1.5rem'
                }}>
                  Order Items
                </h3>

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
                          fontSize: '0.9rem',
                          fontWeight: '700'
                        }}>
                          Product
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#875A7B',
                          fontSize: '0.9rem',
                          fontWeight: '700'
                        }}>
                          Plan
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#875A7B',
                          fontSize: '0.9rem',
                          fontWeight: '700'
                        }}>
                          Quantity
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'right',
                          color: '#875A7B',
                          fontSize: '0.9rem',
                          fontWeight: '700'
                        }}>
                          Unit Price
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'right',
                          color: '#875A7B',
                          fontSize: '0.9rem',
                          fontWeight: '700'
                        }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_lines?.map((line, index) => (
                        <tr
                          key={line.id}
                          style={{
                            borderBottom: index < order.order_lines.length - 1 ? '1px solid #EADBE7' : 'none'
                          }}
                        >
                          <td style={{
                            padding: '1rem',
                            color: '#2E2E2E',
                            fontWeight: '600'
                          }}>
                            {line.product_name}
                          </td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'center',
                            color: '#6B6B6B',
                            fontSize: '0.9rem'
                          }}>
                            {line.plan_name}
                          </td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'center',
                            color: '#2E2E2E',
                            fontWeight: '600'
                          }}>
                            {line.quantity}
                          </td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'right',
                            color: '#2E2E2E'
                          }}>
                            ₹{line.unit_price?.toFixed(2)}
                          </td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'right',
                            color: '#2E2E2E',
                            fontWeight: '700',
                            fontFamily: 'Gabarito, sans-serif'
                          }}>
                            ₹{line.total_price?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div style={{
                  marginTop: '2rem',
                  paddingTop: '1.25rem',
                  borderTop: '2px solid #EADBE7',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem'
                  }}>
                    <span style={{
                      color: '#6B6B6B',
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}>
                      Total:
                    </span>
                    <span style={{
                      color: '#875A7B',
                      fontSize: '1.8rem',
                      fontWeight: '700',
                      fontFamily: 'Gabarito, sans-serif'
                    }}>
                      ₹{order.total_amount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
