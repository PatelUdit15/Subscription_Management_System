import React, { useState } from 'react';
import axios from '../api/axios';

const PaymentQRCode = ({ amount, orderData, onSuccess, onCancel }) => {
  const [confirming, setConfirming] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const handleConfirmPayment = async () => {
    if (!transactionId.trim()) {
      alert('Please enter transaction ID or reference number');
      return;
    }

    setConfirming(true);

    try {
      // Call backend to create order with manual payment confirmation
      const response = await axios.post('/payment/manual-confirm', {
        ...orderData,
        transaction_reference: transactionId,
        amount: amount
      });

      if (response.data.success) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      alert(error.response?.data?.detail || 'Failed to confirm payment. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      maxWidth: '500px',
      margin: '0 auto',
      fontFamily: 'Quicksand, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: 'Gabarito, sans-serif',
          fontSize: '1.75rem',
          marginBottom: '0.5rem',
          color: '#18181b'
        }}>
          Scan to Pay
        </h2>
        <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
          Use any UPI app (GPay, PhonePe, Paytm)
        </p>
      </div>

      {/* Amount Display */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
          Amount to Pay
        </div>
        <div style={{
          fontFamily: 'Gabarito, sans-serif',
          fontSize: '3rem',
          fontWeight: '700'
        }}>
          ${amount.toFixed(2)}
        </div>
      </div>

      {/* QR Code - Your Static QR */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        background: '#f9fafb',
        borderRadius: '12px'
      }}>
        <img 
          src="/payment-qr.png" 
          alt="Payment QR Code"
          style={{
            width: '256px',
            height: '256px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb'
          }}
          onError={(e) => {
            // Fallback if image not found
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <div style="
                width: 256px;
                height: 256px;
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                gap: 1rem;
              ">
                <div style="font-size: 4rem;">📱</div>
                <div style="
                  font-size: 0.85rem;
                  color: #71717a;
                  text-align: center;
                  padding: 0 1rem;
                ">
                  Place your QR code image at<br/>
                  <code>frontend/public/payment-qr.png</code>
                </div>
              </div>
            `;
          }}
        />
      </div>

      {/* Instructions */}
      <div style={{
        background: '#f9fafb',
        padding: '1.5rem',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#52525b',
        marginBottom: '1.5rem'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.75rem' }}>
          How to pay:
        </div>
        <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
          <li>Open GPay, PhonePe, or any UPI app</li>
          <li>Scan the QR code above</li>
          <li>Enter amount: ${amount.toFixed(2)}</li>
          <li>Complete the payment</li>
          <li>Enter transaction ID below and confirm</li>
        </ol>
      </div>

      {/* Transaction ID Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: '#18181b'
        }}>
          Transaction ID / Reference Number
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter transaction ID from payment app"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontFamily: 'Quicksand, sans-serif',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#18181b'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
        <div style={{
          fontSize: '0.8rem',
          color: '#71717a',
          marginTop: '0.5rem'
        }}>
          You'll find this in your payment app after completing the transaction
        </div>
      </div>

      {/* UPI Apps */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #e5e7eb',
        marginBottom: '1.5rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📱</div>
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>GPay</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>💳</div>
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>PhonePe</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>💰</div>
          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Paytm</div>
        </div>
      </div>

      {/* Confirm Payment Button */}
      <button
        onClick={handleConfirmPayment}
        disabled={confirming || !transactionId.trim()}
        style={{
          width: '100%',
          padding: '1rem',
          background: (confirming || !transactionId.trim()) ? '#d4d4d8' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: (confirming || !transactionId.trim()) ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '1rem'
        }}
        onMouseEnter={(e) => {
          if (!confirming && transactionId.trim()) e.target.style.background = '#059669';
        }}
        onMouseLeave={(e) => {
          if (!confirming && transactionId.trim()) e.target.style.background = '#10b981';
        }}
      >
        {confirming ? '⏳ Confirming...' : '✓ I Have Paid - Confirm Order'}
      </button>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        disabled={confirming}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'white',
          color: '#71717a',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: confirming ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!confirming) e.target.style.borderColor = '#18181b';
        }}
        onMouseLeave={(e) => {
          if (!confirming) e.target.style.borderColor = '#e5e7eb';
        }}
      >
        Cancel Payment
      </button>
    </div>
  );
};

export default PaymentQRCode;
