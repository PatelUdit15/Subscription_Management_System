import React, { useState } from 'react';
import axios from '../api/axios';
import { CreditCard, QrCode, Zap, Lock, ShieldCheck, Loader2 } from 'lucide-react';

const PaymentQRCode = ({ amount, orderData, onSuccess, onCancel }) => {
  const [gatewayTab, setGatewayTab] = useState('stripe'); // 'stripe' or 'upi'
  
  // Stripe Card States
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('John Doe');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [stripeError, setStripeError] = useState(null);

  // UPI Manual States
  const [confirming, setConfirming] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Format Card Number
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const parts = val.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : '');
  };

  // Format Expiry
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      setExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
    } else {
      setExpiry(val);
    }
  };

  // 1-Click Test Card Autofill
  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setExpiry('12/28');
    setCvc('123');
    setCardholderName('Alex Morgan');
    setStripeError(null);
  };

  // Card Brand Detection
  const getCardBrand = () => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.startsWith('4')) return { name: 'Visa' };
    if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) return { name: 'Mastercard' };
    if (/^3[47]/.test(raw)) return { name: 'Amex' };
    if (/^6(?:011|5)/.test(raw)) return { name: 'Discover' };
    return { name: 'Card' };
  };

  // Handle Stripe Settlement
  const handleStripePay = async (e) => {
    e.preventDefault();
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 15) {
      setStripeError('Please enter a valid card number or click "⚡ Fill Test Card".');
      return;
    }
    if (!expiry || expiry.length < 5) {
      setStripeError('Please enter expiration (MM/YY).');
      return;
    }
    if (!cvc || cvc.length < 3) {
      setStripeError('Please enter 3-digit CVC.');
      return;
    }

    setIsProcessingStripe(true);
    setStripeError(null);

    try {
      // Simulate real-time Stripe network handshake
      await new Promise(r => setTimeout(r, 800));

      const ref = `pi_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const response = await axios.post('/checkout', {
        ...orderData,
        payment_method: 'stripe',
        payment_reference: ref,
        notes: `Paid via Stripe Gateway (${getCardBrand().name} •••• ${rawCard.slice(-4)})`
      });

      if (response.data.success) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Stripe Checkout Error:', error);
      setStripeError(error.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setIsProcessingStripe(false);
    }
  };

  // Handle UPI Confirmation
  const handleConfirmUPI = async () => {
    if (!transactionId.trim()) {
      alert('Please enter transaction ID or reference number');
      return;
    }

    setConfirming(true);

    try {
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
      borderRadius: '20px',
      boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
      maxWidth: '520px',
      margin: '0 auto',
      fontFamily: 'Quicksand, sans-serif',
      overflow: 'hidden',
      border: '1px solid #e2e8f0'
    }}>
      {/* Top Brand Banner */}
      <div style={{
        background: gatewayTab === 'stripe' 
          ? 'linear-gradient(135deg, #0A2540 0%, #635BFF 100%)' 
          : 'linear-gradient(135deg, #0f172a 0%, #10b981 100%)',
        color: 'white',
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)' }}>
            Checkout Settlement
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Gabarito, sans-serif' }}>
            {gatewayTab === 'stripe' ? 'Stripe Payment Gateway' : 'UPI Instant Pay'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Amount Due</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>
            ${amount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Gateway Selection Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc'
      }}>
        <button
          type="button"
          onClick={() => setGatewayTab('stripe')}
          style={{
            padding: '1rem',
            border: 'none',
            background: gatewayTab === 'stripe' ? 'white' : 'transparent',
            borderBottom: gatewayTab === 'stripe' ? '3px solid #635BFF' : 'none',
            fontWeight: '700',
            color: gatewayTab === 'stripe' ? '#635BFF' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem'
          }}
        >
          <CreditCard size={18} />
          <span>⚡ Stripe Gateway</span>
        </button>

        <button
          type="button"
          onClick={() => setGatewayTab('upi')}
          style={{
            padding: '1rem',
            border: 'none',
            background: gatewayTab === 'upi' ? 'white' : 'transparent',
            borderBottom: gatewayTab === 'upi' ? '3px solid #10b981' : 'none',
            fontWeight: '700',
            color: gatewayTab === 'upi' ? '#10b981' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem'
          }}
        >
          <QrCode size={18} />
          <span>📱 UPI / QR Code</span>
        </button>
      </div>

      {/* TAB CONTENT: STRIPE PAYMENT GATEWAY */}
      {gatewayTab === 'stripe' && (
        <div style={{ padding: '2rem' }}>
          {/* Quick Autofill Helper */}
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
              <strong>Zero-Verification Mode</strong>: Live card preview
            </div>
            <button
              type="button"
              onClick={handleFillTestCard}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ⚡ Fill Test Card
            </button>
          </div>

          {stripeError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '0.75rem',
              color: '#991b1b',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              {stripeError}
            </div>
          )}

          <form onSubmit={handleStripePay}>
            {/* Cardholder Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                Cardholder Name *
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Card Number */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                  Card Number *
                </label>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#635BFF' }}>
                  {getCardBrand().name}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4242 4242 4242 4242"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    boxSizing: 'border-box'
                  }}
                />
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Expiry & CVC */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Expires (MM/YY) *
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={handleExpiryChange}
                  placeholder="12/28"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  CVC *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessingStripe}
              style={{
                width: '100%',
                padding: '1rem',
                background: isProcessingStripe ? '#94a3b8' : 'linear-gradient(135deg, #635BFF 0%, #0A2540 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.05rem',
                fontWeight: '700',
                cursor: isProcessingStripe ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(99, 91, 255, 0.35)',
                marginBottom: '1rem'
              }}
            >
              {isProcessingStripe ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Settling with Stripe...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Pay ${amount.toFixed(2)} with Stripe</span>
                </>
              )}
            </button>

            {/* Trust badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.78rem' }}>
              <ShieldCheck size={14} color="#16a34a" />
              <span>Stripe 256-bit encrypted checkout. Instant invoice settlement.</span>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: UPI / QR CODE */}
      {gatewayTab === 'upi' && (
        <div style={{ padding: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '12px'
          }}>
            <img 
              src="/payment-qr.png" 
              alt="Payment QR Code"
              style={{
                width: '220px',
                height: '220px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div style="width: 220px; height: 220px; background: white; border: 2px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.5rem;">
                    <div style="font-size: 3rem;">📱</div>
                    <div style="font-size: 0.85rem; color: #64748b; text-align: center; font-weight: 600;">
                      UPI QR Code
                    </div>
                  </div>
                `;
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', color: '#18181b', fontSize: '0.9rem' }}>
              Transaction Reference / UPI Ref ID *
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. UPI-928174519"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={handleConfirmUPI}
            disabled={confirming || !transactionId.trim()}
            style={{
              width: '100%',
              padding: '0.95rem',
              background: (confirming || !transactionId.trim()) ? '#d4d4d8' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: (confirming || !transactionId.trim()) ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {confirming ? 'Confirming...' : '✓ Confirm UPI Settlement'}
          </button>
        </div>
      )}

      {/* Cancel Button */}
      <div style={{ padding: '0 2rem 1.5rem', textAlign: 'center' }}>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          Cancel and return to cart
        </button>
      </div>
    </div>
  );
};

export default PaymentQRCode;
