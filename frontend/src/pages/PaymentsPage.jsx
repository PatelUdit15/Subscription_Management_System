import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import '../pages/TaxesPage.css';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'cash',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      // Filter for non-paid invoices
      const unpaidInvoices = response.data.filter(inv => inv.status !== 'paid');
      setInvoices(unpaidInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/payments', formData);
      fetchPayments();
      fetchInvoices();
      handleCloseModal();
      alert('Payment registered successfully!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to register payment');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    
    try {
      await axios.delete(`/payments/${id}`);
      fetchPayments();
      fetchInvoices();
    } catch (error) {
      alert('Failed to delete payment');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      invoice_id: '',
      amount: '',
      payment_method: 'cash',
      transaction_reference: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const getPaymentMethodBadge = (method) => {
    const badges = {
      cash: { bg: '#dcfce7', color: '#166534', label: 'Cash' },
      bank_transfer: { bg: '#dbeafe', color: '#1e40af', label: 'Bank Transfer' },
      credit_card: { bg: '#fef3c7', color: '#92400e', label: 'Credit Card' },
      stripe: { bg: '#f3e8ff', color: '#6b21a8', label: 'Stripe' },
      paypal: { bg: '#e0e7ff', color: '#3730a3', label: 'PayPal' }
    };
    const badge = badges[method] || badges.cash;
    return (
      <span style={{
        background: badge.bg,
        color: badge.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: '600'
      }}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment History</h1>
          <p className="page-subtitle">Track all payment transactions and cash flow</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Register Payment
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading payments...</div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td className="font-semibold">{payment.invoice_number}</td>
                  <td>{payment.customer_name}</td>
                  <td className="font-semibold" style={{ color: '#22c55e' }}>
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td>{getPaymentMethodBadge(payment.payment_method)}</td>
                  <td>{payment.transaction_reference || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-delete" onClick={() => handleDelete(payment.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register Payment</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Invoice *</label>
                  <select
                    value={formData.invoice_id}
                    onChange={(e) => {
                      const invoice = invoices.find(inv => inv.id === parseInt(e.target.value));
                      setFormData({ 
                        ...formData, 
                        invoice_id: e.target.value,
                        amount: invoice ? invoice.total_amount.toString() : ''
                      });
                    }}
                    required
                  >
                    <option value="">Select Invoice</option>
                    {invoices.map(invoice => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.number} - {invoice.customer_name} - ${invoice.total_amount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Transaction Reference</label>
                  <input
                    type="text"
                    value={formData.transaction_reference}
                    onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                    placeholder="e.g., TXN123456"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes about this payment"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
