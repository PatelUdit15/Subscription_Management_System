import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import './QuotationFormPage.css'

function QuotationFormPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  
  // Form data
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    validity_date: '',
    recurring_plan_id: '',
    template_id: ''
  })
  
  // Order lines
  const [orderLines, setOrderLines] = useState([
    { product_id: '', variant_id: '', quantity: '1', unit_price: '0', tax_id: '', discount_id: '' }
  ])
  
  // Dropdown data
  const [products, setProducts] = useState([])
  const [variants, setVariants] = useState({}) // Keyed by product_id
  const [taxes, setTaxes] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [recurringPlans, setRecurringPlans] = useState([])
  const [templates, setTemplates] = useState([])
  
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchDropdownData()
    // Set default validity date (30 days from now)
    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 30)
    setFormData(prev => ({ ...prev, validity_date: defaultDate.toISOString().split('T')[0] }))
  }, [])

  const fetchDropdownData = async () => {
    try {
      const [productsRes, taxesRes, discountsRes, plansRes, templatesRes] = await Promise.all([
        axiosInstance.get('/products'),
        axiosInstance.get('/taxes'),
        axiosInstance.get('/discounts'),
        axiosInstance.get('/recurring-plans'),
        axiosInstance.get('/quotation-templates')
      ])
      
      setProducts(productsRes.data)
      setTaxes(taxesRes.data)
      setDiscounts(discountsRes.data)
      setRecurringPlans(plansRes.data)
      setTemplates(templatesRes.data)
    } catch (error) {
      showToast('Failed to load form data', 'error')
    }
  }

  const fetchProductVariants = async (productId) => {
    try {
      const response = await axiosInstance.get(`/api/products/${productId}`)
      setVariants(prev => ({ ...prev, [productId]: response.data.variants || [] }))
    } catch (error) {
      console.error('Failed to load variants', error)
    }
  }

  const handleTemplateSelect = async (templateId) => {
    if (!templateId) return
    
    try {
      const response = await axiosInstance.get(`/api/quotation-templates/${templateId}`)
      const template = response.data
      
      // Auto-fill recurring plan
      if (template.recurring_plan_id) {
        setFormData(prev => ({ ...prev, recurring_plan_id: template.recurring_plan_id.toString() }))
      }
      
      // Auto-fill order lines from template
      const newLines = template.template_lines.map(line => ({
        product_id: line.product_id.toString(),
        variant_id: '',
        quantity: line.quantity.toString(),
        unit_price: line.unit_price.toString(),
        tax_id: '',
        discount_id: ''
      }))
      
      if (newLines.length > 0) {
        setOrderLines(newLines)
        // Fetch variants for all products
        newLines.forEach(line => {
          if (line.product_id) {
            fetchProductVariants(line.product_id)
          }
        })
      }
      
      showToast('Template loaded successfully!')
    } catch (error) {
      showToast('Failed to load template', 'error')
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    const newLines = [...orderLines]
    newLines[index].product_id = productId
    newLines[index].unit_price = product ? product.base_price.toString() : '0'
    newLines[index].variant_id = '' // Reset variant
    setOrderLines(newLines)
    
    if (productId) {
      fetchProductVariants(productId)
    }
  }

  const handleVariantChange = (index, variantId) => {
    const newLines = [...orderLines]
    newLines[index].variant_id = variantId
    
    // Update unit price to include variant extra price
    if (variantId) {
      const productId = newLines[index].product_id
      const productVariants = variants[productId] || []
      const variant = productVariants.find(v => v.id === parseInt(variantId))
      if (variant) {
        newLines[index].unit_price = variant.total_price.toString()
      }
    } else {
      // Reset to base product price
      const product = products.find(p => p.id === parseInt(newLines[index].product_id))
      if (product) {
        newLines[index].unit_price = product.base_price.toString()
      }
    }
    
    setOrderLines(newLines)
  }

  const updateOrderLine = (index, field, value) => {
    const newLines = [...orderLines]
    newLines[index][field] = value
    setOrderLines(newLines)
  }

  const addOrderLine = () => {
    setOrderLines([...orderLines, {
      product_id: '',
      variant_id: '',
      quantity: '1',
      unit_price: '0',
      tax_id: '',
      discount_id: ''
    }])
  }

  const removeOrderLine = (index) => {
    if (orderLines.length === 1) {
      showToast('At least one order line is required', 'error')
      return
    }
    const newLines = orderLines.filter((_, i) => i !== index)
    setOrderLines(newLines)
  }

  const calculateTotals = () => {
    let subtotal = 0
    let taxAmount = 0
    
    orderLines.forEach(line => {
      if (!line.product_id || !line.quantity) return
      
      const unitPrice = parseFloat(line.unit_price) || 0
      const quantity = parseFloat(line.quantity) || 0
      let lineSubtotal = unitPrice * quantity
      
      // Apply discount
      if (line.discount_id) {
        const discount = discounts.find(d => d.id === parseInt(line.discount_id))
        if (discount) {
          if (discount.type === 'percentage') {
            lineSubtotal -= lineSubtotal * (discount.value / 100)
          } else {
            lineSubtotal -= discount.value
          }
          lineSubtotal = Math.max(0, lineSubtotal)
        }
      }
      
      subtotal += lineSubtotal
      
      // Calculate tax on discounted subtotal
      if (line.tax_id) {
        const tax = taxes.find(t => t.id === parseInt(line.tax_id))
        if (tax) {
          if (tax.type === 'percentage') {
            taxAmount += lineSubtotal * (tax.value / 100)
          } else {
            taxAmount += tax.value
          }
        }
      }
    })
    
    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: (subtotal + taxAmount).toFixed(2)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.customer_name.trim()) newErrors.customer_name = 'Customer name is required'
    if (!formData.customer_email.trim()) newErrors.customer_email = 'Customer email is required'
    if (!formData.validity_date) newErrors.validity_date = 'Validity date is required'
    
    const hasValidLine = orderLines.some(line => line.product_id && line.quantity > 0)
    if (!hasValidLine) newErrors.order_lines = 'At least one valid order line is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const payload = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        validity_date: formData.validity_date,
        recurring_plan_id: formData.recurring_plan_id ? parseInt(formData.recurring_plan_id) : null,
        quotation_lines: orderLines
          .filter(line => line.product_id && line.quantity > 0)
          .map(line => ({
            product_id: parseInt(line.product_id),
            variant_id: line.variant_id ? parseInt(line.variant_id) : null,
            quantity: parseFloat(line.quantity),
            unit_price: parseFloat(line.unit_price),
            tax_id: line.tax_id ? parseInt(line.tax_id) : null,
            discount_id: line.discount_id ? parseInt(line.discount_id) : null
          }))
      }
      
      const response = await axiosInstance.post('/quotations', payload)
      showToast('Quotation created successfully!')
      setTimeout(() => navigate(`/quotations/${response.data.id}`), 1000)
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create quotation', 'error')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="quotation-form-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/quotations')}>
            ← Back to Quotations
          </button>
          <h1 className="page-title">New Quotation</h1>
          <p className="page-subtitle">Create a new sales quotation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-container">
          {/* Customer Information */}
          <div className="form-card">
            <h3 className="card-title">Customer Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customer_name">Customer Name *</label>
                <input
                  type="text"
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="John Doe"
                  className={errors.customer_name ? 'error' : ''}
                />
                {errors.customer_name && <span className="error-message">{errors.customer_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="customer_email">Customer Email *</label>
                <input
                  type="email"
                  id="customer_email"
                  value={formData.customer_email}
                  onChange={e => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="john@example.com"
                  className={errors.customer_email ? 'error' : ''}
                />
                {errors.customer_email && <span className="error-message">{errors.customer_email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="validity_date">Validity Date *</label>
                <input
                  type="date"
                  id="validity_date"
                  value={formData.validity_date}
                  onChange={e => setFormData({ ...formData, validity_date: e.target.value })}
                  className={errors.validity_date ? 'error' : ''}
                />
                {errors.validity_date && <span className="error-message">{errors.validity_date}</span>}
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

            <div className="form-group">
              <label htmlFor="template_id">Load from Template</label>
              <select
                id="template_id"
                value={formData.template_id}
                onChange={e => {
                  setFormData({ ...formData, template_id: e.target.value })
                  handleTemplateSelect(e.target.value)
                }}
              >
                <option value="">-- Select Template (Optional) --</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Lines */}
          <div className="form-card">
            <div className="card-header">
              <h3 className="card-title">Order Lines</h3>
              <button type="button" className="btn-secondary btn-sm" onClick={addOrderLine}>
                + Add Line
              </button>
            </div>
            {errors.order_lines && <span className="error-message">{errors.order_lines}</span>}

            <div className="order-lines-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Product</th>
                    <th style={{ width: '15%' }}>Variant</th>
                    <th style={{ width: '10%' }}>Qty</th>
                    <th style={{ width: '12%' }}>Unit Price</th>
                    <th style={{ width: '12%' }}>Tax</th>
                    <th style={{ width: '12%' }}>Discount</th>
                    <th style={{ width: '8%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderLines.map((line, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          value={line.product_id}
                          onChange={e => handleProductChange(index, e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- Select Product --</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} (${product.base_price})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={line.variant_id}
                          onChange={e => handleVariantChange(index, e.target.value)}
                          disabled={!line.product_id}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- No Variant --</option>
                          {(variants[line.product_id] || []).map(variant => (
                            <option key={variant.id} value={variant.id}>
                              {variant.attribute_name}: {variant.attribute_value} (+${variant.extra_price})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={line.quantity}
                          onChange={e => updateOrderLine(index, 'quantity', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unit_price}
                          onChange={e => updateOrderLine(index, 'unit_price', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td>
                        <select
                          value={line.tax_id}
                          onChange={e => updateOrderLine(index, 'tax_id', e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- No Tax --</option>
                          {taxes.map(tax => (
                            <option key={tax.id} value={tax.id}>
                              {tax.name} ({tax.value}{tax.type === 'percentage' ? '%' : ''})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={line.discount_id}
                          onChange={e => updateOrderLine(index, 'discount_id', e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- No Discount --</option>
                          {discounts.map(discount => (
                            <option key={discount.id} value={discount.id}>
                              {discount.name} ({discount.value}{discount.type === 'percentage' ? '%' : ''})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon btn-delete"
                          onClick={() => removeOrderLine(index)}
                          title="Remove"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Card */}
          <div className="totals-card">
            <h3 className="card-title">Summary</h3>
            <div className="totals-content">
              <div className="total-row">
                <span>Subtotal:</span>
                <span className="total-value">${totals.subtotal}</span>
              </div>
              <div className="total-row">
                <span>Tax Amount:</span>
                <span className="total-value">${totals.taxAmount}</span>
              </div>
              <div className="total-row total-grand">
                <span>Grand Total:</span>
                <span className="total-value">${totals.total}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/quotations')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Quotation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default QuotationFormPage
