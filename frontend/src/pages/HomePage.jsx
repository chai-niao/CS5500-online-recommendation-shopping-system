import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI, recommendationsAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';

const s = {
  container: { maxWidth: 1200, margin: '2rem auto', padding: '0 2rem' },
  banner: { background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', padding: '2.5rem 2rem', borderRadius: 12, marginBottom: '2rem' },
  bannerTitle: { fontSize: '2rem', marginBottom: '0.5rem' },
  bannerSub: { opacity: 0.9, marginBottom: '1rem' },
  loyaltyBadge: { background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 20, fontSize: '0.9rem' },
  section: { background: 'white', padding: '2rem', borderRadius: 10, marginBottom: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  sectionTitle: { color: '#1976d2', fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1.5rem' },
  festivalCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  festivalCard: { borderRadius: 10, padding: '1.5rem', color: 'white', textAlign: 'center', cursor: 'pointer', textDecoration: 'none', display: 'block' },
  seeAll: { color: '#1976d2', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 },
  loading: { textAlign: 'center', padding: '3rem', color: '#888', fontSize: '1.1rem' },
};

export default function HomePage() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, festRes] = await Promise.all([
          productsAPI.getAll({ featured: 'true', limit: 8 }),
          productsAPI.getFestivals(),
        ]);
        setFeatured(featRes.data.products);
        setFestivals(festRes.data.festivals.slice(0, 6));

        if (user) {
          const recRes = await recommendationsAPI.getPersonalized(8);
          setRecommendations(recRes.data.recommendations);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.container}>
      {/* Welcome Banner */}
      <div style={s.banner}>
        {user ? (
          <>
            <h2 style={s.bannerTitle}>Welcome back, {user.name.split(' ')[0]}! 👋</h2>
            <p style={s.bannerSub}>Your personalized shopping experience is ready.</p>
            <span style={s.loyaltyBadge}>
              🏆 {user.loyaltyTier} Member &nbsp;·&nbsp; ⭐ {user.loyaltyPoints} pts
            </span>
          </>
        ) : (
          <>
            <h2 style={s.bannerTitle}>Welcome to AI Hypermarket 🛒</h2>
            <p style={s.bannerSub}>Discover personalized products powered by AI — tailored just for you.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link to="/register" style={{ background: 'white', color: '#1976d2', padding: '0.6rem 1.5rem', borderRadius: 20, textDecoration: 'none', fontWeight: 600 }}>Get Started</Link>
              <Link to="/login" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.6rem 1.5rem', borderRadius: 20, textDecoration: 'none' }}>Sign In</Link>
            </div>
          </>
        )}
      </div>

      {/* Festival Section */}
      {festivals.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span>🎉 Upcoming Festivals</span>
            <Link to="/festival-specials" style={s.seeAll}>See all festival specials →</Link>
          </div>
          <div style={s.festivalCards}>
            {festivals.map(f => (
              <Link
                key={f.id}
                to={`/festival-specials?festival=${f.id}`}
                style={{ ...s.festivalCard, background: f.color }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{f.emoji}</div>
                <div style={{ fontWeight: 600 }}>{f.name}</div>
                <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: '0.3rem' }}>{f.date}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      {user && recommendations.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span>✨ Recommended for You</span>
            <Link to="/recommendations" style={s.seeAll}>See all →</Link>
          </div>
          <div style={s.grid}>
            {recommendations.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Featured Products */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span>⭐ Featured Products</span>
          <Link to="/search?featured=true" style={s.seeAll}>View all →</Link>
        </div>
        <div style={s.grid}>
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
}
