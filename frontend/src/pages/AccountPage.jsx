import React, { useState, useEffect } from 'react';
import { usersAPI, ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const s = {
  container: { maxWidth: 1100, margin: '2rem auto', padding: '0 2rem' },
  layout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem' },
  sidebar: { background: 'white', borderRadius: 10, padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: 'fit-content' },
  menuItem: { padding: '0.75rem 1rem', borderRadius: 8, cursor: 'pointer', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 500, fontSize: '0.95rem', border: 'none', width: '100%', textAlign: 'left' },
  card: { background: 'white', borderRadius: 10, padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  title: { color: '#1976d2', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '2px solid #e3f2fd', paddingBottom: '0.8rem' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontWeight: 500, color: '#555', marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.9rem', outline: 'none', marginBottom: '1rem' },
  select: { width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.9rem', marginBottom: '1rem' },
  saveBtn: { background: '#1976d2', color: 'white', border: 'none', padding: '0.7rem 2rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  tierBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: 20, fontWeight: 600, fontSize: '0.9rem' },
  checkGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '1rem' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' },
  orderCard: { border: '1px solid #e0e0e0', borderRadius: 10, padding: '1.2rem', marginBottom: '1rem' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' },
  statusBadge: { padding: '0.3rem 0.8rem', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600 },
  success: { background: '#e8f5e9', color: '#2e7d32' },
  info: { background: '#e3f2fd', color: '#1565c0' },
  warn: { background: '#fff3e0', color: '#e65100' },
};

const CULTURAL_OPTIONS = ['Christmas', 'Lunar New Year', 'Diwali', 'Thanksgiving', 'Easter', 'Mid-Autumn Festival', 'Eid', 'Hanukkah'];
const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Organic', 'Halal', 'Kosher', 'Keto-Friendly', 'Dairy-Free'];

const TIER_COLORS = { Bronze: '#cd7f32', Silver: '#aaa', Gold: '#ffd700', Platinum: '#e5e4e2' };

export default function AccountPage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: '', phone: '', ageRange: '', preferredLanguage: '', culturalInterests: [], dietaryPreferences: [] });
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, phone: user.phone || '', ageRange: user.ageRange || '', preferredLanguage: user.preferredLanguage || 'English', culturalInterests: user.culturalInterests || [], dietaryPreferences: user.dietaryPreferences || [] });
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'orders') {
      ordersAPI.getOrders().then(res => setOrders(res.data.orders)).catch(() => {});
    }
  }, [tab]);

  const toggle = (field, val) => setForm(f => ({
    ...f,
    [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val]
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await usersAPI.updateMe(form);
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'orders', icon: '📦', label: 'My Orders' },
    { id: 'addresses', icon: '📍', label: 'Addresses' },
    { id: 'loyalty', icon: '🏆', label: 'Loyalty Points' },
  ];

  return (
    <div style={s.container}>
      <div style={{ background: 'white', padding: '1.5rem 2rem', borderRadius: 10, marginBottom: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#1976d2', fontSize: '1.6rem' }}>My Account</h1>
          <p style={{ color: '#666' }}>{user?.email}</p>
        </div>
        <span style={{ ...s.tierBadge, background: TIER_COLORS[user?.loyaltyTier] + '33', color: TIER_COLORS[user?.loyaltyTier] }}>
          🏆 {user?.loyaltyTier} — {user?.loyaltyPoints} pts
        </span>
      </div>

      <div style={s.layout}>
        <div style={s.sidebar}>
          {menuItems.map(m => (
            <button key={m.id} style={{ ...s.menuItem, background: tab === m.id ? '#e3f2fd' : 'transparent', color: tab === m.id ? '#1976d2' : '#333' }} onClick={() => setTab(m.id)}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div style={s.card}>
          {/* Profile Tab */}
          {tab === 'profile' && (
            <>
              <h2 style={s.title}>Profile Settings</h2>
              {saved && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', textAlign: 'center' }}>✅ Profile saved successfully!</div>}
              <div style={s.formRow}>
                <div><label style={s.label}>Full Name</label><input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label style={s.label}>Phone</label><input style={s.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div style={s.formRow}>
                <div>
                  <label style={s.label}>Age Range</label>
                  <select style={s.select} value={form.ageRange} onChange={e => setForm(f => ({ ...f, ageRange: e.target.value }))}>
                    <option value="">Select...</option>
                    {['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Preferred Language</label>
                  <select style={s.select} value={form.preferredLanguage} onChange={e => setForm(f => ({ ...f, preferredLanguage: e.target.value }))}>
                    {['English', 'Spanish', 'Mandarin', 'Hindi', 'French', 'Arabic'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <label style={s.label}>Cultural / Festival Interests</label>
              <div style={s.checkGrid}>
                {CULTURAL_OPTIONS.map(o => (
                  <label key={o} style={s.checkLabel}><input type="checkbox" checked={form.culturalInterests.includes(o)} onChange={() => toggle('culturalInterests', o)} /> {o}</label>
                ))}
              </div>
              <label style={s.label}>Dietary Preferences</label>
              <div style={s.checkGrid}>
                {DIETARY_OPTIONS.map(o => (
                  <label key={o} style={s.checkLabel}><input type="checkbox" checked={form.dietaryPreferences.includes(o)} onChange={() => toggle('dietaryPreferences', o)} /> {o}</label>
                ))}
              </div>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </>
          )}

          {/* Orders Tab */}
          {tab === 'orders' && (
            <>
              <h2 style={s.title}>My Orders</h2>
              {orders.length === 0 ? <p style={{ color: '#888' }}>No orders yet.</p> : orders.map(o => (
                <div key={o.id} style={s.orderCard}>
                  <div style={s.orderHeader}>
                    <div><strong>#{o.id.slice(0, 8).toUpperCase()}</strong><span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '1rem' }}>{o.createdAt}</span></div>
                    <span style={{ ...s.statusBadge, ...(o.status === 'Delivered' ? s.success : o.status === 'Processing' ? s.info : s.warn) }}>{o.status}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#555' }}>{o.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</div>
                  <div style={{ marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>+{o.loyaltyPointsEarned} pts earned</span>
                    <strong style={{ color: '#1976d2' }}>${o.total.toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Addresses Tab */}
          {tab === 'addresses' && (
            <>
              <h2 style={s.title}>Saved Addresses</h2>
              {(user?.addresses || []).map(a => (
                <div key={a.id} style={{ ...s.orderCard, borderColor: a.isDefault ? '#1976d2' : '#e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{a.label}</strong>
                    {a.isDefault && <span style={{ ...s.statusBadge, ...s.info }}>Default</span>}
                  </div>
                  <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '0.4rem' }}>{a.street}, {a.city}, {a.state} {a.zip}</p>
                </div>
              ))}
              {(!user?.addresses || user.addresses.length === 0) && <p style={{ color: '#888' }}>No saved addresses.</p>}
            </>
          )}

          {/* Loyalty Tab */}
          {tab === 'loyalty' && (
            <>
              <h2 style={s.title}>Loyalty Rewards</h2>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                <h3 style={{ color: TIER_COLORS[user?.loyaltyTier], fontSize: '2rem', marginBottom: '0.5rem' }}>{user?.loyaltyTier} Member</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1976d2' }}>{user?.loyaltyPoints} pts</p>
                <p style={{ color: '#666', marginTop: '1rem' }}>Earn 1 point per $1 spent. Redeem for discounts!</p>
                <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '1.5rem', marginTop: '2rem', textAlign: 'left' }}>
                  <h4 style={{ marginBottom: '1rem', color: '#333' }}>Tier Benefits</h4>
                  {[['Bronze', '0+', '1x points'], ['Silver', '500+', '1.5x points'], ['Gold', '1500+', '2x points + free shipping'], ['Platinum', '5000+', '3x points + exclusive deals']].map(([tier, req, benefit]) => (
                    <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e0e0e0', fontSize: '0.9rem' }}>
                      <span style={{ color: TIER_COLORS[tier], fontWeight: 600 }}>🏆 {tier}</span>
                      <span style={{ color: '#888' }}>{req} pts</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
