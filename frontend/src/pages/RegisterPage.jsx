import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  card: { background: 'white', borderRadius: 12, padding: '2.5rem', width: '100%', maxWidth: 520, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { color: '#1976d2', fontSize: '1.8rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' },
  sub: { color: '#666', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontWeight: 500, color: '#555', marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.9rem', outline: 'none', marginBottom: '1rem' },
  select: { width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.9rem', outline: 'none', marginBottom: '1rem' },
  sectionTitle: { fontWeight: 600, color: '#1976d2', fontSize: '1rem', margin: '0.5rem 0 0.8rem', borderBottom: '1px solid #e0e0e0', paddingBottom: '0.4rem' },
  checkGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '1rem' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', cursor: 'pointer' },
  btn: { width: '100%', background: '#1976d2', color: 'white', border: 'none', padding: '0.85rem', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
  error: { background: '#ffebee', color: '#c62828', padding: '0.7rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.88rem', textAlign: 'center' },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' },
  link: { color: '#1976d2', textDecoration: 'none', fontWeight: 500 },
};

const CULTURAL_OPTIONS = ['Christmas', 'Lunar New Year', 'Diwali', 'Thanksgiving', 'Easter', 'Mid-Autumn Festival', 'Eid', 'Hanukkah'];
const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Organic', 'Halal', 'Kosher', 'Keto-Friendly', 'Dairy-Free'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', ageRange: '', preferredLanguage: 'English', culturalInterests: [], dietaryPreferences: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (field, val) => setForm(f => ({
    ...f,
    [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val]
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = (field) => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    onFocus: e => (e.target.style.borderColor = '#1976d2'),
    onBlur: e => (e.target.style.borderColor = '#ddd'),
  });

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>🛒 Create Account</h1>
        <p style={s.sub}>Join AI Hypermarket for personalized shopping</p>
        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <p style={s.sectionTitle}>Account Information</p>
          <div style={s.row}>
            <div>
              <label style={s.label}>Full Name *</label>
              <input style={s.input} required placeholder="John Doe" {...inp('name')} />
            </div>
            <div>
              <label style={s.label}>Phone</label>
              <input style={s.input} placeholder="+1-555-0000" {...inp('phone')} />
            </div>
          </div>
          <label style={s.label}>Email *</label>
          <input style={s.input} type="email" required placeholder="your@email.com" {...inp('email')} />
          <label style={s.label}>Password *</label>
          <input style={s.input} type="password" required placeholder="Minimum 6 characters" {...inp('password')} />

          <p style={s.sectionTitle}>Profile Preferences (Optional)</p>
          <div style={s.row}>
            <div>
              <label style={s.label}>Age Range</label>
              <select style={s.select} {...inp('ageRange')}>
                <option value="">Select...</option>
                {['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Preferred Language</label>
              <select style={s.select} {...inp('preferredLanguage')}>
                {['English', 'Spanish', 'Mandarin', 'Hindi', 'French', 'Arabic'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <label style={s.label}>Cultural / Festival Interests</label>
          <div style={s.checkGrid}>
            {CULTURAL_OPTIONS.map(o => (
              <label key={o} style={s.checkLabel}>
                <input type="checkbox" checked={form.culturalInterests.includes(o)} onChange={() => toggle('culturalInterests', o)} />
                {o}
              </label>
            ))}
          </div>

          <label style={s.label}>Dietary Preferences</label>
          <div style={s.checkGrid}>
            {DIETARY_OPTIONS.map(o => (
              <label key={o} style={s.checkLabel}>
                <input type="checkbox" checked={form.dietaryPreferences.includes(o)} onChange={() => toggle('dietaryPreferences', o)} />
                {o}
              </label>
            ))}
          </div>

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={s.footer}>
          Already have an account? <Link to="/login" style={s.link}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
