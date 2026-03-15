import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const styles = {
  header: { background: '#1976d2', color: 'white', padding: '1rem 0', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000 },
  container: { maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', gap: '1rem' },
  logo: { fontSize: '1.6rem', fontWeight: 'bold', color: 'white', textDecoration: 'none', whiteSpace: 'nowrap' },
  searchBar: { flex: 1, maxWidth: 500, position: 'relative' },
  searchInput: { width: '100%', padding: '0.6rem 3rem 0.6rem 1rem', border: 'none', borderRadius: 25, fontSize: '0.9rem', outline: 'none' },
  searchBtn: { position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: '#1565c0', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.85rem' },
  icons: { display: 'flex', gap: '0.8rem', alignItems: 'center' },
  iconBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', padding: '0.5rem 0.9rem', borderRadius: 20, color: 'white', cursor: 'pointer', fontSize: '0.9rem', position: 'relative', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' },
  badge: { background: '#ff5252', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', position: 'absolute', top: -4, right: -4 },
  nav: { background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  navContainer: { maxWidth: 1200, margin: '0 auto', padding: '0 2rem' },
  navUl: { listStyle: 'none', display: 'flex', gap: '2rem', padding: '0.8rem 0', margin: 0, alignItems: 'center' },
  navLink: { textDecoration: 'none', color: '#333', fontWeight: 500, transition: 'color 0.3s', fontSize: '0.95rem' },
};

export default function Header() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  return (
    <>
      <header style={styles.header}>
        <div style={styles.container}>
          <Link to="/" style={styles.logo}>🛒 AI Hypermarket</Link>

          <form style={styles.searchBar} onSubmit={handleSearch}>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search products..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            <button type="submit" style={styles.searchBtn}>Search</button>
          </form>

          <div style={styles.icons}>
            {user ? (
              <>
                <Link to="/account" style={styles.iconBtn}>👤 {user.name.split(' ')[0]}</Link>
                <Link to="/cart" style={{ ...styles.iconBtn, position: 'relative' }}>
                  🛒 Cart
                  {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
                </Link>
                <button style={styles.iconBtn} onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.iconBtn}>Login</Link>
                <Link to="/register" style={{ ...styles.iconBtn, background: 'rgba(255,255,255,0.35)' }}>Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <ul style={styles.navUl}>
            {[
              { to: '/', label: '🏠 Home' },
              { to: '/festival-specials', label: '🎉 Festival Specials' },
              { to: '/search?category=Produce', label: '🥦 Produce' },
              { to: '/search?category=Bakery', label: '🍞 Bakery' },
              { to: '/search?category=Dairy', label: '🥛 Dairy' },
              { to: '/search?category=Meat+%26+Seafood', label: '🥩 Meat & Seafood' },
              { to: '/search?category=Beverages', label: '🧃 Beverages' },
              { to: '/search?category=Snacks', label: '🍫 Snacks' },
              ...(user ? [{ to: '/recommendations', label: '✨ For You' }, { to: '/my-lists', label: '📋 My Lists' }] : []),
            ].map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  style={styles.navLink}
                  onMouseEnter={e => (e.target.style.color = '#1976d2')}
                  onMouseLeave={e => (e.target.style.color = '#333')}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
