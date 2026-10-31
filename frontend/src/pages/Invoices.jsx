import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import '../pages/TaxesPage.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      showToast('Failed to fetch invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await axios.patch(`/invoices/${invoiceId}/status`, { status: 'paid' });
      showToast('Invoice marked as paid', 'success');
      fetchInvoices();
    } catch (error) {
      showToast('Failed to update invoice status', 'error');
    }
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await axios.delete(`/invoices/${invoiceId}`);
      showToast('Invoice deleted successfully', 'success');
      fetchInvoices();
    } catch (error) {
      showToast('Failed to delete invoice', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'badge-blue',
      posted: 'badge-yellow',
      paid: 'badge-green',
      cancelled: 'badge-red'
    };
    return (
      <span className={`badge ${statusColors[status] || 'badge-gray'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <button
          onClick={() => window.location.href = '/admin/invoices/new'}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#0A4174',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          + Create Invoice
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Customer</th>
              <th>Date Issued</th>
              <th>Due Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.number}</td>
                  <td>{invoice.customer_name}</td>
                  <td>{formatDate(invoice.date_issued)}</td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td>{formatCurrency(invoice.total_amount)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td>
                    <div className="action-buttons">
                      {invoice.status === 'posted' && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className="btn-action btn-success"
                          title="Mark as Paid"
                        >
                          ✓ Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="btn-action btn-danger"
                        title="Delete"
                      >
                        🗑
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
  );
};

export default Invoices;
