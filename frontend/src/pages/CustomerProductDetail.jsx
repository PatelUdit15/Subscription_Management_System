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
      const response = await axios.get(`/products/${id}/options`);
      setProductData(response.data);
      
      // Auto-select first variant for each attribute
      if (response.data.variants && response.data.variants.length > 0) {
        const initialVars = {};
        response.data.variants.forEach(v => {
          if (!initialVars[v.attribute_name]) {
            initialVars[v.attribute_name] = v.id;
          }
        });
        setSelectedVariants(initialVars);
      }

      // Set default plan (first one, preferably monthly)
      if (response.data.recurring_plans && response.data.recurring_plans.length > 0) {
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
    if (!productData || !productData.variants) return {};
    
    const grouped = {};
    productData.variants.forEach(variant => {
      if (!grouped[variant.attribute_name]) {
        grouped[variant.attribute_name] = [];
      }
      grouped[variant.attribute_name].push(variant);
    });
    return grouped;
  }, [productData]);

  // Base unit price including variants
  const unitPrice = useMemo(() => {
    if (!productData) return 0;
    let base = productData.product.base_price;
    Object.values(selectedVariants).forEach(variantId => {
      const variant = productData.variants?.find(v => v.id === variantId);
      if (variant) {
        base += variant.extra_price;
      }
    });
    return base;
  }, [productData, selectedVariants]);

  // Subtotal before tax
  const subtotalPrice = useMemo(() => {
    return unitPrice * quantity;
  }, [unitPrice, quantity]);

  // Tax calculation (18% GST)
  const taxAmount = useMemo(() => {
    return Math.round(subtotalPrice * 0.18 * 100) / 100;
  }, [subtotalPrice]);

  // Total price
  const totalPrice = useMemo(() => {
    return Math.round((subtotalPrice + taxAmount) * 100) / 100;
  }, [subtotalPrice, taxAmount]);

  const handleAddToCart = () => {
    const selectedVariantObjects = Object.values(selectedVariants)
      .map(vid => productData.variants?.find(v => v.id === vid))
      .filter(Boolean);

    const cartItem = {
      productId: parseInt(id),
      productName: productData.product.name,
      variantIds: Object.values(selectedVariants),
      variants: selectedVariantObjects,
      planId: selectedPlan?.id,
      planName: selectedPlan?.name,
      quantity,
      unitPrice,
      subtotal: subtotalPrice,
      taxAmount,
      finalPrice: totalPrice,
      addedAt: new Date().toISOString()
    };

    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    existingCart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(existingCart));

    // Update cart count in navbar
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new Event('storage'));

    // Show toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          top: '90px',
          right: '2rem',
          background: '#875A7B',
          color: 'white',
          padding: '1rem 1.75rem',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(135, 90, 123, 0.35)',
          zIndex: 9999,
          fontFamily: 'Quicksand, sans-serif',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideIn 0.3s ease'
        }}>
          <span>🛒</span>
          <span>✓ {product.name} added to cart!</span>
          <button
            onClick={() => navigate('/shop/cart')}
            style={{
              marginLeft: '0.5rem',
              padding: '0.35rem 0.75rem',
              background: 'white',
              color: '#875A7B',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            View Cart →
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{
        marginBottom: '2rem',
        fontFamily: 'Quicksand, sans-serif',
        fontSize: '0.95rem',
        color: '#6B6B6B'
      }}>
        <span onClick={() => navigate('/shop')} style={{ cursor: 'pointer', color: '#875A7B', fontWeight: '600' }}>Home</span>
        {' / '}
        <span onClick={() => navigate('/shop/products')} style={{ cursor: 'pointer', color: '#875A7B', fontWeight: '600' }}>Shop</span>
        {' / '}
        <span style={{ color: '#2E2E2E', fontWeight: '700' }}>{product.name}</span>
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
                fontWeight: '700',
                color: '#2E2E2E',
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
                      background: selectedPlan?.id === plan.id ? '#875A7B' : 'white',
                      color: selectedPlan?.id === plan.id ? 'white' : '#2E2E2E',
                      border: `2px solid ${selectedPlan?.id === plan.id ? '#875A7B' : '#EADBE7'}`,
                      borderRadius: '10px',
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.95rem',
                      fontWeight: selectedPlan?.id === plan.id ? '700' : '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      boxShadow: selectedPlan?.id === plan.id ? '0 4px 12px rgba(135, 90, 123, 0.25)' : 'none'
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
            <div style={{
              marginBottom: '2rem',
              background: '#F6F6F6',
              padding: '1.5rem',
              borderRadius: '16px',
              border: '1px solid #EADBE7'
            }}>
              <h3 style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#2E2E2E',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>✨</span> Choose Variant & Options
              </h3>
              {Object.entries(variantsByAttribute).map(([attributeName, variants]) => (
                <div key={attributeName} style={{ marginBottom: '1.25rem' }}>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: '#875A7B',
                    marginBottom: '0.6rem'
                  }}>
                    {attributeName}
                  </label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    {variants.map(variant => {
                      const isSelected = selectedVariants[attributeName] === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariants({
                            ...selectedVariants,
                            [attributeName]: variant.id
                          })}
                          style={{
                            padding: '0.7rem 1.25rem',
                            background: isSelected ? '#875A7B' : 'white',
                            color: isSelected ? 'white' : '#2E2E2E',
                            border: `2px solid ${isSelected ? '#875A7B' : '#EADBE7'}`,
                            borderRadius: '12px',
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.95rem',
                            fontWeight: isSelected ? '700' : '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            boxShadow: isSelected ? '0 4px 12px rgba(135, 90, 123, 0.25)' : 'none'
                          }}
                        >
                          <span style={{ fontSize: '0.9rem' }}>{isSelected ? '✓' : '○'}</span>
                          <span>{variant.value_name}</span>
                          {variant.extra_price > 0 ? (
                            <span style={{
                              background: isSelected ? 'rgba(255,255,255,0.25)' : '#EADBE7',
                              color: isSelected ? 'white' : '#875A7B',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '700'
                            }}>
                              +₹{variant.extra_price.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{
                              background: isSelected ? 'rgba(255,255,255,0.2)' : '#F6F6F6',
                              color: isSelected ? 'white' : '#71717a',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              Included
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
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
              fontWeight: '700',
              color: '#2E2E2E',
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
                border: '2px solid #EADBE7',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontFamily: 'Quicksand, sans-serif',
                outline: 'none',
                fontWeight: '600'
              }}
              onFocus={(e) => e.target.style.borderColor = '#875A7B'}
              onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
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
            border: '1px solid #EADBE7',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 16px rgba(135, 90, 123, 0.08)'
          }}>
            <h3 style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#2E2E2E',
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
                <span style={{ fontWeight: '600', color: '#2E2E2E' }}>{formatCurrency(product.base_price)}</span>
              </div>

              {Object.entries(selectedVariants).map(([attrName, variantId]) => {
                const variant = productData.variants.find(v => v.id === variantId);
                if (!variant) return null;
                return (
                  <div key={attrName} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.95rem',
                    color: '#875A7B'
                  }}>
                    <span>{attrName}: <strong>{variant.value_name}</strong></span>
                    <span>{variant.extra_price > 0 ? `+${formatCurrency(variant.extra_price)}` : 'Included'}</span>
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
                  <span style={{ fontWeight: '600' }}>{selectedPlan.name}</span>
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
                  <span style={{ fontWeight: '600' }}>×{quantity}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                borderTop: '1px dashed #EADBE7',
                marginBottom: '0.5rem',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.95rem',
                color: '#52525b'
              }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: '600', color: '#2E2E2E' }}>{formatCurrency(subtotalPrice)}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.95rem',
                color: '#1e40af'
              }}>
                <span>Estimated Tax (18% GST):</span>
                <span style={{ fontWeight: '600' }}>+{formatCurrency(taxAmount)}</span>
              </div>
            </div>

            {/* Total Price */}
            <div style={{
              borderTop: '2px solid #EADBE7',
              paddingTop: '1.25rem',
              marginBottom: '1.75rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#2E2E2E'
                }}>
                  Total:
                </span>
                <span style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#875A7B'
                }}>
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <div style={{
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.8rem',
                color: '#71717a',
                textAlign: 'right',
                marginTop: '0.35rem'
              }}>
                Inclusive of 18% GST tax
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedPlan}
              style={{
                width: '100%',
                padding: '1rem',
                background: selectedPlan ? '#875A7B' : '#d4d4d8',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '700',
                fontFamily: 'Quicksand, sans-serif',
                cursor: selectedPlan ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                marginBottom: '0.85rem',
                boxShadow: selectedPlan ? '0 4px 14px rgba(135, 90, 123, 0.35)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedPlan) e.target.style.background = '#A6789C';
              }}
              onMouseLeave={(e) => {
                if (selectedPlan) e.target.style.background = '#875A7B';
              }}
            >
              🛒 Add to Cart
            </button>

            <button
              onClick={() => navigate('/shop/products')}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: '#F6F6F6',
                color: '#2E2E2E',
                border: '1px solid #EADBE7',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                fontFamily: 'Quicksand, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#875A7B';
                e.target.style.color = '#875A7B';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#EADBE7';
                e.target.style.color = '#2E2E2E';
              }}
            >
              ← Back to Shop
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
