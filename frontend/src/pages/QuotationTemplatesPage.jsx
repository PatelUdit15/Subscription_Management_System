import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import './QuotationTemplatesPage.css'

function QuotationTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const navigate = useNavigate()
  
  const [recurringPlans, setRecurringPlans] = useState([])
  const [products, setProducts] = useState([])
  
  const [formData, setFormData] = useState({
    name: '',
    validity_days: '30',
    recurring_plan_id: '',
    end_duration: '',
    duration_unit: 'month',
    template_lines: []
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchTemplates()
    fetchRecurringPlans()
    fetchProducts()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await axiosInstance.get('/quotation-templates')
      setTemplates(response.data)
    } catch (error) {
      showToast('Failed to load templates', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecurringPlans = async () => {
    try {
      const response = await axiosInstance.get('/recurring-plans')
      setRecurringPlans(response.data)
    } catch (error) {
      console.error('Failed to load recurring plans', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to load products', error)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.validity_days || formData.validity_days <= 0) {
      newErrors.validity_days = 'Validity days must be positive'
    }
    if (formData.template_lines.length === 0) {
      newErrors.template_lines = 'At least one product line is required'
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
        validity_days: parseInt(formData.validity_days),
        recurring_plan_id: formData.recurring_plan_id ? parseInt(formData.recurring_plan_id) : null,
        end_duration: formData.end_duration ? parseInt(formData.end_duration) : null,
        duration_unit: formData.duration_unit,
        template_lines: formData.template_lines.map(line => ({
          product_id: parseInt(line.product_id),
          quantity: parseFloat(line.quantity)
        }))
      }

      await axiosInstance.post('/quotation-templates', payload)
      showToast('Quotation template created successfully!')
      fetchTemplates()
      closeModal()
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create template', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      await axiosInstance.delete(`/api/quotation-templates/${id}`)
      showToast('Template deleted successfully!')
      fetchTemplates()
    } catch (error) {
      showToast('Failed to delete template', 'error')
    }
  }

  const addProductLine = () => {
    setFormData({
      ...formData,
      template_lines: [...formData.template_lines, { product_id: '', quantity: '1' }]
    })
  }

  const removeProductLine = (index) => {
    const newLines = formData.template_lines.filter((_, i) => i !== index)
    setFormData({ ...formData, template_lines: newLines })
  }

  const updateProductLine = (index, field, value) => {
    const newLines = [...formData.template_lines]
    newLines[index][field] = value
    setFormData({ ...formData, template_lines: newLines })
  }

  const openModal = () => {
    setFormData({
      name: '',
      validity_days: '30',
      recurring_plan_id: '',
      end_duration: '',
      duration_unit: 'month',
      template_lines: [{ product_id: '', quantity: '1' }]
    })
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      name: '',
      validity_days: '30',
      recurring_plan_id: '',
      end_duration: '',
      duration_unit: 'month',
      template_lines: []
    })
    setErrors({})
  }

  const getRecurringPlanName = (planId) => {
    const plan = recurringPlans.find(p => p.id === planId)
    return plan ? plan.name : 'None'
  }

  if (loading) {
    return <div className="loading">Loading quotation templates...</div>
  }

  return (
    <div className="quotation-templates-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Quotation Templates</h1>
          <p className="page-subtitle">Pre-configured templates for quick subscription creation</p>
        </div>
        <button className="btn-primary" onClick={openModal}>
          + New Template
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Template Name</th>
              <th>Validity (Days)</th>
              <th>Recurring Plan</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No templates found. Create your first template to get started.
                </td>
              </tr>
            ) : (
              templates.map(template => (
                <tr key={template.id}>
                  <td className="font-medium">{template.name}</td>
                  <td>{template.validity_days} days</td>
                  <td>
                    <span className="badge badge-type">
                      {getRecurringPlanName(template.recurring_plan_id)}
                    </span>
                  </td>
                  <td>
                    {template.end_duration ? (
                      `${template.end_duration} ${template.duration_unit}(s)`
                    ) : (
                      <span style={{ color: 'var(--muted-blue)', fontStyle: 'italic' }}>No limit</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => navigate(`/admin/config/templates/${template.id}`)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => handleDelete(template.id)}
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
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Quotation Template</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Template Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Monthly Package"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="validity_days">Validity (Days) *</label>
                  <input
                    type="number"
                    id="validity_days"
                    min="1"
                    value={formData.validity_days}
                    onChange={e => setFormData({ ...formData, validity_days: e.target.value })}
                    className={errors.validity_days ? 'error' : ''}
                  />
                  {errors.validity_days && <span className="error-message">{errors.validity_days}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="recurring_plan_id">Recurring Plan</label>
                  <select
                    id="recurring_plan_id"
                    value={formData.recurring_plan_id}
                    onChange={e => setFormData({ ...formData, recurring_plan_id: e.target.value })}
                  >
                    <option value="">-- No Recurring Plan --</option>
                    {recurringPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="end_duration">End Duration</label>
                  <input
                    type="number"
                    id="end_duration"
                    min="1"
                    value={formData.end_duration}
                    onChange={e => setFormData({ ...formData, end_duration: e.target.value })}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="duration_unit">Duration Unit</label>
                  <select
                    id="duration_unit"
                    value={formData.duration_unit}
                    onChange={e => setFormData({ ...formData, duration_unit: e.target.value })}
                  >
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Product Lines *</h3>
                  <button type="button" className="btn-secondary btn-sm" onClick={addProductLine}>
                    + Add Product
                  </button>
                </div>
                {errors.template_lines && <span className="error-message">{errors.template_lines}</span>}

                <div className="product-lines">
                  {formData.template_lines.map((line, index) => (
                    <div key={index} className="product-line">
                      <div className="product-line-fields">
                        <div className="form-group">
                          <label>Product</label>
                          <select
                            value={line.product_id}
                            onChange={e => updateProductLine(index, 'product_id', e.target.value)}
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} (${product.base_price})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Quantity</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={line.quantity}
                            onChange={e => updateProductLine(index, 'quantity', e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-icon btn-delete"
                        onClick={() => removeProductLine(index)}
                        title="Remove"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuotationTemplatesPage
