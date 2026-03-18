import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI, recommendationsAPI, listsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/common/ProductCard';

const s = {
  container: { maxWidth: 1100, margin: '2rem auto', padding: '0 2rem' },
  breadcrumb: { color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' },
  breadLink: { color: '#1976d2', textDecoration: 'none' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', background: 'white', borderRadius: 12, padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '2rem' },
  mainImg: { height: 360, background: 'linear-gradient(135deg, #e0e0e0, #f5f5f5)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8rem' },
  title: { fontSize: '1.8rem', fontWeight: 'bold', color: '#222', marginBottom: '0.5rem' },
  brand: { color: '#888', marginBottom: '0.8rem' },
  rating: { color: '#ff9800', marginBottom: '0.8rem' },
  priceBox: { background: '#f9f9f9', borderRadius: 10, padding: '1.2rem', marginBottom: '1.2rem' },
  price: { fontSize: '2rem', color: '#1976d2', fontWeight: 'bold' },
  original: { textDecoration: 'line-through', color: '#aaa', marginLeft: '0.5rem', fontSize: '1.1rem' },
  discount: { background: '#ff5252', color: 'white', padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.8rem', marginLeft: '0.5rem' },
  pointsRow: { background: '#fff9c4', color: '#f57f17', padding: '0.5rem 0.8rem', borderRadius: 8, display: 'inline-block', fontSize: '0.88rem', marginBottom: '1rem' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' },
  tag: { background: '#e3f2fd', color: '#1565c0', padding: '0.3rem 0.7rem', borderRadius: 10, fontSize: '0.82rem' },
  qtyRow: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' },
  qtyBtn: { background: '#1976d2', color: 'white', border: 'none', width: 34, height: 34, borderRadius: 6, cursor: 'pointer', fontSize: '1.2rem' },
  qtyVal: { fontSize: '1.1rem', fontWeight: 600, minWidth: 30, textAlign: 'center' },
  addBtn: { background: '#1976d2', color: 'white', border: 'none', padding: '0.9rem 2rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '1rem', width: '100%', transition: 'background 0.2s' },
  listBtn: { background: 'white', color: '#1976d2', border: '1px solid #1976d2', padding: '0.7rem 1.5rem', borderRadius: 8, cursor: 'pointer', fontWeight: 500, width: '100%', marginTop: '0.6rem' },
  section: { background: 'white', padding: '2rem', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '2rem' },
  sectionTitle: { color: '#1976d2', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.2rem' },
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [lists, setLists] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productsAPI.getById(id),
      recommendationsAPI.getSimilar(id),
      ...(user ? [listsAPI.getLists()] : [])
    ]).then(([pRes, sRes, lRes]) => {
      setProduct(pRes.data.product);
      setSimilar(sRes.data.similar);
      if (lRes) setLists(lRes.data.lists);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!user) { window.location.href = '/login'; return; }
    await addToCart(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddToList = async (listId) => {
    await listsAPI.addItem(listId, product.id, product.name);
    setShowListModal(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading...</div>;
  if (!product) return <div style={{ textAlign: 'center', padding: '3rem', color: '#e53935' }}>Product not found.</div>;

  const discountPct = product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <div style={s.container}>
      <div style={s.breadcrumb}>
        <Link to="/" style={s.breadLink}>Home</Link> › <Link to={`/search?category=${product.category}`} style={s.breadLink}>{product.category}</Link> › {product.name}
      </div>

      <div style={s.layout}>
        <div>
          <div style={s.mainImg}>{product.emoji}</div>
        </div>
        <div>
          <p style={s.brand}>{product.brand}</p>
          <h1 style={s.title}>{product.name}</h1>
          <div style={s.rating}>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))} <span style={{ color: '#888', fontSize: '0.9rem' }}>({product.reviewCount} reviews)</span></div>

          <div style={s.priceBox}>
            <span style={s.price}>${product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && <>
              <span style={s.original}>${product.originalPrice.toFixed(2)}</span>
              <span style={s.discount}>-{discountPct}%</span>
            </>}
          </div>

          {product.loyaltyPoints > 0 && <div style={s.pointsRow}>⭐ Earn +{product.loyaltyPoints} loyalty points</div>}

          <div style={s.tags}>
            {product.dietaryInfo.map(t => <span key={t} style={s.tag}>{t}</span>)}
          </div>

          {product.location && (
            <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 8, padding: '0.8rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📍</span>
              <div>
                <div style={{ fontWeight: 600, color: '#2e7d32', fontSize: '0.9rem' }}>Find in Store</div>
                <div style={{ color: '#555', fontSize: '0.85rem' }}>
                  Aisle {product.location.aisle}, Section {product.location.section}, Shelf {product.location.shelf} — {product.location.zone} Zone
                </div>
              </div>
            </div>
          )}

          <p style={{ color: '#555', lineHeight: 1.6, marginBottom: '1.2rem' }}>{product.description}</p>

          <div style={s.qtyRow}>
            <button style={s.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span style={s.qtyVal}>{qty}</span>
            <button style={s.qtyBtn} onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>{product.stock} in stock</span>
          </div>

          <button style={s.addBtn} onClick={handleAddToCart}
            onMouseEnter={e => (e.target.style.background = '#1565c0')}
            onMouseLeave={e => (e.target.style.background = '#1976d2')}>
            {added ? '✅ Added to Cart!' : '🛒 Add to Cart'}
          </button>

          {user && (
            <button style={s.listBtn} onClick={() => setShowListModal(true)}>📋 Add to Shopping List</button>
          )}

          {showListModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: '2rem', width: 320 }}>
                <h3 style={{ marginBottom: '1rem', color: '#1976d2' }}>Select a List</h3>
                {lists.map(l => (
                  <button key={l.id} onClick={() => handleAddToList(l.id)} style={{ display: 'block', width: '100%', padding: '0.8rem', marginBottom: '0.5rem', border: '1px solid #e0e0e0', borderRadius: 8, cursor: 'pointer', textAlign: 'left', background: 'white' }}>
                    📋 {l.name}
                  </button>
                ))}
                <button onClick={() => setShowListModal(false)} style={{ marginTop: '0.5rem', color: '#666', border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>You May Also Like</h3>
          <div style={s.grid}>
            {similar.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
