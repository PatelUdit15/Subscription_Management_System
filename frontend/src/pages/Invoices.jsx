import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import '../pages/TaxesPage.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Quick Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

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

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleRunBillingDay = async () => {
    if (!window.confirm('Run Billing Day engine?\n\nThis will scan active subscriptions due today and automatically create posted invoices with taxes and discounts applied.')) {
      return;
    }

    try {
      setBillingLoading(true);
      const res = await axios.post('/subscriptions/run-billing-day');
      const data = res.data;
      showToast(`Billing Day processed: ${data.invoices_created} invoices generated.`);
      fetchInvoices();
    } catch (err) {
      showToast('Billing day failed: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleConfirmInvoice = async (invoiceId) => {
    try {
      await axios.post(`/invoices/${invoiceId}/confirm`);
      showToast('Invoice confirmed and posted with assigned invoice number.');
      fetchInvoices();
    } catch (err) {
      showToast('Failed to confirm invoice: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.total_amount.toString(),
      payment_method: 'bank_transfer',
      transaction_reference: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: `Payment for ${invoice.number || 'Invoice'}`
    });
    setShowPaymentModal(true);
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await axios.post('/payments', {
        invoice_id: selectedInvoice.id,
        amount: parseFloat(paymentData.amount) || 0,
        payment_method: paymentData.payment_method,
        transaction_reference: paymentData.transaction_reference,
        payment_date: paymentData.payment_date,
        notes: paymentData.notes
      });
      showToast(`Payment of ₹${paymentData.amount} recorded successfully.`);
      setShowPaymentModal(false);
      fetchInvoices();
    } catch (err) {
      showToast('Failed to record payment: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await axios.delete(`/invoices/${invoiceId}`);
      showToast('Invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      showToast('Failed to delete invoice', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getStatusBadge = (invoice) => {
    const isOverdue = invoice.due_date < todayStr && invoice.status !== 'paid' && invoice.status !== 'cancelled';
    
    if (isOverdue) {
      return (
        <span style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '0.3rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '700'
        }}>
          ⚠️ OVERDUE
        </span>
      );
    }

    const statusColors = {
      draft: { bg: '#e0f2fe', color: '#0369a1' },
      posted: { bg: '#fef3c7', color: '#92400e' },
      paid: { bg: '#dcfce7', color: '#166534' },
      cancelled: { bg: '#f3f4f6', color: '#6b7280' }
    };
    const s = statusColors[invoice.status] || { bg: '#f3f4f6', color: '#6b7280' };

    return (
      <span style={{
        background: s.bg,
        color: s.color,
        padding: '0.3rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '600',
        textTransform: 'capitalize'
      }}>
        {invoice.status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredInvoices = invoices.filter(inv => {
    const isOverdue = inv.due_date < todayStr && inv.status !== 'paid' && inv.status !== 'cancelled';
    
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'overdue' && isOverdue) ||
      (statusFilter !== 'overdue' && inv.status === statusFilter);

    const matchesSearch =
      (inv.number && inv.number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const overdueCount = invoices.filter(inv => inv.due_date < todayStr && inv.status !== 'paid' && inv.status !== 'cancelled').length;

  if (loading) {
    return <div className="page-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading invoices...</div>;
  }

  return (
    <div className="page-container" style={{ fontFamily: 'var(--font-body)', padding: '2rem' }}>
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)', fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
            Invoices
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Automated billing lifecycle: Draft → Confirmed/Posted → Paid. Real-time tax & discount calculation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleRunBillingDay}
            disabled={billingLoading}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: billingLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(135, 90, 123, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>⚡</span> {billingLoading ? 'Processing...' : 'Run Billing Day'}
          </button>

          <button
            onClick={() => window.location.href = '/admin/invoices/new'}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'white',
              color: 'var(--color-primary-dark)',
              border: '2px solid var(--color-primary)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-accent-light)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            + Create Invoice
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { key: 'all', label: `All (${invoices.length})` },
          { key: 'overdue', label: `⚠️ Overdue (${overdueCount})`, isAlert: overdueCount > 0 },
          { key: 'posted', label: 'Posted / Awaiting Payment' },
          { key: 'draft', label: 'Draft' },
          { key: 'paid', label: 'Paid' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: '1.5px solid',
              borderColor: tab.isAlert && statusFilter !== 'overdue' ? '#f87171' : statusFilter === tab.key ? 'var(--color-primary)' : 'rgba(135, 90, 123, 0.2)',
              background: statusFilter === tab.key ? 'var(--color-primary)' : tab.isAlert ? '#fef2f2' : '#fff',
              color: statusFilter === tab.key ? '#fff' : tab.isAlert ? '#b91c1c' : 'var(--color-text-secondary)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: statusFilter === tab.key ? '0 2px 8px rgba(135, 90, 123, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search by invoice number or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.55rem 1rem',
            border: '1.5px solid rgba(135, 90, 123, 0.2)',
            borderRadius: '8px',
            width: '320px',
            fontSize: '0.9rem',
            outline: 'none',
            background: 'white'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(135, 90, 123, 0.2)'}
        />
      </div>

      {/* Invoices Table */}
      <div className="table-container" style={{
        borderRadius: '14px',
        border: '1px solid rgba(135, 90, 123, 0.15)',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(135, 90, 123, 0.06)',
        background: 'white'
      }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
              color: 'white'
            }}>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>Invoice Number</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>Customer</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>Date Issued</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>Due Date</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>Total Amount</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: '600', fontSize: '0.85rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                  No invoices found matching criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} style={{ borderBottom: '1px solid rgba(135, 90, 123, 0.08)' }}>
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: '600', color: 'var(--color-primary-dark)' }}>
                    {invoice.number || `INV-Draft-${invoice.id}`}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-primary)' }}>{invoice.customer_name}</td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-secondary)' }}>{formatDate(invoice.date_issued)}</td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-secondary)' }}>{formatDate(invoice.due_date)}</td>
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: '700', color: 'var(--color-primary-dark)' }}>
                    ₹{parseFloat(invoice.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>{getStatusBadge(invoice)}</td>
                  <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end', display: 'flex', gap: '0.5rem' }}>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleConfirmInvoice(invoice.id)}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                          title="Confirm & Post Invoice"
                        >
                          Confirm
                        </button>
                      )}

                      {invoice.status === 'posted' && (
                        <button
                          onClick={() => handleOpenPayment(invoice)}
                          style={{
                            background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(135, 90, 123, 0.25)'
                          }}
                          title="Record Payment"
                        >
                          + Pay
                        </button>
                      )}

                      <button
                        onClick={() => window.print()}
                        style={{
                          background: 'var(--color-bg-soft)',
                          border: '1px solid var(--color-border)',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        title="Print Invoice"
                      >
                        🖨️
                      </button>

                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="btn-action btn-danger"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.35rem'
                        }}
                        title="Delete Invoice"
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

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', border: '1px solid rgba(135, 90, 123, 0.2)' }}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--color-primary-dark)' }}>Record Payment for {selectedInvoice.number || `Invoice #${selectedInvoice.id}`}</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>

            <form onSubmit={handleRegisterPayment} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', background: 'var(--color-bg-soft)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Customer: <strong style={{ color: 'var(--color-text-primary)' }}>{selectedInvoice.customer_name}</strong></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Invoice Total: <strong style={{ color: 'var(--color-primary-dark)' }}>₹{selectedInvoice.total_amount}</strong></div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'var(--color-primary-dark)' }}>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentData.amount}
                  onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'var(--color-primary-dark)' }}>Payment Method *</label>
                <select
                  value={paymentData.payment_method}
                  onChange={e => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Instant Transfer</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'var(--color-primary-dark)' }}>Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentData.payment_date}
                  onChange={e => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'var(--color-primary-dark)' }}>Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-894827 or Bank Cheque No"
                  value={paymentData.transaction_reference}
                  onChange={e => setPaymentData({ ...paymentData, transaction_reference: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ color: 'var(--color-primary-dark)' }}>Notes</label>
                <textarea
                  rows="2"
                  value={paymentData.notes}
                  onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1.5px solid rgba(135, 90, 123, 0.2)', borderRadius: '8px' }}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(135, 90, 123, 0.15)', paddingTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)} style={{ padding: '0.6rem 1.25rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
