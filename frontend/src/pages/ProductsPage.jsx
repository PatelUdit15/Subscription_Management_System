import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axios'
import './ProductsPage.css'

function ProductsPage() {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'
  const isInternal = currentUser?.role === 'internal'
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [viewMode, setViewMode] = useState('list') // 'list' or 'kanban'
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'storable',
    base_price: '',
    cost: '',
    description: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products')
      setProducts(response.data)
    } catch (error) {
      showToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.base_price || formData.base_price < 0) newErrors.base_price = 'Base price must be non-negative'
    if (!formData.cost || formData.cost < 0) newErrors.cost = 'Cost must be non-negative'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        cost: parseFloat(formData.cost)
      }

      const response = await axiosInstance.post('/products', payload)
      showToast('Product created successfully!')
      closeModal()
      fetchProducts()
      if (response?.data?.id) {
        navigate(`/admin/products/${response.data.id}`)
      }
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create product', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!isAdmin) {
      showToast('Only administrators can delete products', 'error')
      return
    }
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await axiosInstance.delete(`/products/${id}`)
      showToast('Product deleted successfully!')
      fetchProducts()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to delete product', 'error')
    }
  }

  const openModal = () => {
    if (!isAdmin) {
      showToast('Only administrators can create products', 'error')
      return
    }
    setFormData({ name: '', type: 'storable', base_price: '', cost: '', description: '' })
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ name: '', type: 'storable', base_price: '', cost: '', description: '' })
    setErrors({})
  }

  if (loading) {
    return <div className="loading">Loading products...</div>
  }

  return (
    <div className="products-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">
            {isInternal 
              ? 'Operational view of products and pricing for quotations and subscriptions (Admin-configured)' 
              : 'Manage products, pricing, and variants'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* View Switcher */}
          <div style={{
            display: 'flex',
            background: '#f4f4f5',
            padding: '0.25rem',
            borderRadius: '8px',
            gap: '0.25rem'
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'list' ? 'white' : 'transparent',
                color: viewMode === 'list' ? '#875A7B' : '#71717a',
                cursor: 'pointer',
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'kanban' ? 'white' : 'transparent',
                color: viewMode === 'kanban' ? '#875A7B' : '#71717a',
                cursor: 'pointer',
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🎴 Kanban
            </button>
          </div>

          {isAdmin ? (
            <button className="btn-primary" onClick={openModal}>
              + New Product
            </button>
          ) : (
            <span style={{
              padding: '0.55rem 1rem',
              background: '#ecfdf5',
              color: '#065f46',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: '1px solid #a7f3d0'
            }}>
              👁️ Read-Only Catalog
            </span>
          )}
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Type</th>
                <th>Base Price</th>
                <th>Cost</th>
                <th>Margin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const margin = product.base_price - product.cost
                  const marginPercent = product.cost > 0 ? ((margin / product.cost) * 100).toFixed(1) : 0
                  
                  return (
                    <tr key={product.id}>
                      <td className="font-medium">{product.name}</td>
                      <td>
                        <span className="badge badge-type">{product.type}</span>
                      </td>
                    <td className="font-medium">${product.base_price.toFixed(2)}</td>
                    <td>${product.cost.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${margin >= 0 ? 'badge-active' : 'badge-inactive'}`}>
                        ${margin.toFixed(2)} ({marginPercent}%)
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-edit" 
onClick={() => navigate(`/admin/products/${product.id}`)}
                          title={isAdmin ? 'View/Edit' : 'View Product Details'}
                        >
                          👁️
                        </button>
                        {isAdmin && (
                          <button 
                            className="btn-icon btn-delete" 
                            onClick={() => handleDelete(product.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          padding: '1rem 0'
        }}>
          {products.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem',
              color: '#71717a'
            }}>
              No products found.
            </div>
          ) : (
            products.map(product => {
              const margin = product.base_price - product.cost
              const marginPercent = product.cost > 0 ? ((margin / product.cost) * 100).toFixed(1) : 0
              
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/admin/products/${product.id}`)}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(135, 90, 123, 0.08)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(135, 90, 123, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(135, 90, 123, 0.08)';
                  }}
                >
                  <div style={{
                    height: '160px',
                    background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3.5rem'
                  }}>
                    📦
                  </div>
                  
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{
                      fontFamily: 'Gabarito, sans-serif',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#714B67',
                      marginBottom: '0.5rem'
                    }}>
                      {product.name}
                    </h3>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        background: '#f4f4f5',
                        color: '#52525b',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {product.type}
                      </span>
                    </div>
                    
                    <div style={{
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.82rem',
                        marginBottom: '0.25rem'
                      }}>
                        Base Price
                      </div>
                      <div style={{
                        fontFamily: 'Gabarito, sans-serif',
                        fontSize: '1.4rem',
                        fontWeight: '700'
                      }}>
                        ${product.base_price.toFixed(2)}
                      </div>
                    </div>
                    
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f4f4f5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      color: '#71717a'
                    }}>
                      <span>Cost: ${product.cost.toFixed(2)}</span>
                      <span style={{
                        color: margin >= 0 ? '#22c55e' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        {marginPercent}% margin
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Product</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Subscription, Consulting Service"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="type">Product Type *</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="storable">Storable (Physical Product)</option>
                  <option value="service">Service</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="base_price">Base Price *</label>
                  <input
                    type="number"
                    id="base_price"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={e => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="99.99"
                    className={errors.base_price ? 'error' : ''}
                  />
                  {errors.base_price && <span className="error-message">{errors.base_price}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="cost">Cost *</label>
                  <input
                    type="number"
                    id="cost"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="49.99"
                    className={errors.cost ? 'error' : ''}
                  />
                  {errors.cost && <span className="error-message">{errors.cost}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
