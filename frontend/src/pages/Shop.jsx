import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const Shop = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: [0, 1000]
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/shop/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (filters.type !== 'all' && product.type !== filters.type) {
      return false;
    }
    if (product.base_price < filters.priceRange[0] || product.base_price > filters.priceRange[1]) {
      return false;
    }
    return true;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'Quicksand, sans-serif'
      }}>
        Loading products...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: '2rem'
    }}>
      {/* Left Sidebar - Filters */}
      <aside style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 29, 57, 0.08)',
        height: 'fit-content',
        position: 'sticky',
        top: '100px'
      }}>
        <h2 style={{
          fontFamily: 'Gabarito, sans-serif',
          fontSize: '1.25rem',
          color: '#001D39',
          marginBottom: '1.5rem'
        }}>
          Filters
        </h2>

        {/* Category Filter */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '1rem',
            color: '#001D39',
            marginBottom: '1rem'
          }}>
            Category
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {['all', 'service', 'storable'].map(type => (
              <label key={type} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.95rem',
                color: '#49769F'
              }}>
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={filters.type === type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ textTransform: 'capitalize' }}>
                  {type === 'all' ? 'All Products' : type === 'service' ? 'Services' : 'Physical Products'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <h3 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '1rem',
            color: '#001D39',
            marginBottom: '1rem'
          }}>
            Price Range
          </h3>
          <div style={{
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '0.9rem',
            color: '#49769F',
            marginBottom: '0.75rem'
          }}>
            {formatCurrency(filters.priceRange[0])} - {formatCurrency(filters.priceRange[1])}
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={filters.priceRange[1]}
            onChange={(e) => setFilters({
              ...filters,
              priceRange: [0, parseInt(e.target.value)]
            })}
            style={{
              width: '100%',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Reset Filters */}
        <button
          onClick={() => setFilters({ type: 'all', priceRange: [0, 1000] })}
          style={{
            marginTop: '2rem',
            width: '100%',
            padding: '0.75rem',
            background: '#BDD8E9',
            color: '#001D39',
            border: 'none',
            borderRadius: '12px',
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#7BBDE8';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#BDD8E9';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Reset Filters
        </button>
      </aside>

      {/* Product Grid */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '2rem',
            color: '#001D39'
          }}>
            Products
          </h1>
          <div style={{
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '0.95rem',
            color: '#49769F'
          }}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 29, 57, 0.08)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p style={{
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '1.1rem',
              color: '#49769F'
            }}>
              No products found matching your filters
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 29, 57, 0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 29, 57, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 29, 57, 0.08)';
                }}
              >
                {/* Product Image Placeholder */}
                <div style={{
                  height: '200px',
                  background: 'linear-gradient(135deg, #BDD8E9 0%, #7BBDE8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem'
                }}>
                  {product.type === 'service' ? '⚙️' : '📦'}
                </div>

                {/* Product Info */}
                <div style={{ padding: '1.5rem' }}>
                  {/* Product Type Badge */}
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: product.type === 'service' ? '#e0f2fe' : '#f0fdf4',
                    color: product.type === 'service' ? '#0369a1' : '#15803d',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'Quicksand, sans-serif',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    textTransform: 'capitalize'
                  }}>
                    {product.type}
                  </div>

                  <h3 style={{
                    fontFamily: 'Gabarito, sans-serif',
                    fontSize: '1.25rem',
                    color: '#001D39',
                    marginBottom: '0.5rem',
                    minHeight: '2.5rem'
                  }}>
                    {product.name}
                  </h3>

                  {product.description && (
                    <p style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.9rem',
                      color: '#49769F',
                      marginBottom: '1rem',
                      minHeight: '2.7rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {product.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1rem'
                  }}>
                    <div style={{
                      fontFamily: 'Gabarito, sans-serif',
                      fontSize: '1.5rem',
                      color: '#0A4174',
                      fontWeight: '700'
                    }}>
                      {formatCurrency(product.base_price)}
                    </div>

                    <button
                      onClick={() => navigate(`/shop/product/${product.id}`)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#0A4174',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#001D39';
                        e.target.style.transform = 'scale(0.98)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#0A4174';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      View Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
