import { useState, useEffect } from 'react'
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Settings from './Settings'
import TaxesPage from './TaxesPage'
import DiscountsPage from './DiscountsPage'
import ProductsPage from './ProductsPage'
import ProductDetailPage from './ProductDetailPage'
import AttributesPage from './AttributesPage'
import RecurringPlansPage from './RecurringPlansPage'
import QuotationTemplatesPage from './QuotationTemplatesPage'
import QuotationTemplateDetailPage from './QuotationTemplateDetailPage'
import QuotationsPage from './QuotationsPage'
import QuotationFormPage from './QuotationFormPage'
import QuotationDetailPage from './QuotationDetailPage'
import SubscriptionsPage from './SubscriptionsPage'
import SubscriptionFormPage from './SubscriptionFormPage'
import Dashboard from './Dashboard'
import Invoices from './Invoices'
import InvoiceFormPage from './InvoiceFormPage'
import Customers from './Customers'
import CustomerDetail from './CustomerDetail'
import Users from './Users'
import PaymentsPage from './PaymentsPage'
import ReportsPage from './ReportsPage'
import Breadcrumbs from '../components/Breadcrumbs'
import ConfigurationDropdown from '../components/ConfigurationDropdown'
import './AdminHome.css'

// Module definition matching specifications from internal user.md
const allModules = [
  { id: 1, name: 'Dashboard', icon: '📊', roles: ['admin', 'internal'] },
  { id: 2, name: 'Quotations', icon: '📋', roles: ['admin', 'internal'] },
  { id: 3, name: 'Subscriptions', icon: '🔄', roles: ['admin', 'internal'] },
  { id: 4, name: 'Invoices', icon: '🧾', roles: ['admin', 'internal'] },
  { id: 5, name: 'Payments', icon: '💳', roles: ['admin', 'internal'] },
  { id: 6, name: 'Customers', icon: '👥', roles: ['admin', 'internal'] },
  { id: 7, name: 'Products', icon: '📦', roles: ['admin', 'internal'] },
  { id: 8, name: 'Recurring Plans', icon: '📅', roles: ['admin', 'internal'] },
  { id: 9, name: 'Quotation Templates', icon: '📄', roles: ['admin', 'internal'] },
  { id: 10, name: 'Reports', icon: '📈', roles: ['admin', 'internal'] },
  { id: 11, name: 'Discounts', icon: '🏷️', roles: ['admin'] },
  { id: 12, name: 'Taxes', icon: '💰', roles: ['admin'] },
  { id: 13, name: 'Attributes', icon: '⚙️', roles: ['admin'] },
  { id: 14, name: 'User Management', icon: '🛡️', roles: ['admin'] },
  { id: 15, name: 'Settings', icon: '🏢', roles: ['admin'] }
]

// Access Denied banner for internal users navigating directly to admin-only routes
const AccessDenied = ({ moduleName }) => (
  <div style={{
    padding: '3rem 2rem',
    maxWidth: '560px',
    margin: '3rem auto',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
    fontFamily: 'Quicksand, sans-serif',
    border: '1px solid #fee2e2'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔒</div>
    <h2 style={{ color: '#111827', fontFamily: 'Gabarito, sans-serif', margin: '0 0 0.5rem 0' }}>
      Admin Permission Required
    </h2>
    <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
      Access to <strong>{moduleName}</strong> is restricted to System Administrators by system specification.
      Internal Users have day-to-day operational access (subscriptions, quotations, invoices, payments, and reports).
    </p>
    <Link
      to="/admin/dashboard"
      style={{
        display: 'inline-block',
        padding: '0.75rem 1.5rem',
        background: '#047857',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '0.9rem'
      }}
    >
      ← Return to Operations Dashboard
    </Link>
  </div>
)

function AdminHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, loading, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeModule, setActiveModule] = useState('Dashboard')

  // Redirect portal users immediately to customer shop
  useEffect(() => {
    if (currentUser && currentUser.role === 'portal') {
      navigate('/shop')
    }
  }, [currentUser, navigate])

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'var(--font-body)'
      }}>
        Loading...
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  // Filter modules based on user role
  const visibleModules = allModules.filter(module => 
    module.roles.includes(currentUser.role)
  )

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleModuleClick = (moduleName) => {
    setActiveModule(moduleName)
    
    // Navigate to proper route
    const routeMap = {
      'Dashboard': '/admin/dashboard',
      'Quotations': '/admin/quotations',
      'Subscriptions': '/admin/subscriptions',
      'Invoices': '/admin/invoices',
      'Payments': '/admin/payments',
      'Customers': '/admin/customers',
      'Products': '/admin/products',
      'Recurring Plans': '/admin/config/plans',
      'Quotation Templates': '/admin/config/templates',
      'Reports': '/admin/reports',
      'Discounts': '/admin/config/discounts',
      'Taxes': '/admin/config/taxes',
      'Attributes': '/admin/config/attributes',
      'Users/Contacts': '/admin/users',
      'User Management': '/admin/users',
      'Settings': '/admin/settings'
    }
    
    const route = routeMap[moduleName]
    if (route) {
      navigate(route)
    }
    
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }
  }

  if (currentUser.role === 'portal') {
    return null
  }

  const isAdmin = currentUser.role === 'admin'
  const isInternal = currentUser.role === 'internal'

  return (
    <div className="admin-home">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-left">
          <button 
            className="menu-toggle" 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <span className="hamburger-icon">
              {isSidebarOpen ? '✕' : '☰'}
            </span>
          </button>
          <div>
            <h1 className="app-name" style={{ margin: 0, fontSize: '1.25rem' }}>
              Brightloop Subscriptions
            </h1>
            <span style={{
              fontSize: '0.72rem',
              color: isInternal ? '#047857' : '#875A7B',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {isInternal ? '💼 Operations & Billing Workspace' : '👑 System Administration Console'}
            </span>
          </div>
        </div>

        <div className="nav-center">
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Search quotations, subscriptions, invoices, customers..."
          />
        </div>

        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Configuration Dropdown - Only for Admins */}
          {isAdmin && <ConfigurationDropdown />}



          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="user-name" style={{ fontWeight: '600' }}>{currentUser.name}</span>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              background: isInternal ? '#ecfdf5' : '#f3e8ff',
              color: isInternal ? '#065f46' : '#6b21a8',
              border: `1px solid ${isInternal ? '#a7f3d0' : '#d8b4fe'}`
            }}>
              {isInternal ? 'Internal User (Limited Operations)' : 'Admin (Full Control)'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: '0.5rem',
                padding: '0.45rem 0.85rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.target.style.background = '#dc2626'}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Layout with Sidebar */}
      <div className="main-layout">
        {/* Sidebar Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={toggleSidebar}
          />
        )}

        {/* Left Sidebar */}
        <aside className={`left-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h2 className="sidebar-title">
              {isInternal ? 'Operations Modules' : 'Applications'}
            </h2>
          </div>
          <nav className="module-list">
            {visibleModules.map(module => (
              <div 
                key={module.id}
                className={`module-item ${activeModule === module.name ? 'active' : ''}`}
                onClick={() => handleModuleClick(module.name)}
              >
                <span style={{ marginRight: '0.5rem', fontSize: '1.05rem' }}>{module.icon}</span>
                <span className="module-name">{module.name}</span>
              </div>
            ))}
          </nav>

          {/* Operational Scope Banner in Sidebar */}
          {isInternal && (
            <div style={{
              margin: '1rem',
              padding: '0.85rem',
              borderRadius: '10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              fontSize: '0.78rem',
              color: '#166534',
              lineHeight: '1.4'
            }}>
              <div style={{ fontWeight: '700', marginBottom: '0.2rem' }}>
                Operational Access
              </div>
              Quotations, Subscriptions, Invoices, and Payments operations enabled.
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <Breadcrumbs />
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Products (Read-only catalog for internal users; full CRUD for admin) */}
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />

            {/* Customers */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />

            {/* Quotations */}
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/quotations/new" element={<QuotationFormPage />} />
            <Route path="/quotations/:id" element={<QuotationDetailPage />} />

            {/* Subscriptions */}
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/subscriptions/new" element={<SubscriptionFormPage />} />
            <Route path="/subscriptions/:id" element={<SubscriptionFormPage />} />
            
            {/* Invoices */}
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceFormPage />} />
            <Route path="/invoices/:id" element={<InvoiceFormPage />} />
            
            {/* Payments */}
            <Route path="/payments" element={<PaymentsPage />} />

            {/* Recurring Plans (Read-only for internal users; configurable by admin) */}
            <Route path="/config/plans" element={<RecurringPlansPage />} />
            
            {/* Quotation Templates */}
            <Route path="/config/templates" element={<QuotationTemplatesPage />} />
            <Route path="/config/templates/:id" element={<QuotationTemplateDetailPage />} />
            
            {/* Reports */}
            <Route path="/reports" element={<ReportsPage />} />

            {/* Admin-Only Route: User & Account Management */}
            <Route 
              path="/users" 
              element={isAdmin ? <Users /> : <AccessDenied moduleName="User & Account Management" />} 
            />

            {/* Admin-Only Route: Taxes */}
            <Route 
              path="/config/taxes" 
              element={isAdmin ? <TaxesPage /> : <AccessDenied moduleName="Tax Configuration" />} 
            />

            {/* Admin-Only Route: Discounts */}
            <Route 
              path="/config/discounts" 
              element={isAdmin ? <DiscountsPage /> : <AccessDenied moduleName="Discount Rules" />} 
            />

            {/* Admin-Only Route: Attributes */}
            <Route 
              path="/config/attributes" 
              element={isAdmin ? <AttributesPage /> : <AccessDenied moduleName="Product Attributes Configuration" />} 
            />

            {/* Admin-Only Route: Company Settings */}
            <Route 
              path="/settings" 
              element={isAdmin ? <Settings /> : <AccessDenied moduleName="Company Settings" />} 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AdminHome
