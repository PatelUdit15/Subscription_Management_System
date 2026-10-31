import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import './DiscountsPage.css'

function DiscountsPage() {
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: '',
    min_purchase_amount: '',
    start_date: '',
    end_date: '',
    is_active: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchDiscounts()
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

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.value || formData.value < 0) newErrors.value = 'Value must be non-negative'
    if (!formData.start_date) newErrors.start_date = 'Start date is required'
    if (!formData.end_date) newErrors.end_date = 'End date is required'
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date must be after start date'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0
      }

      if (editingDiscount) {
        await axiosInstance.put(`/api/discounts/${editingDiscount.id}`, payload)
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
      await axiosInstance.delete(`/api/discounts/${id}`)
      showToast('Discount deleted successfully!')
      fetchDiscounts()
    } catch (error) {
      showToast('Failed to delete discount', 'error')
    }
  }

  const handleToggleStatus = async (discount) => {
    try {
      await axiosInstance.put(`/api/discounts/${discount.id}`, {
        ...discount,
        is_active: !discount.is_active
      })
      showToast(`Discount ${!discount.is_active ? 'activated' : 'deactivated'} successfully!`)
      fetchDiscounts()
    } catch (error) {
      showToast('Failed to update discount status', 'error')
    }
  }

  const openModal = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount)
      setFormData({
        name: discount.name,
        type: discount.type,
        value: discount.value.toString(),
        min_purchase_amount: discount.min_purchase_amount.toString(),
        start_date: discount.start_date,
        end_date: discount.end_date,
        is_active: discount.is_active
      })
    } else {
      setEditingDiscount(null)
      setFormData({
        name: '',
        type: 'percentage',
        value: '',
        min_purchase_amount: '0',
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
    setFormData({
      name: '',
      type: 'percentage',
      value: '',
      min_purchase_amount: '0',
      start_date: '',
      end_date: '',
      is_active: true
    })
    setErrors({})
  }

  const formatDate = (dateString) => {
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
          <p className="page-subtitle">Create and manage discount rules for products and subscriptions</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          + New Discount
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min. Purchase</th>
              <th>Valid Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No discounts found. Create your first discount to get started.
                </td>
              </tr>
            ) : (
              discounts.map(discount => (
                <tr key={discount.id}>
                  <td className="font-medium">{discount.name}</td>
                  <td>
                    <span className="badge badge-type">{discount.type}</span>
                  </td>
                  <td className="font-medium">
                    {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                  </td>
                  <td>${discount.min_purchase_amount}</td>
                  <td className="date-range">
                    {formatDate(discount.start_date)} - {formatDate(discount.end_date)}
                  </td>
                  <td>
                    <span className={`badge ${discount.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {discount.is_active ? 'Active' : 'Inactive'}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDiscount ? 'Edit Discount' : 'New Discount'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Discount Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Summer Sale, Black Friday"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Type *</label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="value">Value *</label>
                  <input
                    type="number"
                    id="value"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? '10' : '5.00'}
                    className={errors.value ? 'error' : ''}
                  />
                  {errors.value && <span className="error-message">{errors.value}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="min_purchase_amount">Minimum Purchase Amount</label>
                <input
                  type="number"
                  id="min_purchase_amount"
                  step="0.01"
                  min="0"
                  value={formData.min_purchase_amount}
                  onChange={e => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Start Date *</label>
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
                  <label htmlFor="end_date">End Date *</label>
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

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
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
