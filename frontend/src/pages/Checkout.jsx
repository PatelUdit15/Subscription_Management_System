import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import PaymentQRCode from '../components/PaymentQRCode';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [formData, setFormData] = useState({
    shippingAddress: '',
    billingAddress: '',
    sameAsShipping: true
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const cart = localStorage.getItem('cart');
      if (cart) {
        const items = JSON.parse(cart);
        if (items.length === 0) {
          navigate('/shop/cart');
        }
        setCartItems(items);
      } else {
        navigate('/shop/cart');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      navigate('/shop/cart');
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.finalPrice, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() - discount) * 0.10;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount + calculateTax();
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'SAVE20') {
      setDiscount(calculateSubtotal() * 0.20);
      setPromoApplied(true);
    } else {
      alert('Invalid promo code');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.shippingAddress.trim()) {
      alert('Please enter a shipping address');
      return;
    }

    const billingAddr = formData.sameAsShipping 
      ? formData.shippingAddress 
      : formData.billingAddress;

    if (!billingAddr.trim()) {
      alert('Please enter a billing address');
      return;
    }

    // Move to payment step
    setCurrentStep(2);
    setShowPaymentQR(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    // Clear cart
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Navigate to success page
    navigate(`/shop/order-success/${paymentData.order_id}`);
  };

  const handlePaymentCancel = () => {
    setShowPaymentQR(false);
    setCurrentStep(1);
  };

  // If showing payment QR, render that instead
  if (showPaymentQR) {
    const orderData = {
      cart: cartItems,
      shipping_address: formData.shippingAddress,
      billing_address: formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress
    };

    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 2rem',
        fontFamily: 'Quicksand, sans-serif'
      }}>
        {/* Progress Stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '3rem',
          padding: '2rem 0'
        }}>
          {[
            { number: 1, label: 'Cart' },
            { number: 2, label: 'Payment' },
            { number: 3, label: 'Done' }
          ].map((step, index, array) => (
            <React.Fragment key={step.number}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: currentStep >= step.number ? '#18181b' : '#e5e7eb',
                  color: currentStep >= step.number ? 'white' : '#71717a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease',
                  zIndex: 2
                }}>
                  {currentStep > step.number ? '✓' : step.number}
                </div>
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: currentStep === step.number ? '600' : '400',
                  color: currentStep >= step.number ? '#18181b' : '#71717a'
                }}>
                  {step.label}
                </div>
              </div>
              
              {index < array.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '3px',
                  background: currentStep > step.number ? '#18181b' : '#e5e7eb',
                  margin: '0 1rem',
                  marginBottom: '2rem',
                  transition: 'all 0.3s ease'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <PaymentQRCode
          amount={calculateTotal()}
          orderData={orderData}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
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
      {/* Progress Stepper */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '3rem',
        padding: '2rem 0'
      }}>
        {[
          { number: 1, label: 'Cart' },
          { number: 2, label: 'Payment' },
          { number: 3, label: 'Done' }
        ].map((step, index, array) => (
          <React.Fragment key={step.number}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: currentStep >= step.number ? '#18181b' : '#e5e7eb',
                color: currentStep >= step.number ? 'white' : '#71717a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease',
                zIndex: 2
              }}>
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: currentStep === step.number ? '600' : '400',
                color: currentStep >= step.number ? '#18181b' : '#71717a'
              }}>
                {step.label}
              </div>
            </div>
            
            {index < array.length - 1 && (
              <div style={{
                flex: 1,
                height: '3px',
                background: currentStep > step.number ? '#18181b' : '#e5e7eb',
                margin: '0 1rem',
                marginBottom: '2rem',
                transition: 'all 0.3s ease'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <h1 style={{
        fontFamily: 'Gabarito, sans-serif',
        fontSize: '2rem',
        color: '#18181b',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        Complete Your Order
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Checkout Form */}
        <form onSubmit={handleSubmit} style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '1.5rem',
            color: '#18181b',
            marginBottom: '1.5rem'
          }}>
            Shipping Information
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#18181b',
              fontWeight: '500'
            }}>
              Shipping Address *
            </label>
            <textarea
              name="shippingAddress"
              value={formData.shippingAddress}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Enter your full shipping address"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '0.95rem',
                fontFamily: 'Quicksand, sans-serif',
                resize: 'vertical',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#18181b'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <input
              type="checkbox"
              id="sameAsShipping"
              name="sameAsShipping"
              checked={formData.sameAsShipping}
              onChange={handleInputChange}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <label
              htmlFor="sameAsShipping"
              style={{
                color: '#18181b',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Billing address same as shipping
            </label>
          </div>

          {!formData.sameAsShipping && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#18181b',
                fontWeight: '500'
              }}>
                Billing Address *
              </label>
              <textarea
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                required={!formData.sameAsShipping}
                rows={4}
                placeholder="Enter your billing address"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.95rem',
                  fontFamily: 'Quicksand, sans-serif',
                  resize: 'vertical',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#18181b'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          )}

          {/* Promo Code Section */}
          <div style={{
            background: '#f9fafb',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '0.75rem',
              color: '#18181b'
            }}>
              Promo Code
            </label>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter code (try SAVE20)"
                disabled={promoApplied}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontFamily: 'Quicksand, sans-serif'
                }}
              />
              <button
                type="button"
                onClick={applyPromoCode}
                disabled={promoApplied}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: promoApplied ? '#10b981' : '#18181b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: promoApplied ? 'default' : 'pointer',
                  fontFamily: 'Quicksand, sans-serif'
                }}
              >
                {promoApplied ? '✓ Applied' : 'Apply'}
              </button>
            </div>
            
            {promoApplied && (
              <div style={{
                marginTop: '0.75rem',
                color: '#10b981',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                ✓ Code Applied! You saved ${discount.toFixed(2)}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#71717a' : '#18181b',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = '#27272a';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.background = '#18181b';
            }}
          >
            <span>Proceed to Payment</span>
            <span>🚀</span>
          </button>
        </form>

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

          {/* Cart Items */}
          <div style={{
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {cartItems.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#18181b', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {item.productName}
                  </div>
                  <div style={{ color: '#71717a', fontSize: '0.85rem' }}>
                    {item.planName} × {item.quantity}
                  </div>
                </div>
                <div style={{ color: '#18181b', fontWeight: '600' }}>
                  ${item.finalPrice.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
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
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#10b981' }}>Discount</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>
                  -${discount.toFixed(2)}
                </span>
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
};

export default Checkout;
