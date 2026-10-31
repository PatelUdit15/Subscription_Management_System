import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const CustomerProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchProductOptions();
  }, [id]);

  const fetchProductOptions = async () => {
    try {
      const response = await axios.get(`/api/products/${id}/options`);
      setProductData(response.data);
      
      // Set default plan (first one, preferably monthly)
      if (response.data.recurring_plans.length > 0) {
        const monthlyPlan = response.data.recurring_plans.find(p => p.billing_period === 'month');
        setSelectedPlan(monthlyPlan || response.data.recurring_plans[0]);
      }
    } catch (error) {
      console.error('Failed to fetch product options:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group variants by attribute
  const variantsByAttribute = useMemo(() => {
    if (!productData) return {};
    
    const grouped = {};
    productData.variants.forEach(variant => {
      if (!grouped[variant.attribute_name]) {
        grouped[variant.attribute_name] = [];
      }
      grouped[variant.attribute_name].push(variant);
    });
    return grouped;
  }, [productData]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!productData || !selectedPlan) return 0;
    
    let basePrice = productData.product.base_price;
    
    // Add extra prices from selected variants
    Object.values(selectedVariants).forEach(variantId => {
      const variant = productData.variants.find(v => v.id === variantId);
      if (variant) {
        basePrice += variant.extra_price;
      }
    });
    
    // Multiply by duration and quantity
    return basePrice * selectedPlan.duration_months * quantity;
  }, [productData, selectedVariants, selectedPlan, quantity]);

  const handleAddToCart = () => {
    const cartItem = {
      productId: parseInt(id),
      productName: productData.product.name,
      variantIds: Object.values(selectedVariants),
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      quantity,
      finalPrice: totalPrice,
      addedAt: new Date().toISOString()
    };

    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    existingCart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(existingCart));

    // Update cart count in navbar (trigger storage event)
    window.dispatchEvent(new Event('storage'));

    // Show toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
        {/* Skeleton Loader */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div>
            <div style={{
              height: '400px',
              background: '#f4f4f5',
              borderRadius: '12px',
              marginBottom: '2rem',
              animation: 'pulse 2s infinite'
            }} />
            <div style={{
              height: '30px',
              background: '#f4f4f5',
              borderRadius: '6px',
              marginBottom: '1rem',
              animation: 'pulse 2s infinite'
            }} />
            <div style={{
              height: '60px',
              background: '#f4f4f5',
              borderRadius: '6px',
              animation: 'pulse 2s infinite'
            }} />
          </div>
          <div>
            <div style={{
              height: '300px',
              background: '#f4f4f5',
              borderRadius: '12px',
              animation: 'pulse 2s infinite'
            }} />
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontFamily: 'Gabarito, sans-serif',
          fontSize: '2rem',
          color: '#18181b',
          marginBottom: '1rem'
        }}>
          Product not found
        </h2>
        <button
          onClick={() => navigate('/shop/products')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#18181b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const { product, recurring_plans } = productData;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '2rem',
          background: '#10b981',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          fontFamily: 'Quicksand, sans-serif',
          fontWeight: '600',
          animation: 'slideIn 0.3s ease'
        }}>
          ✓ Added to cart successfully!
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{
        marginBottom: '2rem',
        fontFamily: 'Quicksand, sans-serif',
        fontSize: '0.9rem',
        color: '#71717a'
      }}>
        <span onClick={() => navigate('/shop')} style={{ cursor: 'pointer' }}>Home</span>
        {' / '}
        <span onClick={() => navigate('/shop/products')} style={{ cursor: 'pointer' }}>Shop</span>
        {' / '}
        <span style={{ color: '#18181b' }}>{product.name}</span>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '3rem',
        alignItems: 'start'
      }}>
        {/* Left Column - Product Info */}
        <div>
          {/* Product Image */}
          <div style={{
            height: '400px',
            background: 'linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8rem',
            marginBottom: '2rem',
            border: '1px solid #e5e7eb'
          }}>
            {product.type === 'service' ? '⚙️' : '📦'}
          </div>

          {/* Product Header */}
          <h1 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#18181b',
            marginBottom: '1rem'
          }}>
            {product.name}
          </h1>

          {/* Product Description */}
          {product.description && (
            <p style={{
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '1.1rem',
              color: '#52525b',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}>
              {product.description}
            </p>
          )}

          {/* Billing Toggle */}
          {recurring_plans.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#18181b',
                marginBottom: '0.75rem'
              }}>
                Billing Cycle
              </label>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {recurring_plans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: selectedPlan?.id === plan.id ? '#18181b' : 'white',
                      color: selectedPlan?.id === plan.id ? 'white' : '#18181b',
                      border: `2px solid ${selectedPlan?.id === plan.id ? '#18181b' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {plan.name}
                    {plan.billing_period === 'year' && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#10b981',
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}>
                        Save 20%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variant Selection */}
          {Object.keys(variantsByAttribute).length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#18181b',
                marginBottom: '1rem'
              }}>
                Customize Your Selection
              </h3>
              {Object.entries(variantsByAttribute).map(([attributeName, variants]) => (
                <div key={attributeName} style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#18181b',
                    marginBottom: '0.5rem'
                  }}>
                    {attributeName}
                  </label>
                  <select
                    value={selectedVariants[attributeName] || ''}
                    onChange={(e) => setSelectedVariants({
                      ...selectedVariants,
                      [attributeName]: parseInt(e.target.value)
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontFamily: 'Quicksand, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#18181b'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="">Select {attributeName}</option>
                    {variants.map(variant => (
                      <option key={variant.id} value={variant.id}>
                        {variant.value_name} 
                        {variant.extra_price > 0 && ` (+${formatCurrency(variant.extra_price)})`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#18181b',
              marginBottom: '0.5rem'
            }}>
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: '120px',
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontFamily: 'Quicksand, sans-serif',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#18181b'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        {/* Right Column - Live Total Card (Sticky) */}
        <div style={{
          position: 'sticky',
          top: '100px'
        }}>
          <div style={{
            background: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <h3 style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#18181b',
              marginBottom: '1.5rem'
            }}>
              Order Summary
            </h3>

            {/* Price Breakdown */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.95rem',
                color: '#52525b'
              }}>
                <span>Base Price:</span>
                <span>{formatCurrency(product.base_price)}</span>
              </div>

              {Object.entries(selectedVariants).map(([attrName, variantId]) => {
                const variant = productData.variants.find(v => v.id === variantId);
                if (!variant || variant.extra_price === 0) return null;
                return (
                  <div key={attrName} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.95rem',
                    color: '#52525b'
                  }}>
                    <span>{attrName}: {variant.value_name}</span>
                    <span>+{formatCurrency(variant.extra_price)}</span>
                  </div>
                );
              })}

              {selectedPlan && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.95rem',
                  color: '#52525b'
                }}>
                  <span>Billing Cycle:</span>
                  <span>{selectedPlan.name}</span>
                </div>
              )}

              {quantity > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.95rem',
                  color: '#52525b'
                }}>
                  <span>Quantity:</span>
                  <span>×{quantity}</span>
                </div>
              )}
            </div>

            {/* Total Price */}
            <div style={{
              borderTop: '2px solid #e5e7eb',
              paddingTop: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#18181b'
                }}>
                  Total:
                </span>
                <span style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#18181b'
                }}>
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              {selectedPlan && selectedPlan.duration_months > 1 && (
                <div style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.85rem',
                  color: '#71717a',
                  textAlign: 'right',
                  marginTop: '0.5rem'
                }}>
                  for {selectedPlan.duration_months} month{selectedPlan.duration_months > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedPlan}
              style={{
                width: '100%',
                padding: '1rem',
                background: selectedPlan ? '#18181b' : '#d4d4d8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                fontFamily: 'Quicksand, sans-serif',
                cursor: selectedPlan ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
              onMouseEnter={(e) => {
                if (selectedPlan) e.target.style.background = '#27272a';
              }}
              onMouseLeave={(e) => {
                if (selectedPlan) e.target.style.background = '#18181b';
              }}
            >
              Add to Cart
            </button>

            <button
              onClick={() => navigate('/shop/products')}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'white',
                color: '#18181b',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: 'Quicksand, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.borderColor = '#18181b'}
              onMouseLeave={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerProductDetail;
