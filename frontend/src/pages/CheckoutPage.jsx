import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';

const s = {
  container: { maxWidth: 1100, margin: '2rem auto', padding: '0 2rem' },
  steps: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', alignItems: 'center' },
  step: (active) => ({ padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: active ? 600 : 400, background: active ? '#1976d2' : '#e0e0e0', color: active ? 'white' : '#666' }),
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' },
  form: { background: 'white', borderRadius: 10, padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  sectionTitle: { color: '#1976d2', fontSize: '1.2rem', fontWeight: 600, borderBottom: '2px solid #e3f2fd', paddingBottom: '0.6rem', marginBottom: '1.2rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontWeight: 500, color: '#555', marginBottom: '0.4rem', fontSize: '0.88rem' },
  input: { width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.9rem', outline: 'none', marginBottom: '1rem' },
  payOption: (sel) => ({ flex: 1, padding: '0.8rem', border: `2px solid ${sel ? '#1976d2' : '#ddd'}`, borderRadius: 8, textAlign: 'center', cursor: 'pointer', background: sel ? '#e3f2fd' : 'white', fontWeight: sel ? 600 : 400 }),
  orderSummary: { background: 'white', borderRadius: 10, padding: '1.8rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 90 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.92rem' },
  total: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', borderTop: '2px solid #e0e0e0', paddingTop: '0.8rem', marginTop: '0.8rem', color: '#1976d2' },
  placeBtn: { width: '100%', background: '#1976d2', color: 'white', border: 'none', padding: '0.9rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '1rem', marginTop: '1rem' },
  promoRow: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  promoInput: { flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  promoBtn: { background: '#1976d2', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' },
  error: { background: '#ffebee', color: '#c62828', padding: '0.7rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.88rem' },
};

const PAY_METHODS = ['Credit Card', 'Debit Card', 'PayPal', 'Apple Pay'];

export default function CheckoutPage() {
  const { cart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step] = useState(1);
  const [payMethod, setPayMethod] = useState('Credit Card');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [addr, setAddr] = useState({
    street: user?.addresses?.[0]?.street || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    zip: user?.addresses?.[0]?.zip || '',
  });

  const shipping = cart.subtotal > 50 ? 0 : 5.99;
  const total = Math.max(0, cart.subtotal + shipping - discount);

  const applyPromo = async () => {
    try {
      const res = await ordersAPI.validatePromo(promoCode, cart.subtotal);
      setDiscount(res.data.discount);
      setPromoMsg(`✅ ${res.data.promo.description} — -$${res.data.discount.toFixed(2)}`);
    } catch (err) {
      setPromoMsg('❌ ' + (err.response?.data?.message || 'Invalid code'));
      setDiscount(0);
    }
  };

  const placeOrder = async () => {
    if (!addr.street || !addr.city || !addr.state || !addr.zip) {
      setError('Please fill in all address fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await ordersAPI.createOrder({
        shippingAddress: `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`,
        paymentMethod: payMethod,
        promoCode: promoCode || undefined,
      });
      navigate(`/order-confirmation/${res.data.order.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.steps}>
        {['Cart', 'Checkout', 'Confirmation'].map((st, i) => (
          <React.Fragment key={st}><span style={s.step(i + 1 === step)}>{i + 1}. {st}</span>{i < 2 && <span style={{ color: '#ccc' }}>›</span>}</React.Fragment>
        ))}
      </div>

      <div style={s.layout}>
        <div>
          {/* Shipping */}
          <div style={s.form}>
            <h3 style={s.sectionTitle}>📍 Shipping Address</h3>
            {error && <div style={s.error}>{error}</div>}
            <label style={s.label}>Street Address</label>
            <input style={s.input} placeholder="123 Main St" value={addr.street} onChange={e => setAddr(a => ({ ...a, street: e.target.value }))} />
            <div style={s.row}>
              <div>
                <label style={s.label}>City</label>
                <input style={s.input} placeholder="Boston" value={addr.city} onChange={e => setAddr(a => ({ ...a, city: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>State</label>
                <input style={s.input} placeholder="MA" value={addr.state} onChange={e => setAddr(a => ({ ...a, state: e.target.value }))} />
              </div>
            </div>
            <label style={s.label}>ZIP Code</label>
            <input style={s.input} placeholder="02101" value={addr.zip} onChange={e => setAddr(a => ({ ...a, zip: e.target.value }))} />
          </div>

          {/* Payment */}
          <div style={{ ...s.form, marginTop: '1.5rem' }}>
            <h3 style={s.sectionTitle}>💳 Payment Method</h3>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              {PAY_METHODS.map(m => (
                <div key={m} style={s.payOption(payMethod === m)} onClick={() => setPayMethod(m)}>{m}</div>
              ))}
            </div>
            <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.8rem' }}>⚠️ Payment is simulated — no real transaction will occur.</p>
          </div>
        </div>

        {/* Order Summary */}
        <div style={s.orderSummary}>
          <h3 style={{ color: '#1976d2', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.2rem' }}>Order Summary</h3>
          {cart.items.map(({ product, quantity }) => (
            <div key={product.id} style={{ ...s.summaryRow, alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{product.emoji}</span>
              <span style={{ flex: 1, fontSize: '0.88rem' }}>{product.name} ×{quantity}</span>
              <span>${(product.price * quantity).toFixed(2)}</span>
            </div>
          ))}
          <hr style={{ margin: '0.8rem 0', border: 'none', borderTop: '1px solid #f0f0f0' }} />
          <div style={s.summaryRow}><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
          <div style={s.summaryRow}><span>Shipping</span><span>{shipping === 0 ? <span style={{ color: '#4caf50' }}>FREE</span> : `$${shipping.toFixed(2)}`}</span></div>
          {discount > 0 && <div style={{ ...s.summaryRow, color: '#4caf50' }}><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}

          {/* Promo */}
          <div style={s.promoRow}>
            <input style={s.promoInput} placeholder="Promo code" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} />
            <button style={s.promoBtn} onClick={applyPromo}>Apply</button>
          </div>
          {promoMsg && <p style={{ fontSize: '0.82rem', color: promoMsg.startsWith('✅') ? '#4caf50' : '#e53935', marginBottom: '0.5rem' }}>{promoMsg}</p>}

          <div style={s.total}><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button style={s.placeBtn} onClick={placeOrder} disabled={loading}
            onMouseEnter={e => (e.target.style.background = '#1565c0')}
            onMouseLeave={e => (e.target.style.background = '#1976d2')}>
            {loading ? 'Placing Order...' : '✅ Place Order'}
          </button>
          <p style={{ fontSize: '0.78rem', color: '#888', textAlign: 'center', marginTop: '0.8rem' }}>You'll earn ~{Math.floor(total)} loyalty points</p>
        </div>
      </div>
    </div>
  );
}
