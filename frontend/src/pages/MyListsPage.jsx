import React, { useEffect, useState } from 'react';
import { listsAPI, productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';

const s = {
  container: { maxWidth: 1000, margin: '2rem auto', padding: '0 2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { color: '#1976d2', fontSize: '1.8rem', fontWeight: 'bold' },
  newBtn: { background: '#1976d2', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  card: { background: 'white', borderRadius: 10, padding: '1.8rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' },
  listTitle: { fontWeight: 700, fontSize: '1.15rem', color: '#222' },
  actions: { display: 'flex', gap: '0.7rem' },
  actionBtn: (color) => ({ background: 'none', border: `1px solid ${color}`, color, padding: '0.4rem 0.9rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }),
  item: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.7rem 0', borderBottom: '1px solid #f5f5f5' },
  checkbox: { width: 18, height: 18, cursor: 'pointer', accentColor: '#1976d2' },
  itemName: (checked) => ({ flex: 1, fontSize: '0.95rem', textDecoration: checked ? 'line-through' : 'none', color: checked ? '#aaa' : '#333' }),
  addCartBtn: { background: '#1976d2', color: 'white', border: 'none', padding: '0.3rem 0.7rem', borderRadius: 5, cursor: 'pointer', fontSize: '0.82rem' },
  syncBadge: (synced) => ({ padding: '0.25rem 0.6rem', borderRadius: 10, fontSize: '0.78rem', background: synced ? '#e8f5e9' : '#fff3e0', color: synced ? '#2e7d32' : '#e65100' }),
  newListModal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modalCard: { background: 'white', borderRadius: 12, padding: '2rem', width: 340 },
  input: { width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.95rem', outline: 'none', marginBottom: '1rem' },
  syncNote: { background: '#e3f2fd', color: '#1565c0', padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.82rem', marginTop: '0.8rem' },
};

export default function MyListsPage() {
  const { addToCart } = useCart();
  const [lists, setLists] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    listsAPI.getLists().then(res => setLists(res.data.lists)).catch(console.error);
    productsAPI.getAll({ limit: 50 }).then(res => setProducts(res.data.products)).catch(console.error);
  }, []);

  const createList = async () => {
    if (!newListName.trim()) return;
    const res = await listsAPI.createList(newListName.trim());
    setLists(prev => [...prev, res.data.list]);
    setNewListName('');
    setShowNewModal(false);
  };

  const toggleItem = async (listId, productId) => {
    const res = await listsAPI.toggleItem(listId, productId);
    setLists(prev => prev.map(l => l.id === listId ? res.data.list : l));
  };

  const deleteList = async (listId) => {
    await listsAPI.deleteList(listId);
    setLists(prev => prev.filter(l => l.id !== listId));
  };

  const syncList = async (listId) => {
    const res = await listsAPI.syncList(listId);
    setLists(prev => prev.map(l => l.id === listId ? res.data.list : l));
  };

  const addAllToCart = async (list) => {
    const unchecked = list.items.filter(i => !i.checked);
    await Promise.all(unchecked.map(i => addToCart(i.productId, 1)));
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.title}>📋 My Shopping Lists</h1>
        <button style={s.newBtn} onClick={() => setShowNewModal(true)}>+ New List</button>
      </div>

      <div style={{ background: '#e3f2fd', borderRadius: 8, padding: '0.8rem 1.2rem', marginBottom: '1.5rem', color: '#1565c0', fontSize: '0.88rem' }}>
        📱 You can sync your lists to in-store self-scanning devices. Tap "Sync to Device" to send your list to the kiosk.
      </div>

      {lists.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888', background: 'white', borderRadius: 10 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p>No shopping lists yet. Create one to get started!</p>
        </div>
      )}

      {lists.map(list => (
        <div key={list.id} style={s.card}>
          <div style={s.cardHeader}>
            <div>
              <span style={s.listTitle}>{list.name}</span>
              <span style={{ color: '#888', fontSize: '0.82rem', marginLeft: '0.8rem' }}>{list.createdAt}</span>
            </div>
            <div style={s.actions}>
              <span style={s.syncBadge(list.syncedToDevice)}>{list.syncedToDevice ? '📱 Synced' : '⬆️ Not Synced'}</span>
              <button style={s.actionBtn('#1976d2')} onClick={() => syncList(list.id)}>Sync to Device</button>
              <button style={s.actionBtn('#4caf50')} onClick={() => addAllToCart(list)}>Add All to Cart</button>
              <button style={s.actionBtn('#e53935')} onClick={() => deleteList(list.id)}>Delete</button>
            </div>
          </div>

          {list.items.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>No items in this list.</p>
          ) : (
            list.items.map(item => {
              const product = products.find(p => p.id === item.productId);
              return (
                <div key={item.productId} style={s.item}>
                  <input style={s.checkbox} type="checkbox" checked={item.checked} onChange={() => toggleItem(list.id, item.productId)} />
                  <span style={{ fontSize: '1.4rem' }}>{product?.emoji || '📦'}</span>
                  <span style={s.itemName(item.checked)}>{item.name}</span>
                  {product && <span style={{ color: '#1976d2', fontSize: '0.88rem', fontWeight: 600 }}>${product.price.toFixed(2)}</span>}
                  {!item.checked && product && (
                    <button style={s.addCartBtn} onClick={() => addToCart(item.productId, 1)}>+ Cart</button>
                  )}
                </div>
              );
            })
          )}

          {list.syncedToDevice && list.lastSynced && (
            <div style={s.syncNote}>Last synced: {new Date(list.lastSynced).toLocaleString()}</div>
          )}
        </div>
      ))}

      {/* New List Modal */}
      {showNewModal && (
        <div style={s.newListModal}>
          <div style={s.modalCard}>
            <h3 style={{ color: '#1976d2', marginBottom: '1rem' }}>Create New List</h3>
            <input style={s.input} placeholder="List name (e.g. Weekly Groceries)" value={newListName} onChange={e => setNewListName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createList()} autoFocus />
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button style={{ flex: 1, background: '#1976d2', color: 'white', border: 'none', padding: '0.7rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }} onClick={createList}>Create</button>
              <button style={{ flex: 1, background: 'white', color: '#666', border: '1px solid #ddd', padding: '0.7rem', borderRadius: 8, cursor: 'pointer' }} onClick={() => setShowNewModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
