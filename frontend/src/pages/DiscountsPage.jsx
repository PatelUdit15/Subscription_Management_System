import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import './DiscountsPage.css'

function DiscountsPage() {
  const [discounts, setDiscounts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: '',
    min_purchase_amount: '0',
    min_quantity: '0',
    usage_limit: '',
    apply_to: 'all',
    product_id: '',
    start_date: '',
    end_date: '',
    is_active: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchDiscounts()
    fetchProducts()
  }, [])

  const fetchDiscounts = async () => {
    try {
      const response = await axiosInstance.get('/discounts')
      setDiscounts(response.data)
    } catch (error) {
      showToast('Failed to load discounts', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to load products for discounts:', error)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (formData.value === '' || formData.value < 0) newErrors.value = 'Value must be non-negative'
    if (formData.type === 'percentage' && formData.value > 100) {
      newErrors.value = 'Percentage discount cannot exceed 100%'
    }
    if (!formData.start_date) newErrors.start_date = 'Start date is required'
    if (!formData.end_date) newErrors.end_date = 'End date is required'
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date must be after start date'
    }
    if (formData.apply_to === 'product' && !formData.product_id) {
      newErrors.product_id = 'Please select a specific product'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        value: parseFloat(formData.value) || 0,
        min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
        min_quantity: parseInt(formData.min_quantity) || 0,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        apply_to: formData.apply_to,
        product_id: formData.apply_to === 'product' && formData.product_id ? parseInt(formData.product_id) : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: !!formData.is_active
      }

      if (editingDiscount) {
        await axiosInstance.put(`/discounts/${editingDiscount.id}`, payload)
        showToast('Discount updated successfully!')
      } else {
        await axiosInstance.post('/discounts', payload)
        showToast('Discount created successfully!')
      }

      fetchDiscounts()
      closeModal()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to save discount', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) return

    try {
      await axiosInstance.delete(`/discounts/${id}`)
      showToast('Discount deleted successfully!')
      fetchDiscounts()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to delete discount', 'error')
    }
  }

  const handleToggleStatus = async (discount) => {
    try {
      await axiosInstance.put(`/discounts/${discount.id}`, {
        ...discount,
        is_active: !discount.is_active
      })
      showToast(`Discount ${!discount.is_active ? 'activated' : 'deactivated'} successfully!`)
      fetchDiscounts()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to update discount status', 'error')
    }
  }

  const openModal = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount)
      setFormData({
        name: discount.name,
        type: discount.type,
        value: discount.value.toString(),
        min_purchase_amount: (discount.min_purchase_amount || 0).toString(),
        min_quantity: (discount.min_quantity || 0).toString(),
        usage_limit: discount.usage_limit !== null && discount.usage_limit !== undefined ? discount.usage_limit.toString() : '',
        apply_to: discount.apply_to || 'all',
        product_id: discount.product_id ? discount.product_id.toString() : '',
        start_date: discount.start_date || '',
        end_date: discount.end_date || '',
        is_active: discount.is_active
      })
    } else {
      setEditingDiscount(null)
      setFormData({
        name: '',
        type: 'percentage',
        value: '',
        min_purchase_amount: '0',
        min_quantity: '0',
        usage_limit: '',
        apply_to: 'all',
        product_id: '',
        start_date: '',
        end_date: '',
        is_active: true
      })
    }
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDiscount(null)
    setErrors({})
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return <div className="loading">Loading discounts...</div>
  }

  return (
    <div className="discounts-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Discount Management</h1>
          <p className="page-subtitle">Configure fixed/percentage rules, minimum seat/purchase thresholds, and usage limits</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          + New Discount Rule
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Applies To</th>
              <th>Thresholds</th>
              <th>Usage Limit</th>
              <th>Valid Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  No discounts found. Create your first discount rule to get started.
                </td>
              </tr>
            ) : (
              discounts.map(discount => {
                const targetProduct = products.find(p => p.id === discount.product_id)
                const isExhausted = discount.usage_limit && discount.times_used >= discount.usage_limit

                return (
                  <tr key={discount.id}>
                    <td className="font-medium">{discount.name}</td>
                    <td>
                      <span className="badge badge-type">{discount.type}</span>
                    </td>
                    <td className="font-medium">
                      {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                    </td>
                    <td>
                      {discount.apply_to === 'product' ? (
                        <span style={{ fontSize: '0.85rem', color: '#0369a1' }}>
                          📦 {targetProduct ? targetProduct.name : `Product #${discount.product_id}`}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#6d28d9' }}>
                          📑 All Subscriptions
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {discount.min_quantity > 0 && <div>≥ {discount.min_quantity} seats/qty</div>}
                      {discount.min_purchase_amount > 0 && <div>≥ ₹{discount.min_purchase_amount}</div>}
                      {(!discount.min_quantity && !discount.min_purchase_amount) && <span style={{ color: '#a1a1aa' }}>None</span>}
                    </td>
                    <td>
                      {discount.usage_limit ? (
                        <span style={{ color: isExhausted ? '#dc2626' : '#15803d', fontWeight: '600', fontSize: '0.85rem' }}>
                          {discount.times_used || 0} / {discount.usage_limit} used
                          {isExhausted && ' (Exhausted)'}
                        </span>
                      ) : (
                        <span style={{ color: '#71717a', fontSize: '0.85rem' }}>Unlimited ({discount.times_used || 0} used)</span>
                      )}
                    </td>
                    <td className="date-range" style={{ fontSize: '0.85rem' }}>
                      {formatDate(discount.start_date)} - {formatDate(discount.end_date)}
                    </td>
                    <td>
                      <span className={`badge ${discount.is_active && !isExhausted ? 'badge-active' : 'badge-inactive'}`}>
                        {discount.is_active && !isExhausted ? 'Active' : isExhausted ? 'Exhausted' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-edit" 
                          onClick={() => openModal(discount)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon btn-toggle" 
                          onClick={() => handleToggleStatus(discount)}
                          title={discount.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {discount.is_active ? '⏸️' : '▶️'}
                        </button>
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => handleDelete(discount.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingDiscount ? 'Edit Discount Rule' : 'New Discount Rule'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Rule Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Volume Discount (5+ seats), Early Bird 10%"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Discount Type *</label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="value">Discount Value *</label>
                  <input
                    type="number"
                    id="value"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
                    className={errors.value ? 'error' : ''}
                  />
                  {errors.value && <span className="error-message">{errors.value}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="apply_to">Applies To *</label>
                  <select
                    id="apply_to"
                    value={formData.apply_to}
                    onChange={e => setFormData({ ...formData, apply_to: e.target.value })}
                  >
                    <option value="all">Whole Subscriptions</option>
                    <option value="product">Specific Product Only</option>
                  </select>
                </div>

                {formData.apply_to === 'product' && (
                  <div className="form-group">
                    <label htmlFor="product_id">Select Product *</label>
                    <select
                      id="product_id"
                      value={formData.product_id}
                      onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                      className={errors.product_id ? 'error' : ''}
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {errors.product_id && <span className="error-message">{errors.product_id}</span>}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="min_quantity">Minimum Seats / Quantity</label>
                  <input
                    type="number"
                    id="min_quantity"
                    min="0"
                    value={formData.min_quantity}
                    onChange={e => setFormData({ ...formData, min_quantity: e.target.value })}
                    placeholder="0 (no min seats required)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="min_purchase_amount">Minimum Purchase Amount (₹)</label>
                  <input
                    type="number"
                    id="min_purchase_amount"
                    step="0.01"
                    min="0"
                    value={formData.min_purchase_amount}
                    onChange={e => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                    placeholder="0 (no min amount)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="usage_limit">Usage Limit (Times)</label>
                  <input
                    type="number"
                    id="usage_limit"
                    min="1"
                    value={formData.usage_limit}
                    onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Leave blank for unlimited"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="is_active">Status</label>
                  <select
                    id="is_active"
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Valid From *</label>
                  <input
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className={errors.start_date ? 'error' : ''}
                  />
                  {errors.start_date && <span className="error-message">{errors.start_date}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="end_date">Valid Until *</label>
                  <input
                    type="date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className={errors.end_date ? 'error' : ''}
                  />
                  {errors.end_date && <span className="error-message">{errors.end_date}</span>}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDiscount ? 'Update Discount' : 'Create Discount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscountsPage
