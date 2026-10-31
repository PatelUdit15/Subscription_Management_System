import { useState, useEffect } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
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
import PaymentsPage from './PaymentsPage'
import ReportsPage from './ReportsPage'
import Breadcrumbs from '../components/Breadcrumbs'
import ConfigurationDropdown from '../components/ConfigurationDropdown'
import './AdminHome.css'

const allModules = [
  { id: 1, name: 'Dashboard', roles: ['admin', 'internal', 'portal'] },
  { id: 2, name: 'Products', roles: ['admin', 'internal'] },
  { id: 3, name: 'Subscriptions', roles: ['admin', 'internal'] },
  { id: 4, name: 'Recurring Plans', roles: ['admin', 'internal'] },
  { id: 5, name: 'Quotation Templates', roles: ['admin', 'internal'] },
  { id: 6, name: 'Invoices', roles: ['admin', 'internal'] },
  { id: 7, name: 'Payments', roles: ['admin', 'internal'] },
  { id: 8, name: 'Discounts', roles: ['admin'] },
  { id: 9, name: 'Taxes', roles: ['admin'] },
  { id: 10, name: 'Attributes', roles: ['admin', 'internal'] },
  { id: 11, name: 'Users/Contacts', roles: ['admin'] },
  { id: 12, name: 'Reports', roles: ['admin', 'internal'] },
  { id: 13, name: 'Settings', roles: ['admin'] }
]

// Module content components
const moduleContent = {
  'Dashboard': {
    title: 'Dashboard',
    description: 'Overview of your subscription management system',
    content: 'View key metrics, active subscriptions, revenue, and recent activities.'
  },
  'Products': {
    title: 'Products',
    description: 'Manage your product catalog',
    content: 'Create, update, and manage products with pricing, variants, and recurring plans.'
  },
  'Subscriptions': {
    title: 'Subscriptions',
    description: 'Manage customer subscriptions',
    content: 'Track subscription lifecycle: Draft → Quotation → Confirmed → Active → Closed'
  },
  'Recurring Plans': {
    title: 'Recurring Plans',
    description: 'Configure billing cycles',
    content: 'Set up Daily, Weekly, Monthly, or Yearly recurring billing plans.'
  },
  'Quotation Templates': {
    title: 'Quotation Templates',
    description: 'Pre-configured quotation templates',
    content: 'Create reusable templates to speed up subscription creation process.'
  },
  'Invoices': {
    title: 'Invoices',
    description: 'Automated invoice generation',
    content: 'View and manage invoices generated from active subscriptions.'
  },
  'Payments': {
    title: 'Payments',
    description: 'Track payment records',
    content: 'Monitor paid and outstanding invoices, payment methods, and transaction history.'
  },
  'Discounts': {
    title: 'Discounts',
    description: 'Manage discount rules (Admin only)',
    content: 'Create fixed or percentage-based discounts for products and subscriptions.'
  },
  'Taxes': {
    title: 'Taxes',
    description: 'Tax configuration (Admin only)',
    content: 'Configure tax percentages and types for automatic calculation on invoices.'
  },
  'Attributes': {
    title: 'Attributes',
    description: 'Product attributes management',
    content: 'Define custom attributes for product variants and customization.'
  },
  'Users/Contacts': {
    title: 'Users/Contacts',
    description: 'User management (Admin only)',
    content: 'Manage internal users, portal users, and customer contacts.'
  },
  'Reports': {
    title: 'Reports',
    description: 'Analytics and reporting',
    content: 'View reports on active subscriptions, revenue, payments, and overdue invoices.'
  },
  'Settings': {
    title: 'Settings',
    description: 'Company configuration (Admin only)',
    content: 'Configure global company settings, branding, and preferences.'
  }
}


function AdminHome() {
  const navigate = useNavigate()
  const { currentUser, loading, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeModule, setActiveModule] = useState('Dashboard')

  // Redirect portal users immediately
  useEffect(() => {
    if (currentUser && currentUser.role === 'portal') {
      navigate('/portal')
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
      'Products': '/admin/products',
      'Subscriptions': '/admin/subscriptions',
      'Recurring Plans': '/admin/config/plans',
      'Quotation Templates': '/admin/config/templates',
      'Invoices': '/admin/invoices',
      'Payments': '/admin/payments',
      'Discounts': '/admin/config/discounts',
      'Taxes': '/admin/config/taxes',
      'Attributes': '/admin/config/attributes',
      'Users/Contacts': '/admin/customers',
      'Reports': '/admin/reports',
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

  // Don't render anything for portal users (they're being redirected)
  if (currentUser.role === 'portal') {
    return null
  }

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
          <h1 className="app-name">Subscription Management System</h1>
        </div>
        <div className="nav-center">
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Search modules, subscriptions, customers..."
          />
        </div>
        <div className="nav-right">
          <ConfigurationDropdown />
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">({currentUser.role})</span>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: '1rem',
                padding: '0.5rem 1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'Quicksand, sans-serif',
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
            <h2 className="sidebar-title">Applications</h2>
          </div>
          <nav className="module-list">
            {visibleModules.map(module => (
              <div 
                key={module.id}
                className={`module-item ${activeModule === module.name ? 'active' : ''}`}
                onClick={() => handleModuleClick(module.name)}
              >
                <span className="module-name">{module.name}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <Breadcrumbs />
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Products */}
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            
            {/* Customers */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            
            {/* Subscriptions */}
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/subscriptions/new" element={<SubscriptionFormPage />} />
            <Route path="/subscriptions/:id" element={<SubscriptionFormPage />} />
            
            {/* Invoices */}
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceFormPage />} />
            <Route path="/invoices/:id" element={<InvoiceFormPage />} />
            
            {/* Quotations */}
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/quotations/new" element={<QuotationFormPage />} />
            <Route path="/quotations/:id" element={<QuotationDetailPage />} />
            
            {/* Invoices */}
            <Route path="/invoices" element={<Invoices />} />
            
            {/* Payments */}
            <Route path="/payments" element={<PaymentsPage />} />
            
            {/* Reports */}
            <Route path="/reports" element={<ReportsPage />} />
            
            {/* Configuration Routes */}
            <Route path="/config/taxes" element={<TaxesPage />} />
            <Route path="/config/discounts" element={<DiscountsPage />} />
            <Route path="/config/attributes" element={<AttributesPage />} />
            <Route path="/config/plans" element={<RecurringPlansPage />} />
            <Route path="/config/templates" element={<QuotationTemplatesPage />} />
            <Route path="/config/templates/:id" element={<QuotationTemplateDetailPage />} />
            
            {/* Settings */}
            <Route path="/settings" element={<Settings />} />
            
            {/* Fallback */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AdminHome
