import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import '../pages/TaxesPage.css';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeSubscriptions: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await axios.get(`/customers/${id}`);
      setCustomer(response.data);
      // In a real app, you'd fetch these stats from the backend
      setStats({
        totalOrders: 0,
        activeSubscriptions: 0,
        totalSpent: 0
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="loading">Loading...</div></div>;
  }

  if (!customer) {
    return <div className="page-container"><div className="loading">Customer not found</div></div>;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate('/admin')}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              fontFamily: 'Quicksand, sans-serif'
            }}
          >
            ← Back to Customers
          </button>
          <h1 className="page-title">{customer.name}</h1>
          <p className="page-subtitle">{customer.company_name || 'Individual Customer'}</p>
        </div>
      </div>

      {/* Contact Card */}
      <div className="data-table-container" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>Contact Information</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Email</div>
            <div style={{ fontWeight: '600' }}>{customer.email}</div>
          </div>
          <div>
            <div style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Phone</div>
            <div style={{ fontWeight: '600' }}>{customer.phone || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '0.25rem' }}>GST Number</div>
            <div style={{ fontWeight: '600' }}>{customer.gst_number || '-'}</div>
          </div>
          {customer.address && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Address</div>
              <div style={{ fontWeight: '600', whiteSpace: 'pre-line' }}>{customer.address}</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #714B67 0%, #875A7B 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(135, 90, 123, 0.15)'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Orders</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif' }}>
            {stats.totalOrders}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #875A7B 0%, #A6789C 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(135, 90, 123, 0.15)'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Active Subscriptions</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif' }}>
            {stats.activeSubscriptions}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(135, 90, 123, 0.15)'
        }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Spent</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif' }}>
            ${stats.totalSpent.toFixed(2)}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="data-table-container">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>Transaction History</h3>
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#71717a'
        }}>
          No transactions yet. Quotations and invoices will appear here.
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
