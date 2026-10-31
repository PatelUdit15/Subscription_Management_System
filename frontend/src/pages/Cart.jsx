import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const cart = localStorage.getItem('cart');
      if (cart) {
        setCartItems(JSON.parse(cart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedCart = [...cartItems];
    const item = updatedCart[index];
    const prevQty = item.quantity || 1;
    const unitPrice = item.unitPrice || (item.subtotal ? item.subtotal / prevQty : item.finalPrice / prevQty);
    item.quantity = newQuantity;
    item.unitPrice = unitPrice;
    item.subtotal = Math.round(unitPrice * newQuantity * 100) / 100;
    item.taxAmount = Math.round(item.subtotal * 0.18 * 100) / 100;
    item.finalPrice = Math.round((item.subtotal + item.taxAmount) * 100) / 100;
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.subtotal ?? (item.unitPrice ? item.unitPrice * (item.quantity || 1) : item.finalPrice);
      return sum + price;
    }, 0);
  };

  const calculateTax = () => {
    // 18% GST tax calculation
    return Math.round(calculateSubtotal() * 0.18 * 100) / 100;
  };

  const calculateTotal = () => {
    return Math.round((calculateSubtotal() + calculateTax()) * 100) / 100;
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 2rem',
        fontFamily: 'Quicksand, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#71717a' }}>Loading cart...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 2rem',
        fontFamily: 'Quicksand, sans-serif',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '4rem 2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '1.75rem',
            color: '#18181b',
            marginBottom: '1rem'
          }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: '#71717a', marginBottom: '2rem' }}>
            Start shopping to add items to your cart
          </p>
          <button
            onClick={() => navigate('/shop/products')}
            style={{
              background: '#875A7B',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#A6789C'}
            onMouseLeave={(e) => e.target.style.background = '#875A7B'}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

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
          Shopping Cart
        </h1>
        <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'center'
              }}
            >
              {/* Product Image Placeholder */}
              <div style={{
                width: '100px',
                height: '100px',
                background: '#f4f4f5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                flexShrink: 0
              }}>
                📦
              </div>

              {/* Product Details */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '1.1rem',
                  color: '#18181b',
                  marginBottom: '0.5rem'
                }}>
                  {item.productName}
                </h3>
                {item.variants && item.variants.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    marginBottom: '0.4rem'
                  }}>
                    {item.variants.map((v, i) => (
                      <span key={i} style={{
                        background: '#EADBE7',
                        color: '#875A7B',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {v.attribute_name}: {v.value_name}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{
                  color: '#71717a',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}>
                  Plan: {item.planName}
                </p>
                <p style={{
                  color: '#875A7B',
                  fontSize: '1.15rem',
                  fontWeight: '700'
                }}>
                  ₹{(item.subtotal ?? (item.unitPrice ? item.unitPrice * (item.quantity || 1) : item.finalPrice)).toFixed(2)}
                  {item.quantity > 1 && (
                    <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: '500', marginLeft: '0.5rem' }}>
                      (₹{(item.unitPrice || (item.subtotal / item.quantity)).toFixed(2)} each)
                    </span>
                  )}
                </p>
              </div>

              {/* Quantity Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexShrink: 0
              }}>
                <button
                  onClick={() => updateQuantity(index, item.quantity - 1)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f4f4f5'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  −
                </button>
                <span style={{
                  minWidth: '30px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#18181b'
                }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(index, item.quantity + 1)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f4f4f5'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  +
                </button>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  padding: '0.5rem',
                  transition: 'opacity 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
                title="Remove item"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: '100px'
        }}>
          <h2 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '1.25rem',
            color: '#18181b',
            marginBottom: '1.5rem'
          }}>
            Order Summary
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Subtotal</span>
              <span style={{ color: '#2E2E2E', fontWeight: '600' }}>
                ₹{calculateSubtotal().toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Estimated Tax (18% GST)</span>
              <span style={{ color: '#1e40af', fontWeight: '600' }}>
                +₹{calculateTax().toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            fontSize: '1.25rem'
          }}>
            <span style={{
              fontFamily: 'Gabarito, sans-serif',
              color: '#2E2E2E',
              fontWeight: '700'
            }}>
              Total
            </span>
            <span style={{
              fontFamily: 'Gabarito, sans-serif',
              color: '#875A7B',
              fontWeight: '700',
              fontSize: '1.5rem'
            }}>
              ₹{calculateTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => navigate('/shop/checkout')}
            style={{
              width: '100%',
              background: '#875A7B',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 12px rgba(135, 90, 123, 0.25)'
            }}
            onMouseEnter={(e) => e.target.style.background = '#A6789C'}
            onMouseLeave={(e) => e.target.style.background = '#875A7B'}
          >
            Proceed to Checkout →
          </button>

          <button
            onClick={() => navigate('/shop/products')}
            style={{
              width: '100%',
              background: 'white',
              color: '#18181b',
              border: '1px solid #e5e7eb',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f4f4f5'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
