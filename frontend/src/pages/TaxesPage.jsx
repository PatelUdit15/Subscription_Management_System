import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axios'
import './TaxesPage.css'

function TaxesPage() {
  const [taxes, setTaxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTax, setEditingTax] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: '',
    is_active: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchTaxes()
  }, [])

  const fetchTaxes = async () => {
    try {
      const response = await axiosInstance.get('/taxes')
      setTaxes(response.data)
    } catch (error) {
      showToast('Failed to load taxes', 'error')
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value)
      }

      if (editingTax) {
        await axiosInstance.put(`/taxes/${editingTax.id}`, payload)
        showToast('Tax updated successfully!')
      } else {
        await axiosInstance.post('/taxes', payload)
        showToast('Tax created successfully!')
      }

      fetchTaxes()
      closeModal()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to save tax', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tax?')) return

    try {
      await axiosInstance.delete(`/taxes/${id}`)
      showToast('Tax deleted successfully!')
      fetchTaxes()
    } catch (error) {
      showToast('Failed to delete tax', 'error')
    }
  }

  const handleToggleStatus = async (tax) => {
    try {
      await axiosInstance.put(`/taxes/${tax.id}`, {
        ...tax,
        is_active: !tax.is_active
      })
      showToast(`Tax ${!tax.is_active ? 'activated' : 'deactivated'} successfully!`)
      fetchTaxes()
    } catch (error) {
      showToast('Failed to update tax status', 'error')
    }
  }

  const openModal = (tax = null) => {
    if (tax) {
      setEditingTax(tax)
      setFormData({
        name: tax.name,
        type: tax.type,
        value: tax.value.toString(),
        is_active: tax.is_active
      })
    } else {
      setEditingTax(null)
      setFormData({ name: '', type: 'percentage', value: '', is_active: true })
    }
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTax(null)
    setFormData({ name: '', type: 'percentage', value: '', is_active: true })
    setErrors({})
  }

  if (loading) {
    return <div className="loading">Loading taxes...</div>
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
          <h1 className="page-title">Tax Management</h1>
          <p className="page-subtitle">Configure tax percentages and types for automatic calculation</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          + New Tax
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxes.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No taxes found. Create your first tax to get started.
                </td>
              </tr>
            ) : (
              taxes.map(tax => (
                <tr key={tax.id}>
                  <td className="font-medium">{tax.name}</td>
                  <td>
                    <span className="badge badge-type">{tax.type}</span>
                  </td>
                  <td className="font-medium">
                    {tax.type === 'percentage' ? `${tax.value}%` : `$${tax.value}`}
                  </td>
                  <td>
                    <span className={`badge ${tax.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {tax.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => openModal(tax)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon btn-toggle" 
                        onClick={() => handleToggleStatus(tax)}
                        title={tax.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {tax.is_active ? '⏸️' : '▶️'}
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => handleDelete(tax.id)}
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
              <h2>{editingTax ? 'Edit Tax' : 'New Tax'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Tax Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., VAT, GST, Sales Tax"
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
                  {editingTax ? 'Update Tax' : 'Create Tax'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaxesPage
