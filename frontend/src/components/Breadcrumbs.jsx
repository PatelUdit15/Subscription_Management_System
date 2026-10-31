import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumbs = () => {
  const location = useLocation();
  
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Don't show breadcrumbs on home/root
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'admin')) {
    return null;
  }
  
  const formatBreadcrumb = (str) => {
    // Convert kebab-case and snake_case to Title Case
    return str
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const getBreadcrumbPath = (index) => {
    return '/' + pathnames.slice(0, index + 1).join('/');
  };
  
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 0',
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '0.9rem'
    }}>
      <Link
        to="/admin"
        style={{
          color: 'var(--color-text-secondary)',
          textDecoration: 'none',
          transition: 'color 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
      >
        Home
      </Link>
      
      {pathnames.map((name, index) => {
        const isLast = index === pathnames.length - 1;
        const to = getBreadcrumbPath(index);
        
        // Skip 'admin' in breadcrumbs
        if (name === 'admin') return null;
        
        // Check if it's a numeric ID (detail page)
        const isNumeric = /^\d+$/.test(name);
        const displayName = isNumeric ? `#${name}` : formatBreadcrumb(name);
        
        return (
          <React.Fragment key={to}>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            {isLast ? (
              <span style={{
                color: 'var(--color-primary-dark)',
                fontWeight: '700'
              }}>
                {displayName}
              </span>
            ) : (
              <Link
                to={to}
                style={{
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
