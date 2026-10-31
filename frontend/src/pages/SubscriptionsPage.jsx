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
        message: `Billing Day Complete: ${data.invoices_created} invoices generated, ${data.subscriptions_closed || 0} subscriptions auto-closed. ${data.skipped_invoices_existing || 0} already billed.`
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
      draft: { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
      sent: { bg: '#dbeafe', color: '#1e40af', label: 'Quotation Sent' },
      confirmed: { bg: '#d1fae5', color: '#065f46', label: 'Confirmed' },
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
        padding: '0.25rem 0.75rem',
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
    <div style={{ padding: '2rem', fontFamily: 'Quicksand, sans-serif' }}>
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
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '2rem',
            color: '#18181b',
            margin: '0 0 0.5rem 0'
          }}>
            Subscriptions
          </h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem', margin: 0 }}>
            Manage customer subscriptions, plan terms, and recurring billing cycles
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleRunBillingDay}
            disabled={billingLoading}
            style={{
              padding: '0.75rem 1.25rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: billingLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <span>⚡</span> {billingLoading ? 'Processing...' : 'Run Billing Day'}
          </button>

          <button
            onClick={() => navigate('/admin/subscriptions/new')}
            style={{
              padding: '0.75rem 1.25rem',
              background: '#18181b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
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
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
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
              border: '1px solid',
              borderColor: statusFilter === tab.key ? '#18181b' : '#e4e4e7',
              background: statusFilter === tab.key ? '#18181b' : '#fff',
              color: statusFilter === tab.key ? '#fff' : '#52525b',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
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
        borderRadius: '12px 12px 0 0',
        border: '1px solid #e5e7eb',
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
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          📋 Export CSV
        </button>
        <button
          onClick={() => window.print()}
          style={{
            padding: '0.5rem 1rem',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500'
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
            padding: '0.5rem 1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            width: '280px',
            fontSize: '0.9rem'
          }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        borderRadius: '0 0 12px 12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '0.85rem',
                color: '#6b7280',
                width: '50px'
              }}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedItems.length === filteredSubscriptions.length && filteredSubscriptions.length > 0}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#6b7280' }}>
                Number
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#6b7280' }}>
                Customer
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#6b7280' }}>
                Next Billing Date
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#6b7280' }}>
                Recurring Amount
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#6b7280' }}>
                Plan
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#6b7280' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>
                  Loading subscriptions...
                </td>
              </tr>
            ) : filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ color: '#71717a' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
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
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(subscription.id)}
                      onChange={() => handleSelectItem(subscription.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '600', color: '#18181b' }}>
                    {subscription.number || `S${String(subscription.id).padStart(4, '0')}`}
                  </td>
                  <td style={{ padding: '1rem', color: '#18181b' }}>
                    {subscription.customer_name || 'N/A'}
                  </td>
                  <td style={{ padding: '1rem', color: '#18181b' }}>
                    {subscription.next_billing_date 
                      ? new Date(subscription.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </td>
                  <td style={{ padding: '1rem', color: '#18181b', fontWeight: '600' }}>
                    ₹{(subscription.recurring_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '1rem', color: '#18181b' }}>
                    {subscription.plan_name || 'Standard'}
                  </td>
                  <td style={{ padding: '1rem' }}>
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
