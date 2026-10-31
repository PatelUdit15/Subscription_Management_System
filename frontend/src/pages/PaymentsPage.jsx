import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import StripePaymentModal from '../components/StripePaymentModal';
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Calendar, 
  FileText, 
  PlusCircle, 
  Trash2,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import '../pages/TaxesPage.css';

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState('outstanding'); // 'outstanding', 'history', 'paid'
  const [payments, setPayments] = useState([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [summary, setSummary] = useState({
    total_settled: 0,
    total_outstanding: 0,
    paid_invoices_count: 0,
    outstanding_invoices_count: 0,
    total_payments_count: 0
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [stripeModalData, setStripeModalData] = useState({ isOpen: false, invoice: null, amount: 0 });

  // Form for Manual Payment Registration
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'stripe',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
    transaction_reference: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchPayments(),
        fetchOutstandingInvoices(),
        fetchPaidInvoices()
      ]);
    } catch (err) {
      console.error('Error loading payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get('/payments/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/payments');
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const fetchOutstandingInvoices = async () => {
    try {
      const res = await axios.get('/payments/invoices/outstanding');
      setOutstandingInvoices(res.data);
    } catch (err) {
      console.error('Failed to fetch outstanding invoices:', err);
    }
  };

  const fetchPaidInvoices = async () => {
    try {
      const res = await axios.get('/payments/invoices/paid');
      setPaidInvoices(res.data);
    } catch (err) {
      console.error('Failed to fetch paid invoices:', err);
    }
  };

  // Open Stripe Gateway modal for a specific invoice
  const handleOpenStripeGateway = (invoice) => {
    setStripeModalData({
      isOpen: true,
      invoice: invoice,
      amount: invoice.balance_outstanding || invoice.total_amount
    });
  };

  // Open manual registration for a specific invoice
  const handleOpenManualForInvoice = (invoice) => {
    setFormData({
      invoice_id: invoice.id.toString(),
      amount: (invoice.balance_outstanding || invoice.total_amount).toString(),
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      notes: `Settlement for invoice ${invoice.number}`,
      transaction_reference: ''
    });
    setShowManualModal(true);
  };

  // Handle manual form submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/payments', {
        invoice_id: parseInt(formData.invoice_id),
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        notes: formData.notes,
        transaction_reference: formData.transaction_reference || undefined
      });
      alert('Payment settlement registered successfully!');
      handleCloseManualModal();
      loadAllData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to register payment');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!confirm('Are you sure you want to delete this payment record? This will adjust invoice settlement status.')) return;
    try {
      await axios.delete(`/payments/${id}`);
      loadAllData();
    } catch (error) {
      alert('Failed to delete payment');
    }
  };

  const handleCloseManualModal = () => {
    setShowManualModal(false);
    setFormData({
      invoice_id: '',
      amount: '',
      payment_method: 'stripe',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
      transaction_reference: ''
    });
  };

  const getPaymentMethodBadge = (method) => {
    const badges = {
      stripe: { bg: '#635BFF', color: '#ffffff', label: 'Stripe Gateway' },
      credit_card: { bg: '#e0e7ff', color: '#3730a3', label: 'Credit Card' },
      cash: { bg: '#dcfce7', color: '#166534', label: 'Cash' },
      bank_transfer: { bg: '#dbeafe', color: '#1e40af', label: 'Bank Transfer' },
      paypal: { bg: '#fef3c7', color: '#92400e', label: 'PayPal' },
      upi: { bg: '#f3e8ff', color: '#6b21a8', label: 'UPI / QR' }
    };
    const b = badges[method] || { bg: '#f1f5f9', color: '#475569', label: method };
    return (
      <span style={{
        background: b.bg,
        color: b.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.82rem',
        fontWeight: '700',
        display: 'inline-block'
      }}>
        {b.label}
      </span>
    );
  };

  // Filtered Outstanding Invoices
  const filteredOutstanding = outstandingInvoices.filter(inv => 
    inv.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Payments History
  const filteredPayments = payments.filter(p => 
    p.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.transaction_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Paid Invoices
  const filteredPaid = paidInvoices.filter(inv => 
    inv.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#2E2E2E', margin: 0, fontFamily: 'Gabarito, sans-serif' }}>
            Payment Management & Invoice Settlement
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0.35rem 0 0' }}>
            Track settled collections, monitor outstanding invoices, and settle invoices via Stripe Payment Gateway.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowManualModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(135, 90, 123, 0.2)'
            }}
          >
            <PlusCircle size={18} />
            Register Payment
          </button>
          <button
            onClick={() => {
              if (outstandingInvoices.length > 0) {
                handleOpenStripeGateway(outstandingInvoices[0]);
              } else {
                alert('No outstanding invoices available to settle.');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.4rem',
              background: 'linear-gradient(135deg, #635BFF 0%, #0A2540 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 91, 255, 0.35)'
            }}
          >
            <Zap size={18} />
            ⚡ Stripe Payment Gateway
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Total Settled */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Settled
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16a34a' }}>
              ${summary.total_settled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {summary.total_payments_count} payment transactions
            </div>
          </div>
        </div>

        {/* Total Outstanding */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Outstanding Balance
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#dc2626' }}>
              ${summary.total_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: '600' }}>
              Awaiting settlement
            </div>
          </div>
        </div>

        {/* Outstanding Invoices Count */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Outstanding Invoices
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#2E2E2E' }}>
              {summary.outstanding_invoices_count}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Unpaid / due invoices
            </div>
          </div>
        </div>

        {/* Paid Invoices Count */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#e0e7ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Paid Invoices
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#2E2E2E' }}>
              {summary.paid_invoices_count}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '600' }}>
              Fully settled
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('outstanding')}
            style={{
              padding: '0.75rem 1.25rem',
              background: activeTab === 'outstanding' ? 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)' : 'transparent',
              color: activeTab === 'outstanding' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem'
            }}
          >
            <span>⏳ Outstanding Invoices</span>
            <span style={{
              background: activeTab === 'outstanding' ? 'rgba(255,255,255,0.2)' : '#fee2e2',
              color: activeTab === 'outstanding' ? '#fff' : '#dc2626',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.78rem'
            }}>
              {outstandingInvoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '0.75rem 1.25rem',
              background: activeTab === 'history' ? 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)' : 'transparent',
              color: activeTab === 'history' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem'
            }}
          >
            <span>💳 Payment History</span>
            <span style={{
              background: activeTab === 'history' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
              color: activeTab === 'history' ? '#fff' : '#475569',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.78rem'
            }}>
              {payments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('paid')}
            style={{
              padding: '0.75rem 1.25rem',
              background: activeTab === 'paid' ? '#0A2540' : 'transparent',
              color: activeTab === 'paid' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem'
            }}
          >
            <span>✅ Settled Invoices</span>
            <span style={{
              background: activeTab === 'paid' ? 'rgba(255,255,255,0.2)' : '#dcfce7',
              color: activeTab === 'paid' ? '#fff' : '#166534',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.78rem'
            }}>
              {paidInvoices.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading settlement and payment data...
        </div>
      ) : (
        <>
          {/* TAB 1: OUTSTANDING INVOICES */}
          {activeTab === 'outstanding' && (
            <div className="data-table-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0A2540' }}>
                    Outstanding Invoices Awaiting Settlement
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Settle directly with <strong>Stripe Payment Gateway</strong> (Zero-verification) or register manual settlement.
                  </p>
                </div>
              </div>

              {filteredOutstanding.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>All Invoices Are Fully Settled!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No outstanding or overdue invoices at this time.</p>
                </div>
              ) : (
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem' }}>Invoice #</th>
                      <th style={{ padding: '1rem' }}>Customer</th>
                      <th style={{ padding: '1rem' }}>Due Date</th>
                      <th style={{ padding: '1rem' }}>Total Amount</th>
                      <th style={{ padding: '1rem' }}>Already Paid</th>
                      <th style={{ padding: '1rem' }}>Outstanding Balance</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutstanding.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: '700', color: '#0A2540' }}>
                          {inv.number}
                        </td>
                        <td style={{ padding: '1rem', color: '#334155' }}>
                          {inv.customer_name}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>
                          ${inv.total_amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem', color: '#16a34a', fontWeight: '600' }}>
                          ${inv.amount_paid.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem', color: '#dc2626', fontWeight: '800', fontSize: '1.05rem' }}>
                          ${inv.balance_outstanding.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenStripeGateway(inv)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.45rem 0.85rem',
                                background: 'linear-gradient(135deg, #635BFF 0%, #0A2540 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(99, 91, 255, 0.3)'
                              }}
                            >
                              <Zap size={13} /> Settle with Stripe
                            </button>
                            <button
                              onClick={() => handleOpenManualForInvoice(inv)}
                              style={{
                                padding: '0.45rem 0.75rem',
                                background: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Manual Settle
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: PAYMENT HISTORY */}
          {activeTab === 'history' && (
            <div className="data-table-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0A2540' }}>
                  Recorded Payments & Invoice Settlements
                </h3>
              </div>

              {filteredPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: '#64748b' }}>No payment records found.</p>
                </div>
              ) : (
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem' }}>Payment Date</th>
                      <th style={{ padding: '1rem' }}>Invoice #</th>
                      <th style={{ padding: '1rem' }}>Customer</th>
                      <th style={{ padding: '1rem' }}>Amount</th>
                      <th style={{ padding: '1rem' }}>Payment Method</th>
                      <th style={{ padding: '1rem' }}>Reference</th>
                      <th style={{ padding: '1rem' }}>Notes</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', color: '#334155' }}>
                          {new Date(p.payment_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '700', color: '#0A2540' }}>
                          {p.invoice_number}
                        </td>
                        <td style={{ padding: '1rem' }}>{p.customer_name}</td>
                        <td style={{ padding: '1rem', color: '#16a34a', fontWeight: '800' }}>
                          ${p.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {getPaymentMethodBadge(p.payment_method)}
                        </td>
                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#635BFF' }}>
                          {p.transaction_reference || '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.88rem', maxWidth: '240px' }}>
                          {p.notes || '-'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: SETTLED INVOICES */}
          {activeTab === 'paid' && (
            <div className="data-table-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0A2540' }}>
                  Settled Invoices Archive
                </h3>
              </div>

              {filteredPaid.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: '#64748b' }}>No settled invoices yet.</p>
                </div>
              ) : (
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem' }}>Invoice #</th>
                      <th style={{ padding: '1rem' }}>Customer</th>
                      <th style={{ padding: '1rem' }}>Issued Date</th>
                      <th style={{ padding: '1rem' }}>Settled Date</th>
                      <th style={{ padding: '1rem' }}>Total Settled</th>
                      <th style={{ padding: '1rem' }}>Settlement Method</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaid.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: '700', color: '#0A2540' }}>
                          {inv.number}
                        </td>
                        <td style={{ padding: '1rem' }}>{inv.customer_name}</td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {inv.date_issued ? new Date(inv.date_issued).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#16a34a', fontWeight: '600' }}>
                          {inv.settled_date ? new Date(inv.settled_date).toLocaleDateString() : 'Settled'}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '800', color: '#16a34a' }}>
                          ${inv.total_amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {getPaymentMethodBadge(inv.payment_method)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.82rem',
                            fontWeight: '700'
                          }}>
                            PAID
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* STRIPE PAYMENT GATEWAY MODAL */}
      {stripeModalData.isOpen && (
        <StripePaymentModal
          isOpen={stripeModalData.isOpen}
          onClose={() => setStripeModalData({ isOpen: false, invoice: null, amount: 0 })}
          invoice={stripeModalData.invoice}
          amount={stripeModalData.amount}
          customerName={stripeModalData.invoice?.customer_name}
          onSuccess={() => {
            loadAllData();
          }}
        />
      )}

      {/* MANUAL REGISTER PAYMENT MODAL */}
      {showManualModal && (
        <div className="modal-overlay" onClick={handleCloseManualModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', borderRadius: '18px' }}>
            <div className="modal-header">
              <h2>Register Payment Settlement</h2>
              <button className="modal-close" onClick={handleCloseManualModal}>×</button>
            </div>
            
            <form onSubmit={handleManualSubmit}>
              <div className="form-grid">
                
                {/* Invoice Selector */}
                <div className="form-group full-width">
                  <label>Select Invoice to Settle *</label>
                  <select
                    value={formData.invoice_id}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const inv = outstandingInvoices.find(i => i.id === parseInt(selId));
                      setFormData({
                        ...formData,
                        invoice_id: selId,
                        amount: inv ? inv.balance_outstanding.toString() : formData.amount,
                        notes: inv ? `Settlement for invoice ${inv.number}` : formData.notes
                      });
                    }}
                    required
                  >
                    <option value="">-- Choose Outstanding Invoice --</option>
                    {outstandingInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.number} - {inv.customer_name} (Due: ${inv.balance_outstanding.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Field 1: Payment Method */}
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    required
                  >
                    <option value="stripe">Stripe Gateway</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="paypal">PayPal</option>
                    <option value="upi">UPI / QR Code</option>
                  </select>
                </div>

                {/* Payment Field 2: Amount */}
                <div className="form-group">
                  <label>Settlement Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Payment Field 3: Payment Date */}
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                  />
                </div>

                {/* Reference ID */}
                <div className="form-group">
                  <label>Transaction Reference</label>
                  <input
                    type="text"
                    value={formData.transaction_reference}
                    onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                    placeholder="e.g. TXN-928174 / ch_stripe_..."
                  />
                </div>

                {/* Payment Field 4: Notes */}
                <div className="form-group full-width">
                  <label>Settlement Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional settlement remarks or client reference"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseManualModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#0A2540' }}>
                  Confirm Payment Settlement
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
