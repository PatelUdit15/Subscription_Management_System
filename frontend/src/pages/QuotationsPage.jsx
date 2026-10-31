import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axios'
import './QuotationsPage.css'

function QuotationsPage() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const navigate = useNavigate()

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    try {
      const response = await axiosInstance.get('/quotations')
      setQuotations(response.data)
    } catch (error) {
      showToast('Failed to load quotations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return

    try {
      await axiosInstance.delete(`/api/quotations/${id}`)
      showToast('Quotation deleted successfully!')
      fetchQuotations()
    } catch (error) {
      showToast('Failed to delete quotation', 'error')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/api/quotations/${id}/status`, { status: newStatus })
      showToast(`Quotation ${newStatus} successfully!`)
      fetchQuotations()
    } catch (error) {
      showToast('Failed to update status', 'error')
    }
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
    return <div className="loading">Loading quotations...</div>
  }

  return (
    <div className="quotations-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Quotations</h1>
          <p className="page-subtitle">Create and manage customer quotations</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/quotations/new')}>
          + New Quotation
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Validity Date</th>
              <th>Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No quotations found. Create your first quotation to get started.
                </td>
              </tr>
            ) : (
              quotations.map(quot => (
                <tr key={quot.id}>
                  <td className="font-medium">{quot.number}</td>
                  <td>
                    <div>
                      <div className="font-medium">{quot.customer_name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted-blue)' }}>
                        {quot.customer_email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(quot.status)}`}>
                      {quot.status}
                    </span>
                  </td>
                  <td>{formatDate(quot.validity_date)}</td>
                  <td className="font-medium" style={{ color: 'var(--teal-blue)' }}>
                    ${quot.total_amount.toFixed(2)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => navigate(`/admin/quotations/${quot.id}`)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      {quot.status === 'draft' && (
                        <button 
                          className="btn-icon btn-toggle" 
                          onClick={() => handleStatusChange(quot.id, 'sent')}
                          title="Mark as Sent"
                        >
                          📤
                        </button>
                      )}
                      {quot.status === 'sent' && (
                        <button 
                          className="btn-icon btn-toggle" 
                          onClick={() => handleStatusChange(quot.id, 'confirmed')}
                          title="Confirm"
                        >
                          ✅
                        </button>
                      )}
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => handleDelete(quot.id)}
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
    </div>
  )
}

export default QuotationsPage
