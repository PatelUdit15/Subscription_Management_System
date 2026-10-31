import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../pages/TaxesPage.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_outstanding: 0,
    overdue_count: 0,
    overdue_amount: 0,
    overdue_invoices: [],
    mrr: 0,
    active_subscriptions: 0,
    total_customers: 0,
    monthly_growth: 0,
    revenue_by_month: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return <div className="page-container" style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>Loading executive analytics...</div>;
  }

  return (
    <div className="page-container" style={{ fontFamily: 'Quicksand, sans-serif' }}>
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <h1 className="page-title" style={{ margin: 0, fontSize: '1.85rem' }}>Executive Finance Dashboard</h1>
        <p style={{ color: '#71717a', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
          One place to see active subscriptions, recurring revenue, payments received, and overdue receivables.
        </p>
      </div>

      {/* Primary KPI Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        {/* Total Cash Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '14px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/admin/payments')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.75rem' }}>💰</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Cash In</span>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.75rem' }}>Total Cash Revenue</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif', marginTop: '0.25rem' }}>
            {formatCurrency(stats.total_revenue)}
          </div>
        </div>

        {/* Monthly Recurring Revenue (MRR) */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '14px',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/admin/subscriptions')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.75rem' }}>🔄</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>MRR</span>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.75rem' }}>Monthly Recurring Rev.</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif', marginTop: '0.25rem' }}>
            {formatCurrency(stats.mrr)}
          </div>
        </div>

        {/* Total Outstanding (Still Owed) */}
        <div style={{
          background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '14px',
          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/admin/invoices')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.75rem' }}>⏳</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Unpaid</span>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.75rem' }}>Total Still Owed</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif', marginTop: '0.25rem' }}>
            {formatCurrency(stats.total_outstanding)}
          </div>
        </div>

        {/* Overdue Receivables Alert */}
        <div style={{
          background: stats.overdue_count > 0 ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
          color: 'white',
          padding: '1.25rem',
          borderRadius: '14px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/admin/invoices')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.75rem' }}>⚠️</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              {stats.overdue_count} Overdue
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.75rem' }}>Overdue Invoices</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif', marginTop: '0.25rem' }}>
            {formatCurrency(stats.overdue_amount)}
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#71717a' }}>Active Subscriptions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#18181b', marginTop: '0.25rem' }}>
            {stats.active_subscriptions}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#71717a' }}>Total Customers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#18181b', marginTop: '0.25rem' }}>
            {stats.total_customers}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#71717a' }}>New Quotes Won This Month</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a', marginTop: '0.25rem' }}>
            +{stats.monthly_growth}
          </div>
        </div>
      </div>

      {/* Overdue Invoices Alert Chasing Table */}
      {stats.overdue_invoices && stats.overdue_invoices.length > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #fecaca',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🚨</span> Overdue Invoices Needing Attention ({stats.overdue_count})
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#71717a', fontSize: '0.85rem' }}>
                Prioritized by oldest due date so finance can chase before they turn into lost revenue.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/invoices')}
              style={{
                padding: '0.45rem 0.9rem',
                background: '#fee2e2',
                color: '#991b1b',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              View All Invoices →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#991b1b', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Invoice</th>
                <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.75rem 1rem' }}>Due Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Days Overdue</th>
                <th style={{ padding: '0.75rem 1rem' }}>Balance Owed</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.overdue_invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{inv.number}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{inv.customer_name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#71717a' }}>{inv.due_date}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ color: '#dc2626', fontWeight: '700', background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {inv.days_overdue} days
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#18181b' }}>
                    ₹{inv.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate('/admin/invoices')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: '#18181b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      Collect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revenue Chart */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e4e4e7'
      }}>
        <h2 style={{
          fontFamily: 'Gabarito, sans-serif',
          fontSize: '1.35rem',
          color: '#18181b',
          margin: '0 0 1.5rem 0'
        }}>
          Cash Revenue History (Last 6 Months)
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats.revenue_by_month}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis 
              dataKey="month" 
              stroke="#71717a"
              style={{ fontFamily: 'Quicksand, sans-serif', fontSize: '0.85rem' }}
            />
            <YAxis 
              stroke="#71717a"
              style={{ fontFamily: 'Quicksand, sans-serif', fontSize: '0.85rem' }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              formatter={(value) => `₹${Number(value).toLocaleString()}`}
              contentStyle={{
                background: 'white',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                fontFamily: 'Quicksand, sans-serif'
              }}
            />
            <Bar 
              dataKey="revenue" 
              fill="#18181b"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
