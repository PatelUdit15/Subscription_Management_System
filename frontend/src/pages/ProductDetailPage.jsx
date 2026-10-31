import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import './ProductDetailPage.css'

function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  
  // General info form
  const [formData, setFormData] = useState({
    name: '',
    type: 'storable',
    base_price: '',
    cost: '',
    description: ''
  })
  
  // Variant modal
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [attributes, setAttributes] = useState([])
  const [attributeValues, setAttributeValues] = useState([])
  const [selectedAttribute, setSelectedAttribute] = useState('')
  const [variantForm, setVariantForm] = useState({
    attribute_value_id: '',
    extra_price: '0'
  })
  const [variantErrors, setVariantErrors] = useState({})

  useEffect(() => {
    fetchProduct()
    fetchAttributes()
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await axiosInstance.get(`/api/products/${id}`)
      setProduct(response.data)
      setFormData({
        name: response.data.name,
        type: response.data.type,
        base_price: response.data.base_price.toString(),
        cost: response.data.cost.toString(),
        description: response.data.description || ''
      })
    } catch (error) {
      showToast('Failed to load product', 'error')
      navigate('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttributes = async () => {
    try {
      const response = await axiosInstance.get('/attributes')
      setAttributes(response.data)
    } catch (error) {
      console.error('Failed to load attributes', error)
    }
  }

  const fetchAttributeValues = async (attributeId) => {
    try {
      const response = await axiosInstance.get(`/api/attribute-values?attribute_id=${attributeId}`)
      setAttributeValues(response.data)
    } catch (error) {
      console.error('Failed to load attribute values', error)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    
    try {
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        cost: parseFloat(formData.cost)
      }

      await axiosInstance.put(`/api/products/${id}`, payload)
      showToast('Product updated successfully!')
      fetchProduct()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to update product', 'error')
    }
  }

  const handleAttributeChange = (attributeId) => {
    setSelectedAttribute(attributeId)
    setVariantForm({ ...variantForm, attribute_value_id: '' })
    if (attributeId) {
      fetchAttributeValues(attributeId)
    } else {
      setAttributeValues([])
    }
  }

  const validateVariantForm = () => {
    const errors = {}
    if (!variantForm.attribute_value_id) errors.attribute_value_id = 'Please select an attribute value'
    if (variantForm.extra_price === '') errors.extra_price = 'Extra price is required'
    setVariantErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddVariant = async (e) => {
    e.preventDefault()
    if (!validateVariantForm()) return

    try {
      const payload = {
        product_id: parseInt(id),
        attribute_value_id: parseInt(variantForm.attribute_value_id),
        extra_price: parseFloat(variantForm.extra_price)
      }

      await axiosInstance.post(`/api/products/${id}/variants`, payload)
      showToast('Variant added successfully!')
      fetchProduct()
      closeVariantModal()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to add variant', 'error')
    }
  }

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return

    try {
      await axiosInstance.delete(`/api/variants/${variantId}`)
      showToast('Variant deleted successfully!')
      fetchProduct()
    } catch (error) {
      showToast('Failed to delete variant', 'error')
    }
  }

  const openVariantModal = () => {
    setVariantForm({ attribute_value_id: '', extra_price: '0' })
    setSelectedAttribute('')
    setAttributeValues([])
    setVariantErrors({})
    setShowVariantModal(true)
  }

  const closeVariantModal = () => {
    setShowVariantModal(false)
    setVariantForm({ attribute_value_id: '', extra_price: '0' })
    setSelectedAttribute('')
    setAttributeValues([])
    setVariantErrors({})
  }

  if (loading) {
    return <div className="loading">Loading product...</div>
  }

  return (
    <div className="product-detail-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/admin/products')}>
            ← Back to Products
          </button>
          <h1 className="page-title">{product.name}</h1>
          <p className="page-subtitle">Product ID: #{product.id}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General Information
          </button>
          <button 
            className={`tab ${activeTab === 'variants' ? 'active' : ''}`}
            onClick={() => setActiveTab('variants')}
          >
            Variants ({product.variants?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'general' && (
          <div className="general-tab">
            <form onSubmit={handleUpdateProduct}>
              <div className="form-group">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
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
                  />
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
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="variants-tab">
            <div className="variants-header">
              <p className="variants-subtitle">
                Variants allow you to offer different versions of this product with attribute-based pricing
              </p>
              <button className="btn-primary" onClick={openVariantModal}>
                + Add Variant
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    <th>Value</th>
                    <th>Extra Price</th>
                    <th>Total Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No variants found. Add your first variant to get started.
                      </td>
                    </tr>
                  ) : (
                    product.variants?.map(variant => (
                      <tr key={variant.id}>
                        <td className="font-medium">{variant.attribute_name}</td>
                        <td>
                          <span className="badge badge-type">{variant.attribute_value}</span>
                        </td>
                        <td className="font-medium">
                          ${variant.extra_price.toFixed(2)}
                        </td>
                        <td className="font-medium total-price">
                          ${variant.total_price.toFixed(2)}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-icon btn-delete" 
                              onClick={() => handleDeleteVariant(variant.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Variant Modal */}
      {showVariantModal && (
        <div className="modal-overlay" onClick={closeVariantModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Product Variant</h2>
              <button className="modal-close" onClick={closeVariantModal}>✕</button>
            </div>

            <form onSubmit={handleAddVariant}>
              <div className="form-group">
                <label htmlFor="attribute">Select Attribute *</label>
                <select
                  id="attribute"
                  value={selectedAttribute}
                  onChange={e => handleAttributeChange(e.target.value)}
                  className={variantErrors.attribute_value_id ? 'error' : ''}
                >
                  <option value="">-- Choose Attribute --</option>
                  {attributes.map(attr => (
                    <option key={attr.id} value={attr.id}>{attr.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="attribute_value">Select Value *</label>
                <select
                  id="attribute_value"
                  value={variantForm.attribute_value_id}
                  onChange={e => setVariantForm({ ...variantForm, attribute_value_id: e.target.value })}
                  disabled={!selectedAttribute}
                  className={variantErrors.attribute_value_id ? 'error' : ''}
                >
                  <option value="">-- Choose Value --</option>
                  {attributeValues.map(val => (
                    <option key={val.id} value={val.id}>{val.value}</option>
                  ))}
                </select>
                {variantErrors.attribute_value_id && (
                  <span className="error-message">{variantErrors.attribute_value_id}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="extra_price">Extra Price *</label>
                <input
                  type="number"
                  id="extra_price"
                  step="0.01"
                  value={variantForm.extra_price}
                  onChange={e => setVariantForm({ ...variantForm, extra_price: e.target.value })}
                  placeholder="0.00"
                  className={variantErrors.extra_price ? 'error' : ''}
                />
                {variantErrors.extra_price && (
                  <span className="error-message">{variantErrors.extra_price}</span>
                )}
                <small className="form-hint">
                  Total price will be: ${(parseFloat(product.base_price) + parseFloat(variantForm.extra_price || 0)).toFixed(2)}
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeVariantModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
