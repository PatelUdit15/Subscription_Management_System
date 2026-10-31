import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ConfigurationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only show for admin users
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const configItems = [
    {
      section: 'Product Setup',
      items: [
        { label: 'Attributes', path: '/admin/config/attributes' },
        { label: 'Attribute Values', path: '/admin/config/attribute-values' }
      ]
    },
    {
      section: 'Sales Setup',
      items: [
        { label: 'Recurring Plans', path: '/admin/config/plans' },
        { label: 'Quotation Templates', path: '/admin/config/templates' }
      ]
    },
    {
      section: 'Finance Setup',
      items: [
        { label: 'Taxes', path: '/admin/config/taxes' },
        { label: 'Discounts', path: '/admin/config/discounts' },
        { label: 'Payment Terms', path: '/admin/config/payment-terms' }
      ]
    }
  ];

  const handleItemClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: isOpen ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontFamily: 'Quicksand, sans-serif',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.25)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.target.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
      >
        <span>⚙️ Configuration</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            minWidth: '280px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(135, 90, 123, 0.2)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideDown 0.2s ease',
            border: '1px solid rgba(135, 90, 123, 0.15)'
          }}
        >
          {configItems.map((section, sectionIndex) => (
            <div key={section.section}>
              {/* Section Header */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--color-bg-soft)',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--color-primary-dark)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'Gabarito, sans-serif'
                }}
              >
                {section.section}
              </div>

              {/* Section Items */}
              {section.items.map((item, itemIndex) => (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'white',
                    border: 'none',
                    borderBottom: itemIndex === section.items.length - 1 && sectionIndex !== configItems.length - 1
                      ? '1px solid var(--color-border)'
                      : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontFamily: 'Quicksand, sans-serif',
                    color: 'var(--color-text-primary)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--color-accent-light)';
                    e.target.style.color = 'var(--color-primary-dark)';
                    e.target.style.paddingLeft = '1.25rem';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.color = 'var(--color-text-primary)';
                    e.target.style.paddingLeft = '1rem';
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>▸</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ConfigurationDropdown;
