import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import './ProductDetailPage.css'

function QuotationTemplateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  useEffect(() => {
    fetchTemplate()
  }, [id])

  const fetchTemplate = async () => {
    try {
      const response = await axiosInstance.get(`/api/quotation-templates/${id}`)
      setTemplate(response.data)
    } catch (error) {
      showToast('Failed to load template', 'error')
      navigate('/admin/config/templates')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  if (loading) {
    return <div className="loading">Loading template...</div>
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
          <button className="btn-back" onClick={() => navigate('/admin/config/templates')}>
            ← Back to Templates
          </button>
          <h1 className="page-title">{template.name}</h1>
          <p className="page-subtitle">Template ID: #{template.id}</p>
        </div>
      </div>

      <div className="tab-content">
        <div className="general-tab">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
                Template Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <strong style={{ color: 'var(--muted-blue)' }}>Validity:</strong>
                  <span style={{ marginLeft: '0.5rem' }}>{template.validity_days} days</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--muted-blue)' }}>Recurring Plan:</strong>
                  <span style={{ marginLeft: '0.5rem' }}>
                    {template.recurring_plan_name || 'None'}
                  </span>
                </div>
                <div>
                  <strong style={{ color: 'var(--muted-blue)' }}>Duration:</strong>
                  <span style={{ marginLeft: '0.5rem' }}>
                    {template.end_duration ? `${template.end_duration} ${template.duration_unit}(s)` : 'No limit'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
                Pricing Summary
              </h3>
              <div style={{ 
                background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(135, 90, 123, 0.12)'
              }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Amount</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
                  ${template.total_amount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
            Product Lines
          </h3>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {template.template_lines.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No product lines found.
                    </td>
                  </tr>
                ) : (
                  template.template_lines.map(line => (
                    <tr key={line.id}>
                      <td className="font-medium">{line.product_name}</td>
                      <td>{line.quantity}</td>
                      <td>${line.unit_price.toFixed(2)}</td>
                      <td className="font-medium" style={{ color: 'var(--color-primary)' }}>
                        ${line.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--color-primary)' }}>
                  <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', padding: '1rem 1.5rem' }}>
                    Total Amount:
                  </td>
                  <td style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-primary)', padding: '1rem 1.5rem' }}>
                    ${template.total_amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotationTemplateDetailPage
