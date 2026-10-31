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
    updatedCart[index].quantity = newQuantity;
    updatedCart[index].finalPrice = (updatedCart[index].finalPrice / updatedCart[index].quantity) * newQuantity;
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.finalPrice, 0);
  };

  const calculateTax = () => {
    // Simple 10% tax calculation (you can enhance this with Module 2 tax rules)
    return calculateSubtotal() * 0.10;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
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
                <p style={{
                  color: '#71717a',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}>
                  Plan: {item.planName}
                </p>
                <p style={{
                  color: '#18181b',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  ${item.finalPrice.toFixed(2)}
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
              <span style={{ color: '#18181b', fontWeight: '600' }}>
                ${calculateSubtotal().toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Tax (10%)</span>
              <span style={{ color: '#18181b', fontWeight: '600' }}>
                ${calculateTax().toFixed(2)}
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
              color: '#18181b',
              fontWeight: '700'
            }}>
              Total
            </span>
            <span style={{
              fontFamily: 'Gabarito, sans-serif',
              color: '#18181b',
              fontWeight: '700'
            }}>
              ${calculateTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => navigate('/shop/checkout')}
            style={{
              width: '100%',
              background: '#18181b',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '0.75rem'
            }}
            onMouseEnter={(e) => e.target.style.background = '#27272a'}
            onMouseLeave={(e) => e.target.style.background = '#18181b'}
          >
            Proceed to Checkout
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
