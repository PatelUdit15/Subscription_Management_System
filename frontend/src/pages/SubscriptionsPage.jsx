import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

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

  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
      sent: { bg: '#dbeafe', color: '#1e40af', label: 'Quotation Sent' },
      confirmed: { bg: '#d1fae5', color: '#065f46', label: 'Confirmed' },
      active: { bg: '#dcfce7', color: '#166534', label: 'Active' },
      paused: { bg: '#fef3c7', color: '#92400e', label: 'Paused' },
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

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Quicksand, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Gabarito, sans-serif',
            fontSize: '2rem',
            color: '#18181b',
            marginBottom: '0.5rem'
          }}>
            Subscriptions
          </h1>
          <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
            Manage customer subscriptions and recurring billing
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => navigate('/admin/subscriptions/new')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#18181b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#27272a'}
            onMouseLeave={(e) => e.target.style.background = '#18181b'}
          >
            <span>+</span> New Subscription
          </button>
        </div>
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
        alignItems: 'center'
      }}>
        <button
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
          📋 Export
        </button>
        <button
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
          placeholder="Search subscriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            width: '300px',
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
                  checked={selectedItems.length === subscriptions.length && subscriptions.length > 0}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '0.85rem',
                color: '#6b7280'
              }}>
                Number
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '0.85rem',
                color: '#6b7280'
              }}>
                Customer
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '0.85rem',
                color: '#6b7280'
              }}>
                Next Invoice
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '0.85rem',
                color: '#6b7280'
              }}>
                Recurring
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '0.85rem',
                color: '#6b7280'
              }}>
                Plan
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '0.85rem',
                color: '#6b7280'
              }}>
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
                      Create your first subscription to get started
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
                      ? new Date(subscription.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'N/A'}
                  </td>
                  <td style={{ padding: '1rem', color: '#18181b', fontWeight: '600' }}>
                    ${subscription.recurring_amount?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{ padding: '1rem', color: '#18181b' }}>
                    {subscription.plan_name || 'Monthly'}
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
