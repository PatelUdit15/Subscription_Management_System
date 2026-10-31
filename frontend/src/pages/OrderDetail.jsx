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

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

          <button onClick={() => navigate('/shop/my-profile')} style={{
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
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 2rem'
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/shop/my-orders')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            color: '#d97706',
            border: '2px solid #d97706',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '2rem'
          }}
        >
          ← Back to Orders
        </button>

        <div style={{
          background: '#2a2a2a',
          border: '2px solid #d97706',
          borderRadius: '12px',
          padding: '2rem'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              color: '#d97706',
              padding: '3rem',
              fontSize: '1.2rem'
            }}>
              Loading order details...
            </div>
          ) : !order ? (
            <div style={{
              textAlign: 'center',
              color: '#d97706',
              padding: '3rem',
              fontSize: '1.2rem'
            }}>
              Order not found
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid #d97706'
              }}>
                <h1 style={{
                  color: '#d97706',
                  fontSize: '1.8rem',
                  fontWeight: '600',
                  fontFamily: 'Gabarito, sans-serif',
                  marginBottom: '0.5rem'
                }}>
                  Order Details
                </h1>
                <div style={{
                  color: '#d97706',
                  fontSize: '1.1rem',
                  opacity: 0.8
                }}>
                  Order #{order.id}
                </div>
              </div>

              {/* Order Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <div style={{
                    color: '#d97706',
                    fontSize: '0.9rem',
                    opacity: 0.7,
                    marginBottom: '0.5rem'
                  }}>
                    Order Date
                  </div>
                  <div style={{
                    color: '#d97706',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div>
                  <div style={{
                    color: '#d97706',
                    fontSize: '0.9rem',
                    opacity: 0.7,
                    marginBottom: '0.5rem'
                  }}>
                    Status
                  </div>
                  <div style={{
                    color: '#d97706',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {order.status}
                  </div>
                </div>

                <div>
                  <div style={{
                    color: '#d97706',
                    fontSize: '0.9rem',
                    opacity: 0.7,
                    marginBottom: '0.5rem'
                  }}>
                    Shipping Address
                  </div>
                  <div style={{
                    color: '#d97706',
                    fontSize: '1rem'
                  }}>
                    {order.shipping_address || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{
                    color: '#d97706',
                    fontSize: '0.9rem',
                    opacity: 0.7,
                    marginBottom: '0.5rem'
                  }}>
                    Billing Address
                  </div>
                  <div style={{
                    color: '#d97706',
                    fontSize: '1rem'
                  }}>
                    {order.billing_address || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div style={{
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '2px solid #d97706'
              }}>
                <h2 style={{
                  color: '#d97706',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  fontFamily: 'Gabarito, sans-serif',
                  marginBottom: '1.5rem'
                }}>
                  Order Items
                </h2>

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
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}>
                          Product
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#d97706',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}>
                          Plan
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#d97706',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}>
                          Quantity
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'right',
                          color: '#d97706',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}>
                          Unit Price
                        </th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'right',
                          color: '#d97706',
                          fontSize: '1rem',
                          fontWeight: '600'
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
                            borderBottom: index < order.order_lines.length - 1 ? '1px solid #d97706' : 'none'
                          }}
                        >
                          <td style={{
                            padding: '1rem',
                            color: '#d97706',
                            fontSize: '1rem'
                          }}>
                            {line.product_name}
                          </td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'center',
                            color: '#d97706',
                            fontSize: '0.9rem',
                            opacity: 0.8
                          }}>
                            {line.plan_name}
                          </td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'center',
                            color: '#d97706',
                            fontSize: '1rem'
                          }}>
                            {line.quantity}
                          </td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'right',
                            color: '#d97706',
                            fontSize: '1rem'
                          }}>
                            ${line.unit_price?.toFixed(2)}
                          </td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'right',
                            color: '#d97706',
                            fontSize: '1rem',
                            fontWeight: '600'
                          }}>
                            ${line.total_price?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div style={{
                  marginTop: '2rem',
                  paddingTop: '1rem',
                  borderTop: '2px solid #d97706',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem'
                  }}>
                    <span style={{
                      color: '#d97706',
                      fontSize: '1.3rem',
                      fontWeight: '600',
                      fontFamily: 'Gabarito, sans-serif'
                    }}>
                      Total:
                    </span>
                    <span style={{
                      color: '#d97706',
                      fontSize: '1.8rem',
                      fontWeight: '700',
                      fontFamily: 'Gabarito, sans-serif'
                    }}>
                      ${order.total_amount?.toFixed(2)}
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
