import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const scrollToProducts = () => {
    const productsSection = document.getElementById('featured-categories');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const categories = [
    {
      id: 1,
      title: 'Software Services',
      description: 'Cloud-based solutions and SaaS products for your business',
      icon: '💻',
      color: '#3b82f6'
    },
    {
      id: 2,
      title: 'Physical Goods',
      description: 'Quality products delivered to your doorstep',
      icon: '📦',
      color: '#10b981'
    },
    {
      id: 3,
      title: 'Professional Consulting',
      description: 'Expert guidance and strategic planning services',
      icon: '🎯',
      color: '#f59e0b'
    },
    {
      id: 4,
      title: 'Subscription Plans',
      description: 'Flexible recurring plans tailored to your needs',
      icon: '🔄',
      color: '#8b5cf6'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
        padding: '6rem 2rem',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '3.5rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            lineHeight: 1.2
          }}>
            Streamline Your Business with SubscriptionFlow
          </h1>
          <p style={{
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '1.25rem',
            marginBottom: '2.5rem',
            color: '#d4d4d8',
            lineHeight: 1.6
          }}>
            Discover powerful subscription management solutions designed to grow your business. 
            From software services to physical products, we've got you covered.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={scrollToProducts}
              style={{
                padding: '1rem 2.5rem',
                background: 'white',
                color: '#18181b',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                fontFamily: 'Quicksand, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              Shop Now
            </button>
            <button
              onClick={() => navigate('/shop/products')}
              style={{
                padding: '1rem 2.5rem',
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                fontFamily: 'Quicksand, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#18181b';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              Browse Products
            </button>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section id="featured-categories" style={{
        padding: '5rem 2rem',
        background: '#fafafa'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#18181b',
              marginBottom: '1rem'
            }}>
              Featured Categories
            </h2>
            <p style={{
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '1.1rem',
              color: '#71717a',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Explore our diverse range of products and services tailored to meet your business needs
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => navigate('/shop/products')}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = category.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '1.5rem'
                }}>
                  {category.icon}
                </div>
                <h3 style={{
                  fontFamily: 'Gabarito, sans-serif',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#18181b',
                  marginBottom: '0.75rem'
                }}>
                  {category.title}
                </h3>
                <p style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.95rem',
                  color: '#71717a',
                  lineHeight: 1.6
                }}>
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '5rem 2rem',
        background: 'white',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#18181b',
            marginBottom: '1rem'
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '1.1rem',
            color: '#71717a',
            marginBottom: '2rem',
            lineHeight: 1.6
          }}>
            Join thousands of businesses already using SubscriptionFlow to manage their subscriptions efficiently
          </p>
          <button
            onClick={() => navigate('/shop/products')}
            style={{
              padding: '1rem 2.5rem',
              background: '#18181b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              fontFamily: 'Quicksand, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#27272a';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#18181b';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            View All Products
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
