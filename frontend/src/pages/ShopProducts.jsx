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

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  const handleQuickAddToCart = (product) => {
    // For quick add, use default plan (first one, preferably monthly)
    // and no variants, quantity 1
    
    // We need to fetch the product's plans first
    axios.get(`/products/${product.id}/options`)
      .then(response => {
        const { recurring_plans } = response.data;
        
        if (recurring_plans.length === 0) {
          alert('This product has no billing plans available');
          return;
        }
        
        // Select monthly plan if available, otherwise first plan
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

        // Get existing cart
        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        existingCart.push(cartItem);
        localStorage.setItem('cart', JSON.stringify(existingCart));

        // Update cart count
        window.dispatchEvent(new Event('storage'));

        // Show toast
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
      background: '#1a1a1a',
      minHeight: '100vh'
    }}>
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
          animation: 'slideIn 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

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
            cursor: 'pointer',
            textDecoration: 'underline'
          }}>
            Shop
          </button>

          <button onClick={() => navigate('/shop/dashboard')} style={{
            background: 'transparent',
            color: '#d97706',
            border: 'none',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            My Account
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
            background: 'transparent',
            color: '#d97706',
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
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 100px)' }}>
        {/* Sidebar */}
        <div style={{
          width: '250px',
          background: '#2a2a2a',
          border: '2px solid #d97706',
          borderTop: 'none',
          padding: '2rem 1.5rem'
        }}>
          {/* Category Filter */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              color: '#d97706',
              fontSize: '1.2rem',
              fontWeight: '600',
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
                  padding: '0.75rem 1rem',
                  background: selectedCategory === category ? '#d97706' : 'transparent',
                  color: selectedCategory === category ? '#1a1a1a' : '#d97706',
                  border: '1px solid #d97706',
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 style={{
              color: '#d97706',
              fontSize: '1.2rem',
              fontWeight: '600',
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
                  padding: '0.75rem 1rem',
                  background: priceRange === range.value ? '#d97706' : 'transparent',
                  color: priceRange === range.value ? '#1a1a1a' : '#d97706',
                  border: '1px solid #d97706',
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Area */}
        <div style={{ flex: 1, padding: '2rem' }}>
          {/* Header */}
          <div style={{
            background: '#2a2a2a',
            border: '2px solid #d97706',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h1 style={{
                color: '#d97706',
                fontSize: '1.8rem',
                fontWeight: '700',
                fontFamily: 'Gabarito, sans-serif'
              }}>
                All Products
              </h1>
              <div style={{ color: '#d97706', fontSize: '0.9rem' }}>
                Product Type
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {/* Search */}
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: '#1a1a1a',
                  color: '#d97706',
                  border: '2px solid #d97706',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />

              {/* Sort By */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#d97706', fontSize: '0.95rem' }}>Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#1a1a1a',
                    color: '#d97706',
                    border: '2px solid #d97706',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
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
              color: '#d97706',
              padding: '3rem',
              fontSize: '1.2rem'
            }}>
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#d97706',
              padding: '3rem',
              fontSize: '1.2rem'
            }}>
              No products found
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    background: '#2a2a2a',
                    border: '2px solid #d97706',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '350px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(217, 119, 6, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Product Image Placeholder */}
                  <div 
                    onClick={() => navigate(`/shop/product/${product.id}`)}
                    style={{
                      width: '100%',
                      height: '180px',
                      background: '#1a1a1a',
                      border: '2px solid #d97706',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#d97706',
                      fontSize: '3rem',
                      cursor: 'pointer'
                    }}>
                    📦
                  </div>

                  {/* Product Info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 
                      onClick={() => navigate(`/shop/product/${product.id}`)}
                      style={{
                        color: '#d97706',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        fontFamily: 'Gabarito, sans-serif',
                        cursor: 'pointer'
                      }}>
                      {product.name}
                    </h3>

                    <p style={{
                      color: '#d97706',
                      fontSize: '0.85rem',
                      opacity: 0.8,
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
                      borderTop: '1px solid #d97706',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        color: '#d97706',
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        fontFamily: 'Gabarito, sans-serif'
                      }}>
                        ${product.base_price?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{
                        color: '#d97706',
                        fontSize: '0.8rem',
                        opacity: 0.7
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
                          background: '#d97706',
                          color: '#1a1a1a',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#b45309';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#d97706';
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
                          color: '#d97706',
                          border: '2px solid #d97706',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#d97706';
                          e.target.style.color = '#1a1a1a';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#d97706';
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
