import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const CustomerHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [addingProductId, setAddingProductId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Scroll to shop section if hash is present
  useEffect(() => {
    if (location.hash === '#shop-catalog') {
      const el = document.getElementById('shop-catalog');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
      }
    }
  }, [location]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddToCart = async (product) => {
    try {
      setAddingProductId(product.id);
      const response = await axios.get(`/products/${product.id}/options`);
      const { recurring_plans } = response.data;

      if (!recurring_plans || recurring_plans.length === 0) {
        alert('This product has no billing plans available');
        return;
      }

      const monthlyPlan = recurring_plans.find(p => p.billing_period === 'month');
      const selectedPlan = monthlyPlan || recurring_plans[0];

      const cartItem = {
        productId: product.id,
        productName: product.name,
        variantIds: [],
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        quantity: 1,
        unitPrice: product.base_price,
        subtotal: product.base_price,
        taxAmount: Math.round(product.base_price * 0.18 * 100) / 100,
        finalPrice: Math.round(product.base_price * 1.18 * 100) / 100,
        addedAt: new Date().toISOString()
      };

      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(existingCart));

      // Notify layout and other listeners of cart update
      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('storage'));

      setToastMessage(`✓ ${product.name} added to cart!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error adding product to cart:', error);
      alert('Failed to add product to cart');
    } finally {
      setAddingProductId(null);
    }
  };

  // All categories configuration
  const allCategoryDefinitions = [
    { id: 'all', label: 'All Products', icon: '✨' },
    { id: 'subscription', label: 'Subscriptions', icon: '🔄' },
    { id: 'streaming', label: 'Streaming & Video', icon: '🎬' },
    { id: 'music', label: 'Music & Audio', icon: '🎵' },
    { id: 'service', label: 'Digital Services', icon: '⚡' },
    { id: 'software', label: 'Software & Cloud', icon: '💻' },
    { id: 'storable', label: 'Physical & Storable', icon: '📦' },
    { id: 'consulting', label: 'Consulting', icon: '🎯' }
  ];

  const dynamicCategories = [...new Set(products.map(p => p.product_type || p.type).filter(Boolean))];
  const categories = [
    ...allCategoryDefinitions,
    ...dynamicCategories
      .filter(c => !allCategoryDefinitions.some(def => def.id === c))
      .map(c => ({ id: c, label: String(c).charAt(0).toUpperCase() + String(c).slice(1), icon: '🏷️' }))
  ];

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const prodType = (product.product_type || product.type || '').toLowerCase();
      const prodName = (product.name || '').toLowerCase();
      const prodDesc = (product.description || '').toLowerCase();
      const matchesSearch = prodName.includes(searchTerm.toLowerCase()) ||
                            prodDesc.includes(searchTerm.toLowerCase());

      let matchesCategory = true;
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'streaming') {
          matchesCategory = prodName.includes('netflix') || prodName.includes('stream') || prodName.includes('amazon') || prodName.includes('youtube') || prodDesc.includes('stream') || prodDesc.includes('video');
        } else if (selectedCategory === 'music') {
          matchesCategory = prodName.includes('spotify') || prodName.includes('music') || prodName.includes('audio') || prodDesc.includes('music') || prodDesc.includes('audio');
        } else if (selectedCategory === 'subscription') {
          matchesCategory = prodType === 'service' || prodName.includes('subscription') || !!product.billing_period || prodName.includes('netflix') || prodName.includes('spotify') || prodName.includes('amazon') || prodName.includes('youtube');
        } else if (selectedCategory === 'service') {
          matchesCategory = prodType === 'service';
        } else if (selectedCategory === 'storable') {
          matchesCategory = prodType === 'storable';
        } else if (selectedCategory === 'software') {
          matchesCategory = prodType === 'software' || prodName.includes('software') || prodName.includes('cloud') || prodName.includes('suite');
        } else if (selectedCategory === 'consulting') {
          matchesCategory = prodType === 'consulting' || prodName.includes('consult');
        } else {
          matchesCategory = prodType === selectedCategory.toLowerCase() || prodName.includes(selectedCategory.toLowerCase());
        }
      }

      let matchesPrice = true;
      if (priceRange === 'under500') matchesPrice = product.base_price < 500;
      else if (priceRange === '500to1000') matchesPrice = product.base_price >= 500 && product.base_price <= 1000;
      else if (priceRange === 'over1000') matchesPrice = product.base_price > 1000;

      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.base_price - b.base_price;
      if (sortBy === 'price_high') return b.base_price - a.base_price;
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <div style={{
      fontFamily: 'Quicksand, sans-serif',
      background: '#F6F6F6',
      minHeight: '100vh',
      paddingBottom: '4rem'
    }}>
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
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideIn 0.3s ease'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🛒</span>
          <span>{toastMessage}</span>
          <button
            onClick={() => navigate('/shop/cart')}
            style={{
              marginLeft: '0.5rem',
              padding: '0.35rem 0.75rem',
              background: 'white',
              color: '#875A7B',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            View Cart
          </button>
        </div>
      )}

      {/* Hero Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #875A7B 0%, #A6789C 50%, #EADBE7 100%)',
        padding: '3.5rem 2rem 3rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background shapes */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '0.4rem 1.25rem',
            borderRadius: '999px',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '1.25rem'
          }}>
            <span>✨</span> Customer Portal & Store
          </div>

          <h1 style={{
            fontSize: '3.5rem',
            fontFamily: 'Gabarito, sans-serif',
            color: '#FFFFFF',
            fontWeight: '700',
            marginBottom: '1rem',
            letterSpacing: '-0.5px'
          }}>
            Welcome Back{currentUser?.name ? `, ${currentUser.name}` : ''}!
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.92)',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Discover our full shop catalog, manage your subscriptions, and track orders effortlessly all in one place.
          </p>
        </div>
      </div>

      {/* Integrated Shop Section */}
      <section id="shop-catalog" style={{ maxWidth: '1280px', margin: '2rem auto 0', padding: '0 2rem' }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{
              display: 'inline-block',
              color: '#875A7B',
              fontWeight: '700',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.25rem'
            }}>
              Available Products & Plans
            </div>
            <h2 style={{
              color: '#2E2E2E',
              fontSize: '2.2rem',
              fontWeight: '700',
              fontFamily: 'Gabarito, sans-serif',
              margin: 0
            }}>
              Explore Our Shop
            </h2>
          </div>
          <div style={{ color: '#6B6B6B', fontSize: '0.95rem', fontWeight: '600' }}>
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filter & Search Bar Card (shown when products are available) */}
        {products.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #EADBE7',
            boxShadow: '0 2px 10px rgba(46, 46, 46, 0.04)',
            marginBottom: '2rem'
          }}>
            {/* Top row: Search and Sort */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: categories.length > 1 ? '1.25rem' : '0'
            }}>
              {/* Search Input */}
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#875A7B',
                  fontSize: '1rem'
                }}>
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search products by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem 0.85rem 2.75rem',
                    background: '#F6F6F6',
                    color: '#2E2E2E',
                    border: '2px solid #EADBE7',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontFamily: 'Quicksand, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                  onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6B6B6B',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Price Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#6B6B6B', fontSize: '0.9rem', fontWeight: '600' }}>Price:</span>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#F6F6F6',
                    color: '#2E2E2E',
                    border: '2px solid #EADBE7',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontFamily: 'Quicksand, sans-serif',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: '500'
                  }}
                >
                  <option value="all">All Prices</option>
                  <option value="under500">Under ₹500</option>
                  <option value="500to1000">₹500 - ₹1,000</option>
                  <option value="over1000">Over ₹1,000</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#6B6B6B', fontSize: '0.9rem', fontWeight: '600' }}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#F6F6F6',
                    color: '#2E2E2E',
                    border: '2px solid #EADBE7',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontFamily: 'Quicksand, sans-serif',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: '500'
                  }}
                >
                  <option value="name">Product Name</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Bottom row: Category filter tabs - scroll hidden, wrapped cleanly */}
            {categories.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                paddingTop: '0.75rem',
                borderTop: '1px solid #F6F6F6',
                alignItems: 'center',
                overflow: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                <span style={{ color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '600', marginRight: '0.25rem' }}>
                  Categories:
                </span>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '0.5rem 1.1rem',
                      background: selectedCategory === cat.id ? '#875A7B' : '#F6F6F6',
                      color: selectedCategory === cat.id ? 'white' : '#6B6B6B',
                      border: '1px solid',
                      borderColor: selectedCategory === cat.id ? '#875A7B' : '#EADBE7',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      fontFamily: 'Quicksand, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: selectedCategory === cat.id ? '0 2px 8px rgba(135, 90, 123, 0.25)' : 'none'
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product Cards Grid */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            color: '#875A7B',
            padding: '4rem',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #EADBE7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '2.5rem' }}>⏳</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Loading products...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #EADBE7',
            boxShadow: '0 2px 8px rgba(46, 46, 46, 0.05)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
            <h3 style={{
              color: '#2E2E2E',
              fontSize: '1.4rem',
              fontFamily: 'Gabarito, sans-serif',
              marginBottom: '0.5rem'
            }}>
              {products.length === 0 ? 'No products available yet' : 'No products found'}
            </h3>
            <p style={{ color: '#6B6B6B', marginBottom: products.length > 0 ? '1.5rem' : '0', maxWidth: '400px', margin: '0 auto' }}>
              {products.length === 0
                ? 'Check back soon! Products and subscription plans will be listed here once created.'
                : "We couldn't find any products matching your filters or search term."}
            </p>
            {products.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setPriceRange('all');
                }}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#875A7B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.75rem'
          }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                style={{
                  background: 'white',
                  border: '1px solid #EADBE7',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 'auto',
                  boxShadow: '0 2px 8px rgba(46, 46, 46, 0.04)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(135, 90, 123, 0.15)';
                  e.currentTarget.style.borderColor = '#875A7B';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(46, 46, 46, 0.04)';
                  e.currentTarget.style.borderColor = '#EADBE7';
                }}
              >
                {/* Product Image / Visual Placeholder */}
                <div
                  onClick={() => navigate(`/shop/product/${product.id}`)}
                  style={{
                    width: '100%',
                    height: '180px',
                    background: 'linear-gradient(135deg, #F6F6F6 0%, #EADBE7 100%)',
                    borderRadius: '12px',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#875A7B',
                    fontSize: '3.5rem',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <span>📦</span>
                  {(product.product_type || product.type) && (
                    <span style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      background: 'rgba(255,255,255,0.92)',
                      color: '#875A7B',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {product.product_type || product.type}
                    </span>
                  )}
                </div>

                {/* Product Information */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3
                    onClick={() => navigate(`/shop/product/${product.id}`)}
                    style={{
                      color: '#2E2E2E',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      marginBottom: '0.75rem',
                      fontFamily: 'Gabarito, sans-serif',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                      lineHeight: 1.3
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#875A7B'}
                    onMouseLeave={(e) => e.target.style.color = '#2E2E2E'}
                  >
                    {product.name}
                  </h3>

                  {/* Pricing and Billing Badge */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid #EADBE7',
                    marginBottom: '1.25rem'
                  }}>
                    <div>
                      <div style={{
                        color: '#875A7B',
                        fontSize: '1.45rem',
                        fontWeight: '700',
                        fontFamily: 'Gabarito, sans-serif'
                      }}>
                        ₹{Number(product.base_price || 0).toFixed(2)}
                      </div>
                      {product.billing_period && (
                        <span style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>
                          per {product.billing_period}
                        </span>
                      )}
                    </div>

                    {(product.billing_type || product.type) && (
                      <div style={{
                        color: '#875A7B',
                        fontSize: '0.8rem',
                        background: '#EADBE7',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '8px',
                        fontWeight: '700',
                        textTransform: 'capitalize'
                      }}>
                        {product.billing_type || product.type}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAddToCart(product);
                      }}
                      disabled={addingProductId === product.id}
                      style={{
                        flex: 1,
                        padding: '0.8rem',
                        background: '#875A7B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        fontFamily: 'Quicksand, sans-serif',
                        cursor: addingProductId === product.id ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(135, 90, 123, 0.25)',
                        opacity: addingProductId === product.id ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (addingProductId !== product.id) e.target.style.background = '#A6789C';
                      }}
                      onMouseLeave={(e) => {
                        if (addingProductId !== product.id) e.target.style.background = '#875A7B';
                      }}
                    >
                      <span>🛒</span>
                      <span>{addingProductId === product.id ? 'Adding...' : 'Add to Cart'}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/shop/product/${product.id}`)}
                      style={{
                        padding: '0.8rem 1rem',
                        background: 'transparent',
                        color: '#875A7B',
                        border: '2px solid #EADBE7',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        fontFamily: 'Quicksand, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#875A7B';
                        e.target.style.background = '#F6F6F6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#EADBE7';
                        e.target.style.background = 'transparent';
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerHome;
