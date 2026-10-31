import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../pages/TaxesPage.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_revenue: 0,
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Executive Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Total Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #0A4174 0%, #49769F 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 29, 57, 0.15)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif' }}>
            {formatCurrency(stats.total_revenue)}
          </div>
        </div>

        {/* Active Subscriptions */}
        <div style={{
          background: 'linear-gradient(135deg, #4E8EA2 0%, #6EA2B3 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 29, 57, 0.15)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Active Subscriptions</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif' }}>
            {stats.active_subscriptions}
          </div>
        </div>

        {/* Total Customers */}
        <div style={{
          background: 'linear-gradient(135deg, #7BBDE8 0%, #BDD8E9 100%)',
          color: '#001D39',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 29, 57, 0.15)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>Total Customers</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif' }}>
            {stats.total_customers}
          </div>
        </div>

        {/* Monthly Growth */}
        <div style={{
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 29, 57, 0.15)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Monthly Growth</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Gabarito, sans-serif' }}>
            {stats.monthly_growth} <span style={{ fontSize: '1rem' }}>new</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 29, 57, 0.08)'
      }}>
        <h2 style={{
          fontFamily: 'Gabarito, sans-serif',
          fontSize: '1.5rem',
          color: '#001D39',
          marginBottom: '1.5rem'
        }}>
          Revenue by Month
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.revenue_by_month}>
            <CartesianGrid strokeDasharray="3 3" stroke="#BDD8E9" />
            <XAxis 
              dataKey="month" 
              stroke="#49769F"
              style={{ fontFamily: 'Quicksand, sans-serif' }}
            />
            <YAxis 
              stroke="#49769F"
              style={{ fontFamily: 'Quicksand, sans-serif' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{
                background: 'white',
                border: '1px solid #BDD8E9',
                borderRadius: '8px',
                fontFamily: 'Quicksand, sans-serif'
              }}
            />
            <Bar 
              dataKey="revenue" 
              fill="#0A4174"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
