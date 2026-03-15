import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const s = {
  card: { background: 'white', borderRadius: 10, padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', display: 'flex', flexDirection: 'column' },
  img: { width: '100%', height: 150, background: 'linear-gradient(135deg, #e0e0e0, #f5f5f5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '0.8rem' },
  name: { fontWeight: 600, color: '#333', marginBottom: '0.4rem', fontSize: '0.95rem' },
  brand: { color: '#888', fontSize: '0.82rem', marginBottom: '0.5rem' },
  priceRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
  price: { color: '#1976d2', fontWeight: 'bold', fontSize: '1.1rem' },
  original: { color: '#aaa', textDecoration: 'line-through', fontSize: '0.9rem' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.8rem' },
  tag: { background: '#e3f2fd', color: '#1565c0', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.75rem' },
  points: { background: '#fff9c4', color: '#f57f17', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.75rem', marginBottom: '0.5rem', display: 'inline-block' },
  rating: { color: '#ff9800', fontSize: '0.85rem', marginBottom: '0.6rem' },
  btn: { background: '#1976d2', color: 'white', border: 'none', padding: '0.6rem', borderRadius: 5, cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', transition: 'background 0.2s', marginTop: 'auto' },
  btnDisabled: { background: '#ccc', color: 'white', border: 'none', padding: '0.6rem', borderRadius: 5, cursor: 'default', fontWeight: 500, fontSize: '0.9rem', marginTop: 'auto' },
};

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login'; return; }
    try { await addToCart(product.id, 1); }
    catch (err) { console.error(err); }
  };

  return (
    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={s.card}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
      >
        <div style={s.img}>{product.emoji}</div>
        <p style={s.brand}>{product.brand}</p>
        <h4 style={s.name}>{product.name}</h4>
        <div style={s.priceRow}>
          <span style={s.price}>${product.price.toFixed(2)}</span>
          {product.originalPrice > product.price && (
            <span style={s.original}>${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <div style={s.rating}>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))} ({product.reviewCount})</div>
        {product.loyaltyPoints > 0 && <span style={s.points}>+{product.loyaltyPoints} pts</span>}
        <div style={s.tags}>
          {product.dietaryInfo.slice(0, 2).map(t => <span key={t} style={s.tag}>{t}</span>)}
        </div>
        <button
          style={product.stock > 0 ? s.btn : s.btnDisabled}
          onClick={handleAdd}
          disabled={product.stock === 0}
          onMouseEnter={e => { if (product.stock > 0) e.target.style.background = '#1565c0'; }}
          onMouseLeave={e => { if (product.stock > 0) e.target.style.background = '#1976d2'; }}
        >
          {product.stock > 0 ? '+ Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </Link>
  );
}
