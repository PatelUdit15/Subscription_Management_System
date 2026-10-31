import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBillingDay = async () => {
    if (!window.confirm('Run Billing Day engine now?\n\nThis will automatically:\n1. Check all active/confirmed subscriptions with billing due today\n2. Generate posted invoices with calculated taxes & discount rules\n3. Advance next billing dates according to recurring plan frequency\n4. Auto-close expired subscriptions if plan dictates\n5. Prevent any double billing')) {
      return;
    }

    try {
      setBillingLoading(true);
      const res = await axios.post('/subscriptions/run-billing-day');
      const data = res.data;
      setBanner({
        type: 'success',
        message: `Billing Day Complete: ${data.invoices_created} invoices generated, ${data.subscriptions_closed || 0} subscriptions auto-closed. ${data.skipped_count || 0} skipped.`
      });
      fetchSubscriptions();
      setTimeout(() => setBanner(null), 6000);
    } catch (err) {
      setBanner({
        type: 'error',
        message: 'Failed to run billing day: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: { bg: '#f4f4f5', color: '#52525b', label: 'Draft' },
      sent: { bg: '#f3e8ff', color: '#7c3aed', label: 'Quotation Sent' },
      confirmed: { bg: 'var(--color-accent-light)', color: 'var(--color-primary-dark)', label: 'Confirmed' },
      active: { bg: '#dcfce7', color: '#166534', label: 'Active' },
      paused: { bg: '#fef3c7', color: '#92400e', label: 'Paused' },
      closed: { bg: '#f1f5f9', color: '#475569', label: 'Closed' },
      cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
      churned: { bg: '#fecaca', color: '#7f1d1d', label: 'Churned' },
      expired: { bg: '#e5e7eb', color: '#374151', label: 'Expired' }
    };

    const style = statusStyles[status] || statusStyles.draft;

    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '0.3rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {style.label}
      </span>
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(subscriptions.map(sub => sub.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Number', 'Customer', 'Plan', 'Next Billing Date', 'Recurring Amount', 'Status'];
    const rows = filteredSubscriptions.map(s => [
      s.id,
      s.number || `S${String(s.id).padStart(4, '0')}`,
      `"${s.customer_name || 'N/A'}"`,
      s.plan_name || 'Standard',
      s.next_billing_date || 'N/A',
      s.recurring_amount || 0,
      s.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch =
      sub.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '2rem', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            color: 'var(--color-primary-dark)',
            margin: '0 0 0.5rem 0'
          }}>
            Subscriptions
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Manage customer subscriptions, plan terms, and recurring billing cycles
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
            onClick={() => navigate('/admin/subscriptions/new')}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'white',
              color: 'var(--color-primary-dark)',
              border: '2px solid var(--color-primary)',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-accent-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <span>+</span> New Subscription
          </button>
        </div>
      </div>

      {banner && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: banner.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: banner.type === 'success' ? '#15803d' : '#b91c1c',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>{banner.type === 'success' ? '✓' : '⚠️'}</span> {banner.message}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { key: 'all', label: 'All Subscriptions' },
          { key: 'active', label: 'Active' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'paused', label: 'Paused' },
          { key: 'closed', label: 'Closed' },
          { key: 'draft', label: 'Draft' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: '1.5px solid',
              borderColor: statusFilter === tab.key ? 'var(--color-primary)' : 'rgba(135, 90, 123, 0.2)',
              background: statusFilter === tab.key ? 'var(--color-primary)' : '#fff',
              color: statusFilter === tab.key ? '#fff' : 'var(--color-text-secondary)',
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

      {/* Toolbar */}
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '14px 14px 0 0',
        border: '1px solid rgba(135, 90, 123, 0.15)',
        borderBottom: 'none',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleExportCSV}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-bg-soft)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'var(--color-text-primary)'
          }}
        >
          📋 Export CSV
        </button>
        <button
          onClick={() => window.print()}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-bg-soft)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'var(--color-text-primary)'
          }}
        >
          🖨️ Print
        </button>
        <div style={{ flex: 1 }} />
        <input
          type="text"
          placeholder="Search number or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.55rem 1rem',
            border: '1.5px solid rgba(135, 90, 123, 0.2)',
            borderRadius: '8px',
            width: '280px',
            fontSize: '0.9rem',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(135, 90, 123, 0.2)'}
        />
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        borderRadius: '0 0 14px 14px',
        border: '1px solid rgba(135, 90, 123, 0.15)',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(135, 90, 123, 0.06)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
              color: 'white'
            }}>
              <th style={{
                padding: '0.9rem 1.25rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '0.85rem',
                width: '50px'
              }}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedItems.length === filteredSubscriptions.length && filteredSubscriptions.length > 0}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>
                Number
              </th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>
                Customer
              </th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>
                Next Billing Date
              </th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>
                Recurring Amount
              </th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>
                Plan
              </th>
              <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Loading subscriptions...
                </td>
              </tr>
            ) : filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-primary-dark)' }}>
                      No subscriptions found
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      No subscriptions match the selected criteria.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  onClick={() => navigate(`/admin/subscriptions/${subscription.id}`)}
                  style={{
                    borderBottom: '1px solid rgba(135, 90, 123, 0.08)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(234, 219, 231, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '0.9rem 1.25rem' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(subscription.id)}
                      onChange={() => handleSelectItem(subscription.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: '600', color: 'var(--color-primary-dark)' }}>
                    {subscription.number || `S${String(subscription.id).padStart(4, '0')}`}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-primary)' }}>
                    {subscription.customer_name || 'N/A'}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                    {subscription.next_billing_date 
                      ? new Date(subscription.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-primary-dark)', fontWeight: '700' }}>
                    ₹{(subscription.recurring_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-primary)' }}>
                    {subscription.plan_name || 'Standard'}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    {getStatusBadge(subscription.status)}
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

export default SubscriptionsPage;
