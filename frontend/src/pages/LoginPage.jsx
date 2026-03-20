import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  page: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  card: { background: 'white', borderRadius: 12, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { color: '#1976d2', fontSize: '1.8rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' },
  sub: { color: '#666', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem' },
  label: { display: 'block', fontWeight: 500, color: '#555', marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.95rem', outline: 'none', marginBottom: '1.2rem' },
  btn: { width: '100%', background: '#1976d2', color: 'white', border: 'none', padding: '0.85rem', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  error: { background: '#ffebee', color: '#c62828', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.88rem', textAlign: 'center' },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' },
  link: { color: '#1976d2', textDecoration: 'none', fontWeight: 500 },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>🛒 Sign In</h1>
        <p style={s.sub}>Welcome back to AI Hypermarket</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com"
            onFocus={e => (e.target.style.borderColor = '#1976d2')}
            onBlur={e => (e.target.style.borderColor = '#ddd')} />

          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
            onFocus={e => (e.target.style.borderColor = '#1976d2')}
            onBlur={e => (e.target.style.borderColor = '#ddd')} />

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={s.footer}>
          Don't have an account? <Link to="/register" style={s.link}>Register now</Link>
        </div>
      </div>
    </div>
  );
}
