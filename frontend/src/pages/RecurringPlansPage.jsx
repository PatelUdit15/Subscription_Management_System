import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import './TaxesPage.css'

function RecurringPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    billing_period: 'monthly',
    min_quantity: 1,
    start_date: '',
    end_date: '',
    auto_close: false,
    auto_close_days: '0',
    is_closable: true,
    is_pausable: true,
    can_renew: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await axiosInstance.get('/recurring-plans')
      setPlans(response.data)
    } catch (error) {
      showToast('Failed to load recurring plans', 'error')
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
    if (!formData.name.trim()) newErrors.name = 'Plan name is required'
    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = 'Price must be non-negative'
    }
    if (formData.min_quantity < 1) {
      newErrors.min_quantity = 'Min quantity must be at least 1'
    }
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date cannot be earlier than start date'
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
        price: parseFloat(formData.price) || 0,
        billing_period: formData.billing_period,
        min_quantity: parseInt(formData.min_quantity) || 1,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        auto_close: !!formData.auto_close,
        auto_close_days: parseInt(formData.auto_close_days) || 0,
        is_closable: !!formData.is_closable,
        is_pausable: !!formData.is_pausable,
        can_renew: !!formData.can_renew
      }

      if (editingPlan) {
        await axiosInstance.put(`/recurring-plans/${editingPlan.id}`, payload)
        showToast('Recurring plan updated successfully!')
      } else {
        await axiosInstance.post('/recurring-plans', payload)
        showToast('Recurring plan created successfully!')
      }

      fetchPlans()
      closeModal()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to save recurring plan', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recurring plan?')) return

    try {
      await axiosInstance.delete(`/recurring-plans/${id}`)
      showToast('Recurring plan deleted successfully!')
      fetchPlans()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to delete recurring plan', 'error')
    }
  }

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        name: plan.name || '',
        price: plan.price || 0,
        billing_period: plan.billing_period || 'monthly',
        min_quantity: plan.min_quantity || 1,
        start_date: plan.start_date || '',
        end_date: plan.end_date || '',
        auto_close: !!plan.auto_close,
        auto_close_days: (plan.auto_close_days || 0).toString(),
        is_closable: plan.is_closable !== false,
        is_pausable: plan.is_pausable !== false,
        can_renew: plan.can_renew !== false
      })
    } else {
      setEditingPlan(null)
      setFormData({
        name: '',
        price: 0,
        billing_period: 'monthly',
        min_quantity: 1,
        start_date: '',
        end_date: '',
        auto_close: false,
        auto_close_days: '0',
        is_closable: true,
        is_pausable: true,
        can_renew: true
      })
    }
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPlan(null)
    setErrors({})
  }

  if (loading) {
    return <div className="loading">Loading recurring plans...</div>
  }

  return (
    <div className="taxes-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Recurring Plans</h1>
          <p className="page-subtitle">Configure billing cycles, price, minimum quantity, and lifecycle policies</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          + New Recurring Plan
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Price</th>
              <th>Billing Period</th>
              <th>Min Qty</th>
              <th>Availability</th>
              <th>Auto-Close</th>
              <th>Closable</th>
              <th>Pausable</th>
              <th>Can Renew</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-state">
                  No recurring plans found. Create your first plan to get started.
                </td>
              </tr>
            ) : (
              plans.map(plan => (
                <tr key={plan.id}>
                  <td className="font-medium">{plan.name}</td>
                  <td>₹{parseFloat(plan.price || 0).toLocaleString()}</td>
                  <td>
                    <span className="badge badge-type" style={{ textTransform: 'capitalize' }}>
                      {plan.billing_period}
                    </span>
                  </td>
                  <td>{plan.min_quantity || 1}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {plan.start_date || plan.end_date ? (
                      `${plan.start_date || 'Any'} to ${plan.end_date || 'Ongoing'}`
                    ) : (
                      'Always Available'
                    )}
                  </td>
                  <td>
                    <span className={`badge ${plan.auto_close ? 'badge-active' : 'badge-inactive'}`}>
                      {plan.auto_close ? `Yes (${plan.auto_close_days}d)` : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${plan.is_closable ? 'badge-active' : 'badge-inactive'}`}>
                      {plan.is_closable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${plan.is_pausable ? 'badge-active' : 'badge-inactive'}`}>
                      {plan.is_pausable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${plan.can_renew ? 'badge-active' : 'badge-inactive'}`}>
                      {plan.can_renew ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => openModal(plan)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => handleDelete(plan.id)}
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingPlan ? 'Edit Recurring Plan' : 'New Recurring Plan'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Plan Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Daily Trial, Weekly Starter, Monthly Standard, Yearly Pro"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Base Plan Price (₹) *</label>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className={errors.price ? 'error' : ''}
                  />
                  {errors.price && <span className="error-message">{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="billing_period">Billing Period *</label>
                  <select
                    id="billing_period"
                    value={formData.billing_period}
                    onChange={e => setFormData({ ...formData, billing_period: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="min_quantity">Minimum Quantity</label>
                  <input
                    type="number"
                    id="min_quantity"
                    min="1"
                    value={formData.min_quantity}
                    onChange={e => setFormData({ ...formData, min_quantity: e.target.value })}
                    className={errors.min_quantity ? 'error' : ''}
                  />
                  {errors.min_quantity && <span className="error-message">{errors.min_quantity}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="auto_close_days">Auto-Close Days After Expiry</label>
                  <input
                    type="number"
                    id="auto_close_days"
                    min="0"
                    value={formData.auto_close_days}
                    onChange={e => setFormData({ ...formData, auto_close_days: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Available From (Start Date)</label>
                  <input
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end_date">Available Until (End Date)</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.auto_close}
                    onChange={e => setFormData({ ...formData, auto_close: e.target.checked })}
                  />
                  <span>Close on its own when it ends</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_closable}
                    onChange={e => setFormData({ ...formData, is_closable: e.target.checked })}
                  />
                  <span>Can be closed early</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_pausable}
                    onChange={e => setFormData({ ...formData, is_pausable: e.target.checked })}
                  />
                  <span>Can be paused</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.can_renew}
                    onChange={e => setFormData({ ...formData, can_renew: e.target.checked })}
                  />
                  <span>Can be renewed</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecurringPlansPage
