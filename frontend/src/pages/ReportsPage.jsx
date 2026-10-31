import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import '../pages/TaxesPage.css';

const ReportsPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, invoices]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      setInvoices(response.data);
      setFilteredInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(inv => 
        new Date(inv.date_issued) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(inv => 
        new Date(inv.date_issued) <= new Date(filters.endDate)
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(inv => inv.status === filters.status);
    }

    setFilteredInvoices(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Invoice Number', 'Customer', 'Date Issued', 'Due Date', 'Amount', 'Status'];
    const rows = filteredInvoices.map(inv => [
      inv.number,
      inv.customer_name,
      new Date(inv.date_issued).toLocaleDateString(),
      new Date(inv.due_date).toLocaleDateString(),
      inv.total_amount.toFixed(2),
      inv.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTotalAmount = () => {
    return filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: '#f4f4f5', color: '#52525b' },
      posted: { bg: '#fef3c7', color: '#92400e' },
      paid: { bg: '#dcfce7', color: '#166534' },
      cancelled: { bg: '#fee2e2', color: '#991b1b' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span style={{
        background: badge.bg,
        color: badge.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: '600'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Filter and export invoice data for analysis</p>
        </div>
        <button className="btn-primary" onClick={exportToCSV}>
          📊 Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="data-table-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>Filters</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setFilters({ startDate: '', endDate: '', status: 'all' })}
              style={{ width: '100%' }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ color: '#71717a', fontSize: '0.9rem' }}>Showing </span>
            <span style={{ fontWeight: '600', color: '#18181b' }}>{filteredInvoices.length}</span>
            <span style={{ color: '#71717a', fontSize: '0.9rem' }}> of {invoices.length} invoices</span>
          </div>
          <div>
            <span style={{ color: '#71717a', fontSize: '0.9rem' }}>Total Amount: </span>
            <span style={{ fontWeight: '700', color: '#22c55e', fontSize: '1.25rem' }}>
              ${getTotalAmount().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="loading">Loading invoices...</div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Customer</th>
                <th>Date Issued</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td className="font-semibold">{invoice.number}</td>
                  <td>{invoice.customer_name}</td>
                  <td>{new Date(invoice.date_issued).toLocaleDateString()}</td>
                  <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td className="font-semibold">${invoice.total_amount.toFixed(2)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#71717a'
            }}>
              No invoices match the selected filters
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
