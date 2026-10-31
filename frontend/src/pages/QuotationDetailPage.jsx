import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import './QuotationDetailPage.css'

function QuotationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  useEffect(() => {
    fetchQuotation()
  }, [id])

  const fetchQuotation = async () => {
    try {
      const response = await axiosInstance.get(`/api/quotations/${id}`)
      setQuotation(response.data)
    } catch (error) {
      showToast('Failed to load quotation', 'error')
      navigate('/admin/quotations')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await axiosInstance.patch(`/api/quotations/${id}/status`, { status: newStatus })
      showToast(`Quotation ${newStatus} successfully!`)
      fetchQuotation()
    } catch (error) {
      showToast('Failed to update status', 'error')
    }
  }

  const handleCopyShareLink = () => {
    const shareLink = `${window.location.origin}/share/quotation/${id}`
    navigator.clipboard.writeText(shareLink).then(() => {
      showToast('Share link copied to clipboard!')
    }).catch(() => {
      showToast('Failed to copy link', 'error')
    })
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft': return 'badge-inactive'
      case 'sent': return 'badge-type'
      case 'confirmed': return 'badge-active'
      case 'expired': return 'badge-inactive'
      default: return 'badge-type'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return <div className="loading">Loading quotation...</div>
  }

  return (
    <div className="quotation-detail-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/admin/quotations')}>
            ← Back to Quotations
          </button>
          <h1 className="page-title">{quotation.number}</h1>
          <p className="page-subtitle">Quotation Details</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className={`badge ${getStatusBadgeClass(quotation.status)}`}>
            {quotation.status}
          </span>
          {quotation.status === 'sent' && (
            <button className="btn-secondary" onClick={handleCopyShareLink}>
              📋 Copy Share Link
            </button>
          )}
          {quotation.status === 'draft' && (
            <button className="btn-primary" onClick={() => handleStatusChange('sent')}>
              Mark as Sent
            </button>
          )}
          {quotation.status === 'sent' && (
            <button className="btn-primary" onClick={() => handleStatusChange('confirmed')}>
              Confirm Quotation
            </button>
          )}
        </div>
      </div>

      <div className="detail-container">
        {/* Customer & Quotation Info */}
        <div className="info-grid">
          <div className="info-card">
            <h3 className="card-title">Customer Information</h3>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{quotation.customer_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{quotation.customer_email}</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3 className="card-title">Quotation Details</h3>
            <div className="info-content">
              <div className="info-row">
                <span className="info-label">Validity Date:</span>
                <span className="info-value">{formatDate(quotation.validity_date)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Recurring Plan:</span>
                <span className="info-value">{quotation.recurring_plan_name || 'None'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Lines */}
        <div className="lines-section">
          <h3 className="section-title">Order Lines</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th>Discount</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quotation.quotation_lines.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">No order lines found.</td>
                  </tr>
                ) : (
                  quotation.quotation_lines.map(line => (
                    <tr key={line.id}>
                      <td className="font-medium">{line.product_name}</td>
                      <td>
                        {line.variant_name ? (
                          <span className="badge badge-type">{line.variant_name}</span>
                        ) : (
                          <span style={{ color: 'var(--muted-blue)', fontStyle: 'italic' }}>None</span>
                        )}
                      </td>
                      <td>{line.quantity}</td>
                      <td>${line.unit_price.toFixed(2)}</td>
                      <td>
                        {line.tax_name ? (
                          <span className="badge badge-type">
                            {line.tax_name} ({line.tax_value}{line.tax_value ? '%' : ''})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted-blue)', fontStyle: 'italic' }}>None</span>
                        )}
                      </td>
                      <td>
                        {line.discount_name ? (
                          <span className="badge badge-type">
                            {line.discount_name} ({line.discount_value}{line.discount_value ? '%' : ''})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted-blue)', fontStyle: 'italic' }}>None</span>
                        )}
                      </td>
                      <td className="font-medium" style={{ color: 'var(--teal-blue)' }}>
                        ${line.price_subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="totals-summary">
          <div className="totals-card-detail">
            <div className="total-row">
              <span>Subtotal:</span>
              <span className="total-value">${quotation.subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Tax Amount:</span>
              <span className="total-value">${quotation.tax_amount.toFixed(2)}</span>
            </div>
            <div className="total-row total-grand">
              <span>Grand Total:</span>
              <span className="total-value">${quotation.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotationDetailPage
