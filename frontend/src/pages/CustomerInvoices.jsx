import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import StripePaymentModal from '../components/StripePaymentModal';
import { useAuth } from '../context/AuthContext';

const CustomerInvoices = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [stripeInvoice, setStripeInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/my/invoices');
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') {
      return (
        <span style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '0.3rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: '700',
          textTransform: 'capitalize'
        }}>
          ✓ Paid
        </span>
      );
    }
    if (s === 'posted' || s === 'open' || s === 'pending') {
      return (
        <span style={{
          background: '#fef3c7',
          color: '#b45309',
          padding: '0.3rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: '700',
          textTransform: 'capitalize'
        }}>
          ● Due / Unpaid
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span style={{
          background: '#fee2e2',
          color: '#b91c1c',
          padding: '0.3rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: '700',
          textTransform: 'capitalize'
        }}>
          Cancelled
        </span>
      );
    }
    return (
      <span style={{
        background: '#f3f4f6',
        color: '#4b5563',
        padding: '0.3rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: '700',
        textTransform: 'capitalize'
      }}>
        {status || 'Draft'}
      </span>
    );
  };

  // Metrics
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalDue = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + (inv.balance_outstanding !== undefined ? inv.balance_outstanding : (inv.total_amount || 0)), 0);

  // Filtered
  const filteredInvoices = invoices.filter(inv => {
    const s = (inv.status || '').toLowerCase();
    const matchesFilter =
      statusFilter === 'all' ? true :
      statusFilter === 'paid' ? s === 'paid' :
      statusFilter === 'unpaid' ? (s === 'posted' || s === 'open' || s === 'pending') :
      s === statusFilter;

    const matchesSearch =
      (inv.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{
      fontFamily: 'Quicksand, sans-serif',
      background: '#F6F6F6',
      minHeight: '100vh',
      paddingBottom: '4rem'
    }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #875A7B 0%, #A6789C 100%)',
        padding: '3rem 2rem 4rem',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                padding: '0.3rem 0.9rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '700',
                marginBottom: '0.75rem'
              }}>
                📄 Billing & Invoices
              </div>
              <h1 style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '2.5rem',
                fontWeight: '700',
                margin: '0 0 0.5rem'
              }}>
                My Invoices
              </h1>
              <p style={{ opacity: 0.9, fontSize: '1.05rem', margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>
                View your complete invoice history, download printable statements, and settle outstanding balances securely with Stripe.
              </p>
            </div>

            <button
              onClick={() => navigate('/shop')}
              style={{
                padding: '0.75rem 1.75rem',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '700',
                fontFamily: 'Quicksand, sans-serif',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            >
              ← Back to Shop
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '-2rem auto 0', padding: '0 2rem' }}>
        {/* Metric Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {/* Total Invoices */}
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid #EADBE7',
            boxShadow: '0 4px 16px rgba(46, 46, 46, 0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6B6B6B', fontSize: '0.88rem', fontWeight: '600' }}>Total Invoices</span>
              <span style={{ fontSize: '1.25rem' }}>📑</span>
            </div>
            <div style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '1.9rem',
              fontWeight: '700',
              color: '#2E2E2E'
            }}>
              {invoices.length}
            </div>
          </div>

          {/* Total Billed */}
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid #EADBE7',
            boxShadow: '0 4px 16px rgba(46, 46, 46, 0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6B6B6B', fontSize: '0.88rem', fontWeight: '600' }}>Total Billed</span>
              <span style={{ fontSize: '1.25rem' }}>💳</span>
            </div>
            <div style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '1.9rem',
              fontWeight: '700',
              color: '#875A7B'
            }}>
              ₹{totalBilled.toFixed(2)}
            </div>
          </div>

          {/* Paid */}
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid #EADBE7',
            boxShadow: '0 4px 16px rgba(46, 46, 46, 0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6B6B6B', fontSize: '0.88rem', fontWeight: '600' }}>Settled / Paid</span>
              <span style={{ fontSize: '1.25rem' }}>✅</span>
            </div>
            <div style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '1.9rem',
              fontWeight: '700',
              color: '#16a34a'
            }}>
              ₹{totalPaid.toFixed(2)}
            </div>
          </div>

          {/* Outstanding Due */}
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid #EADBE7',
            boxShadow: '0 4px 16px rgba(46, 46, 46, 0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6B6B6B', fontSize: '0.88rem', fontWeight: '600' }}>Balance Due</span>
              <span style={{ fontSize: '1.25rem' }}>⏳</span>
            </div>
            <div style={{
              fontFamily: 'Gabarito, sans-serif',
              fontSize: '1.9rem',
              fontWeight: '700',
              color: totalDue > 0 ? '#d97706' : '#16a34a'
            }}>
              ₹{totalDue.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div style={{
          background: 'white',
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #EADBE7',
          boxShadow: '0 2px 8px rgba(46, 46, 46, 0.04)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Invoices' },
              { id: 'unpaid', label: 'Due / Unpaid' },
              { id: 'paid', label: 'Paid' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.5rem 1.1rem',
                  background: statusFilter === tab.id ? '#875A7B' : '#F6F6F6',
                  color: statusFilter === tab.id ? 'white' : '#6B6B6B',
                  border: '1px solid',
                  borderColor: statusFilter === tab.id ? '#875A7B' : '#EADBE7',
                  borderRadius: '20px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ minWidth: '240px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#875A7B' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                background: '#F6F6F6',
                border: '1.5px solid #EADBE7',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontFamily: 'Quicksand, sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#875A7B'}
              onBlur={(e) => e.target.style.borderColor = '#EADBE7'}
            />
          </div>
        </div>

        {/* Invoices List / Table */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #EADBE7',
          boxShadow: '0 4px 16px rgba(46, 46, 46, 0.05)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#875A7B' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Loading invoices...</div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📄</div>
              <h3 style={{
                fontFamily: 'Gabarito, sans-serif',
                fontSize: '1.4rem',
                color: '#2E2E2E',
                marginBottom: '0.5rem'
              }}>
                No Invoices Found
              </h3>
              <p style={{ color: '#6B6B6B', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
                {invoices.length === 0
                  ? "You don't have any invoices yet. Invoices are automatically generated when you purchase a subscription or product."
                  : "No invoices match your selected filter criteria."}
              </p>
              {invoices.length === 0 && (
                <button
                  onClick={() => navigate('/shop')}
                  style={{
                    padding: '0.8rem 2rem',
                    background: '#875A7B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Explore Shop Products
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FDFBFC', borderBottom: '2px solid #EADBE7' }}>
                    <th style={{ padding: '1.1rem 1.5rem', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Invoice</th>
                    <th style={{ padding: '1.1rem 1.5rem', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Issue Date</th>
                    <th style={{ padding: '1.1rem 1.5rem', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Due Date</th>
                    <th style={{ padding: '1.1rem 1.5rem', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Total Amount</th>
                    <th style={{ padding: '1.1rem 1.5rem', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '1.1rem 1.5rem', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv, idx) => (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom: idx === filteredInvoices.length - 1 ? 'none' : '1px solid #F0E8EF',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FAF7F9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{
                          fontFamily: 'Gabarito, sans-serif',
                          fontWeight: '700',
                          color: '#875A7B',
                          fontSize: '1.05rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span>📄</span>
                          <span>{inv.number || `INV-#${inv.id}`}</span>
                        </div>
                        {inv.subscription_id && (
                          <span style={{ fontSize: '0.78rem', color: '#6B6B6B' }}>
                            Sub #{inv.subscription_id}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1.25rem 1.5rem', color: '#2E2E2E', fontSize: '0.92rem' }}>
                        {inv.date_issued ? new Date(inv.date_issued).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '—'}
                      </td>

                      <td style={{ padding: '1.25rem 1.5rem', color: '#2E2E2E', fontSize: '0.92rem' }}>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '—'}
                      </td>

                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{
                          fontFamily: 'Gabarito, sans-serif',
                          fontSize: '1.15rem',
                          fontWeight: '700',
                          color: '#2E2E2E'
                        }}>
                          ₹{(inv.total_amount || 0).toFixed(2)}
                        </div>
                        {inv.status !== 'paid' && inv.balance_outstanding !== undefined && (
                          <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: '600' }}>
                            Due: ₹{inv.balance_outstanding.toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {getStatusBadge(inv.status)}
                      </td>

                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => setStripeInvoice(inv)}
                              style={{
                                padding: '0.5rem 0.9rem',
                                background: 'linear-gradient(135deg, #635BFF 0%, #0A2540 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                fontFamily: 'Quicksand, sans-serif',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                boxShadow: '0 2px 8px rgba(99, 91, 255, 0.25)'
                              }}
                            >
                              <span>⚡</span> Pay with Stripe
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            style={{
                              padding: '0.5rem 0.85rem',
                              background: '#F6F6F6',
                              color: '#875A7B',
                              border: '1.5px solid #EADBE7',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              fontFamily: 'Quicksand, sans-serif',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#875A7B';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.borderColor = '#875A7B';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#F6F6F6';
                              e.currentTarget.style.color = '#875A7B';
                              e.currentTarget.style.borderColor = '#EADBE7';
                            }}
                          >
                            <span>👁️</span> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Document Modal */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            {/* Modal Header Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #EADBE7',
              paddingBottom: '1.25rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.8rem' }}>📄</span>
                <div>
                  <h2 style={{
                    fontFamily: 'Gabarito, sans-serif',
                    fontSize: '1.6rem',
                    color: '#2E2E2E',
                    margin: 0
                  }}>
                    Invoice {selectedInvoice.number || `#${selectedInvoice.id}`}
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>
                    SubscriptionFlow Customer Invoice
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#F6F6F6',
                    border: '1.5px solid #EADBE7',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: '#2E2E2E'
                  }}
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: '#6B6B6B',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
              background: '#FBF9FA',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #EADBE7'
            }}>
              <div>
                <span style={{ color: '#6B6B6B', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>Billed To:</span>
                <div style={{ fontWeight: '700', color: '#2E2E2E', fontSize: '1.05rem', marginTop: '0.25rem' }}>
                  {currentUser?.name || selectedInvoice.customer_name || 'Valued Customer'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>
                  {currentUser?.email}
                </div>
              </div>

              <div>
                <span style={{ color: '#6B6B6B', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>Issue Date:</span>
                <div style={{ fontWeight: '700', color: '#2E2E2E', marginTop: '0.25rem' }}>
                  {selectedInvoice.date_issued ? new Date(selectedInvoice.date_issued).toLocaleDateString() : '—'}
                </div>
              </div>

              <div>
                <span style={{ color: '#6B6B6B', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>Due Date:</span>
                <div style={{ fontWeight: '700', color: '#2E2E2E', marginTop: '0.25rem' }}>
                  {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : '—'}
                </div>
              </div>

              <div>
                <span style={{ color: '#6B6B6B', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>Status:</span>
                <div style={{ marginTop: '0.25rem' }}>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
              </div>
            </div>

            {/* Invoice Line Items */}
            <div style={{ marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #EADBE7' }}>
                    <th style={{ padding: '0.75rem 0', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700' }}>Description</th>
                    <th style={{ padding: '0.75rem 0', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.75rem 0', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '0.75rem 0', color: '#6B6B6B', fontSize: '0.85rem', fontWeight: '700', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lines && selectedInvoice.lines.length > 0 ? (
                    selectedInvoice.lines.map((line, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F0E8EF' }}>
                        <td style={{ padding: '1rem 0', color: '#2E2E2E', fontWeight: '600' }}>
                          {line.product_name || `Line Item #${idx + 1}`}
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'center', color: '#6B6B6B' }}>
                          {line.quantity || 1}
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right', color: '#6B6B6B' }}>
                          ₹{(line.unit_price || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: '700', color: '#2E2E2E' }}>
                          ₹{(line.subtotal || (line.quantity * line.unit_price) || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr style={{ borderBottom: '1px solid #F0E8EF' }}>
                      <td style={{ padding: '1rem 0', color: '#2E2E2E', fontWeight: '600' }}>
                        Subscription Recurring Service Fee
                      </td>
                      <td style={{ padding: '1rem 0', textAlign: 'center', color: '#6B6B6B' }}>1</td>
                      <td style={{ padding: '1rem 0', textAlign: 'right', color: '#6B6B6B' }}>
                        ₹{(selectedInvoice.total_amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: '700', color: '#2E2E2E' }}>
                        ₹{(selectedInvoice.total_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Breakdown */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '2rem'
            }}>
              <div style={{ width: '280px', borderTop: '2px solid #EADBE7', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#6B6B6B', fontSize: '0.95rem' }}>
                  <span>Subtotal:</span>
                  <span>₹{((selectedInvoice.total_amount || 0) / 1.18).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#1e40af', fontSize: '0.95rem' }}>
                  <span>Tax (GST 18%):</span>
                  <span>+₹{((selectedInvoice.total_amount || 0) - ((selectedInvoice.total_amount || 0) / 1.18)).toFixed(2)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px solid #875A7B',
                  paddingTop: '0.75rem',
                  color: '#875A7B',
                  fontWeight: '700',
                  fontSize: '1.3rem',
                  fontFamily: 'Gabarito, sans-serif'
                }}>
                  <span>Total Amount:</span>
                  <span>₹{(selectedInvoice.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Pay Button inside modal if not paid */}
            {selectedInvoice.status !== 'paid' && (
              <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #EADBE7' }}>
                <button
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    setStripeInvoice(inv);
                  }}
                  style={{
                    padding: '0.9rem 2.5rem',
                    background: 'linear-gradient(135deg, #635BFF 0%, #0A2540 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    fontFamily: 'Quicksand, sans-serif',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    boxShadow: '0 4px 16px rgba(99, 91, 255, 0.35)'
                  }}
                >
                  <span>⚡</span> Settle Invoice with Stripe Gateway
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stripe Payment Modal */}
      {stripeInvoice && (
        <StripePaymentModal
          isOpen={!!stripeInvoice}
          onClose={() => {
            setStripeInvoice(null);
            fetchInvoices();
          }}
          invoice={stripeInvoice}
          customerName={currentUser?.name || stripeInvoice.customer_name}
          isCustomerPortal={true}
        />
      )}
    </div>
  );
};

export default CustomerInvoices;
