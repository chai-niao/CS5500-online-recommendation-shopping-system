import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';

const CATEGORIES = ['All', 'Produce', 'Bakery', 'Dairy', 'Meat & Seafood', 'Beverages', 'Snacks', 'Festival'];

const s = {
  container: { maxWidth: 1200, margin: '2rem auto', padding: '0 2rem' },
  layout: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem' },
  sidebar: { background: 'white', borderRadius: 10, padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: 'fit-content' },
  catBtn: (active) => ({ display: 'block', width: '100%', padding: '0.6rem 0.8rem', marginBottom: '0.4rem', background: active ? '#e3f2fd' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontWeight: active ? 600 : 400, color: active ? '#1976d2' : '#444', fontSize: '0.9rem' }),
  header: { background: 'white', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.2rem' },
  empty: { textAlign: 'center', padding: '3rem', color: '#888', background: 'white', borderRadius: 10 },
  sort: { padding: '0.5rem 0.8rem', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
};

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const featured = searchParams.get('featured') || '';
  const activeCategory = category || 'All';

  useEffect(() => {
    setLoading(true);
    productsAPI.getAll({ q, category: category !== 'All' ? category : undefined, featured: featured || undefined, limit: 50 })
      .then(res => {
        let prods = res.data.products;
        if (sortBy === 'price-asc') prods = [...prods].sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-desc') prods = [...prods].sort((a, b) => b.price - a.price);
        else if (sortBy === 'rating') prods = [...prods].sort((a, b) => b.rating - a.rating);
        setProducts(prods);
        setTotal(res.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q, category, featured, sortBy]);

  const setCategory = (cat) => {
    const params = {};
    if (q) params.q = q;
    if (cat !== 'All') params.category = cat;
    setSearchParams(params);
  };

  return (
    <div style={s.container}>
      <div style={s.layout}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <h4 style={{ color: '#1976d2', marginBottom: '1rem', fontSize: '1rem' }}>Categories</h4>
          {CATEGORIES.map(cat => (
            <button key={cat} style={s.catBtn(activeCategory === cat || (cat === 'All' && !category))} onClick={() => setCategory(cat)}>{cat}</button>
          ))}
        </div>

        {/* Results */}
        <div>
          <div style={s.header}>
            <div>
              <h2 style={{ color: '#333', fontSize: '1.3rem' }}>
                {q ? `Results for "${q}"` : category || (featured ? 'Featured Products' : 'All Products')}
              </h2>
              <p style={{ color: '#888', fontSize: '0.88rem' }}>{total} products found</p>
            </div>
            <select style={s.sort} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading...</div>
          ) : products.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: '3rem' }}>🔍</div>
              <p style={{ marginTop: '1rem' }}>No products found. Try a different search.</p>
            </div>
          ) : (
            <div style={s.grid}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
