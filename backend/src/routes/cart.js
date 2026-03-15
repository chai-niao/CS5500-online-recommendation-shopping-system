const express = require('express');
const authMiddleware = require('../middleware/auth');
const { carts, products } = require('../data/mockData');

const router = express.Router();

const enrichCart = (cartData) => {
  const items = (cartData?.items || []).map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;
    return { ...item, product };
  }).filter(Boolean);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return { items, subtotal: parseFloat(subtotal.toFixed(2)) };
};

// GET /api/cart
router.get('/', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const cart = carts[uid] || { items: [] };
  res.json(enrichCart(cart));
});

// POST /api/cart/add
router.post('/add', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ message: 'productId is required' });
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  if (!carts[uid]) carts[uid] = { items: [], updatedAt: new Date().toISOString() };
  const existing = carts[uid].items.find(i => i.productId === productId);
  if (existing) {
    existing.quantity += parseInt(quantity);
  } else {
    carts[uid].items.push({ productId, quantity: parseInt(quantity) });
  }
  carts[uid].updatedAt = new Date().toISOString();
  res.json(enrichCart(carts[uid]));
});

// PUT /api/cart/update
router.put('/update', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const { productId, quantity } = req.body;
  if (!carts[uid]) return res.status(404).json({ message: 'Cart not found' });
  const item = carts[uid].items.find(i => i.productId === productId);
  if (!item) return res.status(404).json({ message: 'Item not in cart' });
  if (parseInt(quantity) <= 0) {
    carts[uid].items = carts[uid].items.filter(i => i.productId !== productId);
  } else {
    item.quantity = parseInt(quantity);
  }
  carts[uid].updatedAt = new Date().toISOString();
  res.json(enrichCart(carts[uid]));
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', authMiddleware, (req, res) => {
  const uid = req.user.id;
  if (!carts[uid]) return res.status(404).json({ message: 'Cart not found' });
  carts[uid].items = carts[uid].items.filter(i => i.productId !== req.params.productId);
  carts[uid].updatedAt = new Date().toISOString();
  res.json(enrichCart(carts[uid]));
});

// DELETE /api/cart/clear
router.delete('/clear', authMiddleware, (req, res) => {
  const uid = req.user.id;
  carts[uid] = { items: [], updatedAt: new Date().toISOString() };
  res.json({ items: [], subtotal: 0 });
});

module.exports = router;
