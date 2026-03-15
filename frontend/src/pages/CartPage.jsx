import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const s = {
  container: { maxWidth: 1100, margin: '2rem auto', padding: '0 2rem' },
  title: { color: '#1976d2', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' },
  itemsBox: { background: 'white', borderRadius: 10, padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  item: { display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: '1.2rem', padding: '1.2rem 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' },
  img: { width: 90, height: 90, background: 'linear-gradient(135deg, #e0e0e0, #f5f5f5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' },
  itemName: { fontWeight: 600, color: '#222', marginBottom: '0.3rem' },
  itemBrand: { color: '#888', fontSize: '0.85rem' },
  itemPrice: { color: '#1976d2', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '0.5rem' },
  qtyRow: { display: 'flex', alignItems: 'center', gap: '0.7rem', marginTop: '0.5rem' },
  qtyBtn: { background: '#1976d2', color: 'white', border: 'none', width: 28, height: 28, borderRadius: 5, cursor: 'pointer', fontSize: '1rem' },
  removeBtn: { background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '1.2rem', padding: '0.3rem' },
  summary: { background: 'white', borderRadius: 10, padding: '1.8rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 90 },
  summaryTitle: { color: '#1976d2', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.2rem' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.7rem', fontSize: '0.95rem' },
  total: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', borderTop: '2px solid #e0e0e0', paddingTop: '0.8rem', marginTop: '0.8rem', color: '#1976d2' },
  checkoutBtn: { background: '#1976d2', color: 'white', border: 'none', padding: '0.9rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '1rem', width: '100%', marginTop: '1rem' },
  empty: { textAlign: 'center', padding: '4rem 2rem', color: '#888' },
};

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div style={s.container}>
        <div style={s.empty}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h2>Your cart is empty</h2>
          <p style={{ margin: '0.8rem 0 1.5rem' }}>Add some products to get started!</p>
          <Link to="/" style={{ background: '#1976d2', color: 'white', padding: '0.8rem 2rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>Start Shopping</Link>
        </div>
      </div>
    );
  }

  const itemTotal = cart.subtotal;
  const shipping = itemTotal > 50 ? 0 : 5.99;
  const total = itemTotal + shipping;

  return (
    <div style={s.container}>
      <h1 style={s.title}>🛒 Shopping Cart ({cart.items.length} items)</h1>
      <div style={s.layout}>
        <div style={s.itemsBox}>
          {cart.items.map(({ product, quantity }) => (
            <div key={product.id} style={s.item}>
              <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                <div style={s.img}>{product.emoji}</div>
              </Link>
              <div>
                <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                  <div style={s.itemName}>{product.name}</div>
                </Link>
                <div style={s.itemBrand}>{product.brand}</div>
                <div style={{ ...s.qtyRow }}>
                  <button style={s.qtyBtn} onClick={() => updateQuantity(product.id, quantity - 1)}>−</button>
                  <span style={{ fontWeight: 600 }}>{quantity}</span>
                  <button style={s.qtyBtn} onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                </div>
                <div style={s.itemPrice}>${(product.price * quantity).toFixed(2)}</div>
              </div>
              <button style={s.removeBtn} onClick={() => removeFromCart(product.id)} title="Remove">🗑</button>
            </div>
          ))}
        </div>

        <div style={s.summary}>
          <h3 style={s.summaryTitle}>Order Summary</h3>
          <div style={s.row}><span>Subtotal</span><span>${itemTotal.toFixed(2)}</span></div>
          <div style={s.row}><span>Shipping</span><span>{shipping === 0 ? <span style={{ color: '#4caf50' }}>FREE</span> : `$${shipping.toFixed(2)}`}</span></div>
          {shipping > 0 && <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Free shipping on orders over $50</p>}
          <div style={s.total}><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button style={s.checkoutBtn} onClick={() => navigate('/checkout')}
            onMouseEnter={e => (e.target.style.background = '#1565c0')}
            onMouseLeave={e => (e.target.style.background = '#1976d2')}>
            Proceed to Checkout →
          </button>
          <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '0.8rem', color: '#1976d2', fontSize: '0.9rem', textDecoration: 'none' }}>← Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
