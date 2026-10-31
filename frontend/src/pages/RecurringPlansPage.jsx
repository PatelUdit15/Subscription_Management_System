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
    billing_period: 'month',
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
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.auto_close_days || formData.auto_close_days < 0) {
      newErrors.auto_close_days = 'Auto-close days must be non-negative'
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
        auto_close_days: parseInt(formData.auto_close_days)
      }

      if (editingPlan) {
        await axiosInstance.put(`/api/recurring-plans/${editingPlan.id}`, payload)
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
      await axiosInstance.delete(`/api/recurring-plans/${id}`)
      showToast('Recurring plan deleted successfully!')
      fetchPlans()
    } catch (error) {
      showToast('Failed to delete recurring plan', 'error')
    }
  }

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        name: plan.name,
        billing_period: plan.billing_period,
        auto_close_days: plan.auto_close_days.toString(),
        is_closable: plan.is_closable,
        is_pausable: plan.is_pausable,
        can_renew: plan.can_renew
      })
    } else {
      setEditingPlan(null)
      setFormData({
        name: '',
        billing_period: 'month',
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
    setFormData({
      name: '',
      billing_period: 'month',
      auto_close_days: '0',
      is_closable: true,
      is_pausable: true,
      can_renew: true
    })
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
          <p className="page-subtitle">Configure billing cycles and subscription rules</p>
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
              <th>Billing Period</th>
              <th>Auto-Close Days</th>
              <th>Closable</th>
              <th>Pausable</th>
              <th>Can Renew</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No recurring plans found. Create your first plan to get started.
                </td>
              </tr>
            ) : (
              plans.map(plan => (
                <tr key={plan.id}>
                  <td className="font-medium">{plan.name}</td>
                  <td>
                    <span className="badge badge-type">{plan.billing_period}</span>
                  </td>
                  <td>{plan.auto_close_days} days</td>
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                  placeholder="e.g., Monthly Standard, Annual Premium"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="billing_period">Billing Period *</label>
                  <select
                    id="billing_period"
                    value={formData.billing_period}
                    onChange={e => setFormData({ ...formData, billing_period: e.target.value })}
                  >
                    <option value="weeks">Weeks</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="auto_close_days">Auto-Close Days *</label>
                  <input
                    type="number"
                    id="auto_close_days"
                    min="0"
                    value={formData.auto_close_days}
                    onChange={e => setFormData({ ...formData, auto_close_days: e.target.value })}
                    placeholder="0"
                    className={errors.auto_close_days ? 'error' : ''}
                  />
                  {errors.auto_close_days && <span className="error-message">{errors.auto_close_days}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_closable}
                    onChange={e => setFormData({ ...formData, is_closable: e.target.checked })}
                  />
                  <span>Is Closable</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_pausable}
                    onChange={e => setFormData({ ...formData, is_pausable: e.target.checked })}
                  />
                  <span>Is Pausable</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.can_renew}
                    onChange={e => setFormData({ ...formData, can_renew: e.target.checked })}
                  />
                  <span>Can Renew</span>
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
