import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recommendationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/common/ProductCard';

const s = {
  container: { maxWidth: 1200, margin: '2rem auto', padding: '0 2rem' },
  banner: { background: 'linear-gradient(135deg, #7b1fa2, #1976d2)', color: 'white', padding: '2.5rem 2rem', borderRadius: 12, marginBottom: '2rem' },
  section: { background: 'white', borderRadius: 10, padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  sectionTitle: { color: '#1976d2', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.2rem', marginTop: '1.2rem' },
  tag: { background: '#e3f2fd', color: '#1565c0', padding: '0.3rem 0.8rem', borderRadius: 12, fontSize: '0.82rem', display: 'inline-block', margin: '0.2rem' },
  festSection: { background: 'white', borderRadius: 10, padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  festHeader: (color) => ({ padding: '1rem 1.5rem', borderRadius: 8, marginBottom: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem', background: color }),
  stub: { background: '#fff8e1', color: '#f57f17', padding: '0.8rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.88rem' },
};

export default function AIRecommendationsPage() {
  const { user } = useAuth();
  const [recs, setRecs] = useState([]);
  const [festRecs, setFestRecs] = useState([]);
  const [basedOn, setBasedOn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      recommendationsAPI.getPersonalized(12),
      recommendationsAPI.getFestival(),
    ]).then(([recRes, festRes]) => {
      setRecs(recRes.data.recommendations);
      setBasedOn(recRes.data.basedOn);
      setFestRecs(festRes.data.festivalRecommendations);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.container}>
      <div style={s.banner}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨ Personalized Recommendations</h1>
        <p style={{ opacity: 0.9 }}>AI-curated products based on your profile and preferences</p>
        <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '0.5rem' }}>Welcome, {user?.name?.split(' ')[0]} · {user?.loyaltyTier} Member</p>
      </div>

      <div style={s.stub}>
        ℹ️ <strong>Note:</strong> Recommendations are currently content-based (matching your dietary & festival preferences). Full hybrid ML recommendations (collaborative filtering) will be available after database integration.
      </div>

      {/* Based On */}
      {basedOn && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Based on Your Profile</h3>
          <div>
            {basedOn.dietaryPreferences?.length > 0 && <>
              <span style={{ color: '#888', fontSize: '0.88rem' }}>Dietary: </span>
              {basedOn.dietaryPreferences.map(t => <span key={t} style={s.tag}>{t}</span>)}
            </>}
            {basedOn.culturalInterests?.length > 0 && <><br /><span style={{ color: '#888', fontSize: '0.88rem', marginTop: '0.4rem', display: 'inline-block' }}>Festivals: </span>
              {basedOn.culturalInterests.map(t => <span key={t} style={{ ...s.tag, background: '#f3e5f5', color: '#7b1fa2' }}>{t}</span>)}</>}
          </div>
          <Link to="/account" style={{ color: '#1976d2', fontSize: '0.85rem', textDecoration: 'none' }}>✏️ Edit preferences →</Link>
        </div>
      )}

      {/* Personalized Picks */}
      {!loading && recs.length > 0 && (
        <div style={s.section}>
          <h2 style={s.sectionTitle}>🛒 For You</h2>
          <div style={s.grid}>
            {recs.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Festival Recommendations */}
      {festRecs.map(({ festival, products }) => products.length > 0 && (
        <div key={festival.id} style={s.festSection}>
          <div style={s.festHeader(festival.color)}>
            <span style={{ fontSize: '1.8rem' }}>{festival.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{festival.name}</div>
              <div style={{ opacity: 0.85, fontSize: '0.85rem' }}>{festival.date} · {festival.description}</div>
            </div>
          </div>
          <div style={s.grid}>
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      ))}

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading recommendations...</div>}
    </div>
  );
}
