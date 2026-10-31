import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3rem 2rem',
        fontFamily: 'Quicksand, sans-serif',
        textAlign: 'center'
      }}>
        <div style={{ color: '#71717a' }}>Loading order details...</div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '3rem 2rem',
      fontFamily: 'Quicksand, sans-serif'
    }}>
      {/* Success Animation */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem 2rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          margin: '0 auto 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
          boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
          animation: 'scaleIn 0.5s ease-out'
        }}>
          ✓
        </div>

        {/* Success Message */}
        <h1 style={{
          fontFamily: 'Gabarito, sans-serif',
          fontSize: '2.5rem',
          color: '#18181b',
          marginBottom: '1rem'
        }}>
          Order Placed Successfully!
        </h1>

        <p style={{
          color: '#71717a',
          fontSize: '1.1rem',
          marginBottom: '2rem',
          lineHeight: 1.6
        }}>
          Thank you for your purchase. Your subscription has been activated and your first invoice has been generated.
        </p>

        {/* Order Details Card */}
        {order && (
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <div>
                <div style={{
                  color: '#71717a',
                  fontSize: '0.9rem',
                  marginBottom: '0.25rem'
                }}>
                  Order Number
                </div>
                <div style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '1.5rem',
                  color: '#18181b',
                  fontWeight: '700'
                }}>
                  #{order.id}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  color: '#71717a',
                  fontSize: '0.9rem',
                  marginBottom: '0.25rem'
                }}>
                  Total Amount
                </div>
                <div style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '1.5rem',
                  color: '#22c55e',
                  fontWeight: '700'
                }}>
                  ${order.total_amount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                color: '#18181b',
                fontWeight: '600',
                marginBottom: '1rem',
                fontSize: '1.1rem'
              }}>
                Order Items
              </div>
              {order.order_lines.map((line, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: index < order.order_lines.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}
                >
                  <div>
                    <div style={{ color: '#18181b', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {line.product_name}
                    </div>
                    <div style={{ color: '#71717a', fontSize: '0.9rem' }}>
                      {line.plan_name} × {line.quantity}
                    </div>
                  </div>
                  <div style={{ color: '#18181b', fontWeight: '600' }}>
                    ${line.total_price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{
                  color: '#18181b',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Shipping Address
                </div>
                <div style={{
                  color: '#71717a',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line'
                }}>
                  {order.shipping_address}
                </div>
              </div>
            )}
          </div>
        )}

        {/* What's Next Section */}
        <div style={{
          background: '#eff6ff',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left',
          border: '1px solid #bfdbfe'
        }}>
          <h3 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '1.1rem',
            color: '#1e40af',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>ℹ️</span>
            <span>What's Next?</span>
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '1.5rem',
            color: '#1e40af',
            fontSize: '0.95rem',
            lineHeight: 1.8
          }}>
            <li>Your subscription is now active</li>
            <li>Check your email for order confirmation</li>
            <li>View your subscriptions and invoices in your dashboard</li>
            <li>Your next billing date has been automatically scheduled</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/shop/orders')}
            style={{
              background: '#18181b',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => e.target.style.background = '#27272a'}
            onMouseLeave={(e) => e.target.style.background = '#18181b'}
          >
            <span>📋</span>
            <span>View My Orders</span>
          </button>

          <button
            onClick={() => navigate('/shop/subscriptions')}
            style={{
              background: 'white',
              color: '#18181b',
              border: '2px solid #18181b',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#18181b';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#18181b';
            }}
          >
            <span>🔄</span>
            <span>View Subscriptions</span>
          </button>

          <button
            onClick={() => navigate('/shop/products')}
            style={{
              background: 'white',
              color: '#71717a',
              border: '1px solid #e5e7eb',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f4f4f5';
              e.target.style.color = '#18181b';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#71717a';
            }}
          >
            <span>🛍️</span>
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>

      {/* Add CSS animation */}
      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderSuccess;
