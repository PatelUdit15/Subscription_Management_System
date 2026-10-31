import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import axiosInstance from '../api/axios'
import './CustomerPortalPage.css'

function CustomerPortalPage() {
  const { id } = useParams()
  const [quotation, setQuotation] = useState(null)
  const [companySettings, setCompanySettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signing, setSigning] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const signatureRef = useRef(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [quotationRes, settingsRes] = await Promise.all([
        axiosInstance.get(`/api/public/quotations/${id}`),
        axiosInstance.get('/api/settings')
      ])
      setQuotation(quotationRes.data)
      setCompanySettings(settingsRes.data)
      
      // Pre-fill signer name with customer name
      setSignerName(quotationRes.data.customer_name)
    } catch (error) {
      showToast('Failed to load quotation', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const handleAcceptClick = () => {
    if (quotation.status !== 'sent') {
      showToast('This quotation has already been processed', 'error')
      return
    }
    setShowSignatureModal(true)
  }

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear()
    }
  }

  const handleConfirmSignature = async () => {
    if (!signerName.trim()) {
      showToast('Please enter your name', 'error')
      return
    }

    if (signatureRef.current.isEmpty()) {
      showToast('Please provide your signature', 'error')
      return
    }

    setSigning(true)
    try {
      const signatureData = signatureRef.current.toDataURL()
      
      await axiosInstance.post(`/api/quotations/${id}/sign`, {
        signature_data: signatureData,
        signed_by: signerName
      })

      showToast('Quotation signed successfully! Your subscription is now active.')
      setShowSignatureModal(false)
      
      // Refresh quotation data
      setTimeout(() => fetchData(), 1000)
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to sign quotation', 'error')
    } finally {
      setSigning(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: { text: 'Draft', class: 'status-draft' },
      sent: { text: 'Awaiting Signature', class: 'status-sent' },
      confirmed: { text: 'Confirmed', class: 'status-confirmed' },
      expired: { text: 'Expired', class: 'status-expired' }
    }
    return badges[status] || badges.draft
  }

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="loading-spinner"></div>
        <p>Loading quotation...</p>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="portal-error">
        <h1>Quotation Not Found</h1>
        <p>The quotation you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }

  const statusBadge = getStatusBadge(quotation.status)

  return (
    <div className="customer-portal">
      {toast.show && (
        <div className={`portal-toast portal-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="portal-container">
        {/* Header with Company Logo */}
        <div className="portal-header">
          {companySettings?.logo_url && (
            <img src={companySettings.logo_url} alt="Company Logo" className="company-logo" />
          )}
          <h1 className="company-name">{companySettings?.company_name || 'SubscriptionFlow Pro'}</h1>
          <div className="company-details">
            <p>{companySettings?.address}</p>
            <p>{companySettings?.website}</p>
          </div>
        </div>

        {/* Quotation Document */}
        <div className="quotation-document">
          {/* Document Header */}
          <div className="document-header">
            <div>
              <h2 className="document-title">Quotation</h2>
              <p className="quotation-number">{quotation.number}</p>
            </div>
            <div className="status-badge-container">
              <span className={`status-badge ${statusBadge.class}`}>
                {statusBadge.text}
              </span>
            </div>
          </div>

          {/* Customer & Quotation Info */}
          <div className="info-section">
            <div className="info-column">
              <h3>Bill To:</h3>
              <p className="customer-name">{quotation.customer_name}</p>
              <p className="customer-email">{quotation.customer_email}</p>
            </div>
            <div className="info-column">
              <h3>Quotation Details:</h3>
              <p><strong>Valid Until:</strong> {formatDate(quotation.validity_date)}</p>
              {quotation.recurring_plan_name && (
                <p><strong>Billing Plan:</strong> {quotation.recurring_plan_name}</p>
              )}
            </div>
          </div>

          {/* Order Lines Table */}
          <div className="lines-section">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quotation.quotation_lines.map(line => (
                  <tr key={line.id}>
                    <td className="product-name">{line.product_name}</td>
                    <td>{line.variant_name || '-'}</td>
                    <td>{line.quantity}</td>
                    <td>${line.unit_price.toFixed(2)}</td>
                    <td className="line-total">${line.price_subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="totals-section">
            <div className="totals-row">
              <span>Subtotal:</span>
              <span>${quotation.subtotal.toFixed(2)}</span>
            </div>
            <div className="totals-row">
              <span>Tax:</span>
              <span>${quotation.tax_amount.toFixed(2)}</span>
            </div>
            <div className="totals-row total-grand">
              <span>Total Amount:</span>
              <span>${quotation.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Signature Section */}
          {quotation.status === 'confirmed' && quotation.signature_data && (
            <div className="signature-section">
              <h3>Digitally Signed</h3>
              <div className="signature-display">
                <img src={quotation.signature_data} alt="Signature" className="signature-image" />
              </div>
              <p className="signature-info">
                Signed by: <strong>{quotation.signed_by}</strong>
              </p>
              <p className="signature-info">
                Date: <strong>{formatDate(quotation.signed_at)}</strong>
              </p>
            </div>
          )}

          {/* Accept Button */}
          {quotation.status === 'sent' && (
            <div className="action-section">
              <button className="btn-accept" onClick={handleAcceptClick}>
                Accept & Sign Quotation
              </button>
              <p className="action-note">
                By signing this quotation, you agree to the terms and your subscription will be activated immediately.
              </p>
            </div>
          )}

          {quotation.status === 'confirmed' && (
            <div className="confirmation-message">
              <div className="confirmation-icon">✓</div>
              <h3>Quotation Confirmed</h3>
              <p>Thank you! Your subscription is now active.</p>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="signature-modal-overlay" onClick={() => setShowSignatureModal(false)}>
          <div className="signature-modal" onClick={e => e.stopPropagation()}>
            <div className="signature-modal-header">
              <h2>Sign Quotation</h2>
              <button className="modal-close" onClick={() => setShowSignatureModal(false)}>✕</button>
            </div>

            <div className="signature-modal-body">
              <div className="form-group">
                <label htmlFor="signer_name">Your Full Name *</label>
                <input
                  type="text"
                  id="signer_name"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label>Your Signature *</label>
                <div className="signature-canvas-container">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'signature-canvas'
                    }}
                  />
                </div>
                <button type="button" className="btn-clear" onClick={handleClearSignature}>
                  Clear Signature
                </button>
              </div>

              <div className="signature-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowSignatureModal(false)}
                  disabled={signing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConfirmSignature}
                  disabled={signing}
                >
                  {signing ? 'Signing...' : 'Confirm & Sign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerPortalPage
