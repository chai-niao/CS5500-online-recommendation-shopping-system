const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { shoppingLists, products } = require('../data/mockData');

const router = express.Router();

// GET /api/lists
router.get('/', authMiddleware, (req, res) => {
  const uid = req.user.id;
  res.json({ lists: shoppingLists[uid] || [] });
});

// POST /api/lists - create a new list
router.post('/', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'List name is required' });
  if (!shoppingLists[uid]) shoppingLists[uid] = [];
  const newList = { id: uuidv4(), name, items: [], createdAt: new Date().toISOString().split('T')[0], syncedToDevice: false };
  shoppingLists[uid].push(newList);
  res.status(201).json({ list: newList });
});

// POST /api/lists/:listId/items
router.post('/:listId/items', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const list = (shoppingLists[uid] || []).find(l => l.id === req.params.listId);
  if (!list) return res.status(404).json({ message: 'List not found' });
  const { productId, name } = req.body;
  const product = products.find(p => p.id === productId);
  const itemName = name || product?.name || 'Unknown Item';
  const exists = list.items.find(i => i.productId === productId);
  if (!exists) {
    list.items.push({ productId, name: itemName, checked: false });
  }
  res.json({ list });
});

// PUT /api/lists/:listId/items/:productId - toggle check
router.put('/:listId/items/:productId', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const list = (shoppingLists[uid] || []).find(l => l.id === req.params.listId);
  if (!list) return res.status(404).json({ message: 'List not found' });
  const item = list.items.find(i => i.productId === req.params.productId);
  if (item) item.checked = !item.checked;
  res.json({ list });
});

// DELETE /api/lists/:listId
router.delete('/:listId', authMiddleware, (req, res) => {
  const uid = req.user.id;
  shoppingLists[uid] = (shoppingLists[uid] || []).filter(l => l.id !== req.params.listId);
  res.json({ message: 'List deleted' });
});

// POST /api/lists/:listId/sync - simulate sync to in-store device
router.post('/:listId/sync', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const list = (shoppingLists[uid] || []).find(l => l.id === req.params.listId);
  if (!list) return res.status(404).json({ message: 'List not found' });
  list.syncedToDevice = true;
  list.lastSynced = new Date().toISOString();
  // TODO: Implement real-time sync to in-store kiosk/device via WebSocket or push notification
  res.json({ list, message: 'List synced to in-store device (simulated)' });
});

module.exports = router;
