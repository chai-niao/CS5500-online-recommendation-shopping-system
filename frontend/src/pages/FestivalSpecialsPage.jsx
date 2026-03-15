import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';

const s = {
  container: { maxWidth: 1200, margin: '2rem auto', padding: '0 2rem' },
  banner: { background: 'linear-gradient(135deg, #1976d2, #1565c0)', color: 'white', padding: '3rem 2rem', borderRadius: 12, marginBottom: '2rem', textAlign: 'center' },
  festivalTabs: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', justifyContent: 'center' },
  tab: (active, color) => ({ padding: '0.6rem 1.4rem', borderRadius: 20, cursor: 'pointer', border: 'none', fontWeight: active ? 700 : 400, background: active ? color : '#e0e0e0', color: active ? 'white' : '#555', fontSize: '0.9rem', transition: 'all 0.2s' }),
  section: { background: 'white', borderRadius: 10, padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  sectionTitle: { color: '#1976d2', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.7rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.2rem' },
};

export default function FestivalSpecialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [festivals, setFestivals] = useState([]);
  const [activeFestId, setActiveFestId] = useState(null);
  const [festivalProducts, setFestivalProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Capture initial URL param once — avoids re-fetching festivals on every tab change
  const initialFestivalParam = useRef(searchParams.get('festival'));

  useEffect(() => {
    productsAPI.getFestivals().then(res => {
      const fests = res.data.festivals;
      setFestivals(fests);
      const paramId = initialFestivalParam.current;
      const initial = paramId ? fests.find(f => f.id === paramId) : fests[0];
      if (initial) setActiveFestId(initial.id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeFestId || festivals.length === 0) return;
    const fest = festivals.find(f => f.id === activeFestId);
    if (!fest) return;
    setLoading(true);
    const tagQuery = fest.tags[0];
    productsAPI.getAll({ festivalTag: tagQuery, limit: 20 })
      .then(res => setFestivalProducts(res.data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeFestId, festivals]);

  const activeFest = festivals.find(f => f.id === activeFestId);

  return (
    <div style={s.container}>
      <div style={s.banner}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{activeFest?.emoji || '🎉'}</div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Festival Specials</h1>
        <p style={{ opacity: 0.9 }}>Curated products for every celebration</p>
        {activeFest && <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', opacity: 0.85 }}>{activeFest.description}</p>}
      </div>

      {/* Festival Tabs */}
      <div style={s.festivalTabs}>
        {festivals.map(f => (
          <button key={f.id} style={s.tab(activeFestId === f.id, f.color)} onClick={() => { setActiveFestId(f.id); setSearchParams({ festival: f.id }); }}>
            {f.emoji} {f.name}
          </button>
        ))}
      </div>

      {/* Products */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>
          {activeFest?.emoji} {activeFest?.name} Picks
          <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 400 }}>{activeFest?.date && `— ${activeFest.date}`}</span>
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading products...</div>
        ) : festivalProducts.length === 0 ? (
          <p style={{ color: '#888' }}>No specific products for this festival yet. Check back soon!</p>
        ) : (
          <div style={s.grid}>
            {festivalProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
