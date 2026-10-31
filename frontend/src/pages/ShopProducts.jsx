import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const ShopProducts = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddToCart = (product) => {
    axios.get(`/products/${product.id}/options`)
      .then(response => {
        const { recurring_plans } = response.data;
        
        if (recurring_plans.length === 0) {
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
          finalPrice: product.base_price * selectedPlan.duration_months,
          addedAt: new Date().toISOString()
        };

        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        existingCart.push(cartItem);
        localStorage.setItem('cart', JSON.stringify(existingCart));

        window.dispatchEvent(new Event('storage'));

        setToastMessage(`${product.name} added to cart!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      })
      .catch(error => {
        console.error('Error fetching product plans:', error);
        alert('Failed to add product to cart');
      });
  };

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.product_type).filter(Boolean))];

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.product_type === selectedCategory;
      
      let matchesPrice = true;
      if (priceRange === 'under50') matchesPrice = product.base_price < 50;
      else if (priceRange === '50to100') matchesPrice = product.base_price >= 50 && product.base_price <= 100;
      else if (priceRange === 'over100') matchesPrice = product.base_price > 100;
      
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.base_price - b.base_price;
      if (sortBy === 'price_high') return b.base_price - a.base_price;
      return a.name.localeCompare(b.name);
    });

  return (
    <div style={{
      fontFamily: 'Quicksand, sans-serif',
      background: '#F6F6F6',
      minHeight: 'calc(100vh - 200px)'
    }}>
      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '2rem',
          background: '#16a34a',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          fontFamily: 'Quicksand, sans-serif',
          fontWeight: '600',
          animation: 'slideIn 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content - no standalone nav, using CustomerLayout */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        display: 'flex',
        gap: '2rem'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '260px',
          flexShrink: 0
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #EADBE7',
            boxShadow: '0 2px 8px rgba(46, 46, 46, 0.05)',
            position: 'sticky',
            top: '100px'
          }}>
            {/* Category Filter */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                color: '#875A7B',
                fontSize: '1.1rem',
                fontWeight: '700',
                marginBottom: '1rem',
                fontFamily: 'Gabarito, sans-serif'
              }}>
                Category
              </h3>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    background: selectedCategory === category ? '#875A7B' : 'transparent',
                    color: selectedCategory === category ? 'white' : '#2E2E2E',
                    border: '1px solid #EADBE7',
                    borderRadius: '8px',
                    marginBottom: '0.4rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: selectedCategory === category ? '600' : '500',
                    fontFamily: 'Quicksand, sans-serif',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Price Range Filter */}
            <div>
              <h3 style={{
                color: '#875A7B',
                fontSize: '1.1rem',
                fontWeight: '700',
                marginBottom: '1rem',
                fontFamily: 'Gabarito, sans-serif'
              }}>
                Price Range
              </h3>
              {[
                { value: 'all', label: 'All Prices' },
                { value: 'under50', label: 'Under $50' },
                { value: '50to100', label: '$50 - $100' },
                { value: 'over100', label: 'Over $100' }
              ].map(range => (
                <button
                  key={range.value}
                  onClick={() => setPriceRange(range.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    background: priceRange === range.value ? '#875A7B' : 'transparent',
                    color: priceRange === range.value ? 'white' : '#2E2E2E',
                    border: '1px solid #EADBE7',
                    borderRadius: '8px',
                    marginBottom: '0.4rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: priceRange === range.value ? '600' : '500',
                    fontFamily: 'Quicksand, sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Area */}
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #EADBE7',
            boxShadow: '0 2px 8px rgba(46, 46, 46, 0.05)',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h1 style={{
                color: '#2E2E2E',
                fontSize: '1.6rem',
                fontWeight: '700',
                fontFamily: 'Gabarito, sans-serif',
                margin: 0
              }}>
                All Products
              </h1>
              <div style={{ color: '#6B6B6B', fontSize: '0.9rem', fontWeight: '500' }}>
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              {/* Search */}
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem 1rem',
                  background: '#F6F6F6',
                  color: '#2E2E2E',
                  border: '2px solid #EADBE7',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontFamily: 'Quicksand, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#875A7B'}
                onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
              />

              {/* Sort By */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#6B6B6B', fontSize: '0.9rem', fontWeight: '600' }}>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#F6F6F6',
                    color: '#2E2E2E',
                    border: '2px solid #EADBE7',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontFamily: 'Quicksand, sans-serif',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="name">Name</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              color: '#6B6B6B',
              padding: '3rem',
              fontSize: '1rem'
            }}>
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #EADBE7'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{
                color: '#2E2E2E',
                fontSize: '1.2rem',
                fontFamily: 'Gabarito, sans-serif',
                marginBottom: '0.5rem'
              }}>
                No products found
              </h3>
              <p style={{ color: '#6B6B6B' }}>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.5rem'
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
                    minHeight: '350px',
                    boxShadow: '0 2px 8px rgba(46, 46, 46, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(135, 90, 123, 0.15)';
                    e.currentTarget.style.borderColor = '#875A7B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(46, 46, 46, 0.05)';
                    e.currentTarget.style.borderColor = '#EADBE7';
                  }}
                >
                  {/* Product Image Placeholder */}
                  <div 
                    onClick={() => navigate(`/shop/product/${product.id}`)}
                    style={{
                      width: '100%',
                      height: '180px',
                      background: '#EADBE7',
                      borderRadius: '12px',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#875A7B',
                      fontSize: '3rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}>
                    📦
                  </div>

                  {/* Product Info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 
                      onClick={() => navigate(`/shop/product/${product.id}`)}
                      style={{
                        color: '#2E2E2E',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        fontFamily: 'Gabarito, sans-serif',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#875A7B'}
                      onMouseLeave={(e) => e.target.style.color = '#2E2E2E'}
                    >
                      {product.name}
                    </h3>

                    <p style={{
                      color: '#6B6B6B',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {product.description || 'No description available'}
                    </p>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '1rem',
                      borderTop: '1px solid #EADBE7',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        color: '#875A7B',
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        fontFamily: 'Gabarito, sans-serif'
                      }}>
                        ${product.base_price?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{
                        color: '#6B6B6B',
                        fontSize: '0.8rem',
                        background: '#EADBE7',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}>
                        {product.billing_type || 'One-time'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAddToCart(product);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: '#875A7B',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          fontFamily: 'Quicksand, sans-serif',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 2px 8px rgba(135, 90, 123, 0.25)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#A6789C';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#875A7B';
                        }}
                      >
                        <span>🛒</span>
                        <span>Add to Cart</span>
                      </button>
                      
                      <button
                        onClick={() => navigate(`/shop/product/${product.id}`)}
                        style={{
                          padding: '0.75rem',
                          background: 'transparent',
                          color: '#875A7B',
                          border: '2px solid #EADBE7',
                          borderRadius: '10px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#EADBE7';
                          e.target.style.borderColor = '#875A7B';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.borderColor = '#EADBE7';
                        }}
                        title="View Details"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
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

export default ShopProducts;
