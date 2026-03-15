import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';

const s = {
  container: { maxWidth: 700, margin: '3rem auto', padding: '0 2rem', textAlign: 'center' },
  card: { background: 'white', borderRadius: 12, padding: '3rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  icon: { fontSize: '5rem', marginBottom: '1rem' },
  title: { color: '#2e7d32', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' },
  sub: { color: '#666', marginBottom: '2rem' },
  detail: { background: '#f9f9f9', borderRadius: 8, padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.95rem' },
  btns: { display: 'flex', gap: '1rem', justifyContent: 'center' },
  btn: { padding: '0.8rem 2rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' },
};

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    ordersAPI.getOrderById(orderId).then(res => setOrder(res.data.order)).catch(console.error);
  }, [orderId]);

  if (!order) return <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading...</div>;

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.icon}>🎉</div>
        <h1 style={s.title}>Order Confirmed!</h1>
        <p style={s.sub}>Thank you for your purchase. Your order is being processed.</p>

        <div style={s.detail}>
          <div style={s.row}><span style={{ color: '#888' }}>Order #</span><strong>{order.id.slice(0, 8).toUpperCase()}</strong></div>
          <div style={s.row}><span style={{ color: '#888' }}>Date</span><span>{order.createdAt}</span></div>
          <div style={s.row}><span style={{ color: '#888' }}>Status</span><span style={{ color: '#1976d2', fontWeight: 600 }}>{order.status}</span></div>
          <div style={s.row}><span style={{ color: '#888' }}>Payment</span><span>{order.paymentMethod}</span></div>
          <div style={s.row}><span style={{ color: '#888' }}>Ship to</span><span>{order.shippingAddress}</span></div>
          <hr style={{ margin: '0.8rem 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
          <div style={s.row}><span style={{ color: '#888' }}>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          {order.discount > 0 && <div style={{ ...s.row, color: '#4caf50' }}><span>Discount</span><span>-${order.discount.toFixed(2)}</span></div>}
          <div style={{ ...s.row, fontWeight: 'bold', fontSize: '1.1rem', color: '#1976d2' }}><span>Total</span><span>${order.total.toFixed(2)}</span></div>
          <div style={{ ...s.row, color: '#f57f17' }}><span>⭐ Loyalty Points Earned</span><span>+{order.loyaltyPointsEarned}</span></div>
        </div>

        <div style={s.btns}>
          <Link to="/account" style={{ ...s.btn, background: '#1976d2', color: 'white' }}>View My Orders</Link>
          <Link to="/" style={{ ...s.btn, border: '1px solid #1976d2', color: '#1976d2' }}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
