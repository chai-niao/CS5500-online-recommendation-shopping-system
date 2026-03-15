const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { orders, carts, users, products, promotions } = require('../data/mockData');

const router = express.Router();

// GET /api/orders - get user orders
router.get('/', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const userOrders = orders.filter(o => o.userId === uid);
  res.json({ orders: userOrders });
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, (req, res) => {
  const order = orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ order });
});

// POST /api/orders - create order (simulated checkout)
router.post('/', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const { shippingAddress, paymentMethod, promoCode } = req.body;

  const cart = carts[uid];
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const user = users.find(u => u.id === uid);
  const cartItems = cart.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { productId: item.productId, name: product.name, quantity: item.quantity, price: product.price };
  });

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let discount = 0;

  if (promoCode) {
    const promo = promotions.find(p => p.code === promoCode && p.active);
    if (promo && subtotal >= promo.minOrder) {
      discount = promo.type === 'percentage' ? subtotal * (promo.discount / 100) : promo.discount;
    }
  }

  const total = Math.max(0, subtotal - discount);
  const loyaltyPointsEarned = Math.floor(total);

  const newOrder = {
    id: uuidv4(),
    userId: uid,
    status: 'Processing',
    items: cartItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    loyaltyPointsEarned,
    total: parseFloat(total.toFixed(2)),
    shippingAddress,
    paymentMethod,
    createdAt: new Date().toISOString().split('T')[0],
  };

  orders.push(newOrder);
  if (user) {
    user.loyaltyPoints += loyaltyPointsEarned;
    user.orderHistory.push(newOrder.id);
  }

  // Clear cart
  carts[uid] = { items: [], updatedAt: new Date().toISOString() };

  res.status(201).json({ order: newOrder });
});

// Validate promo code
router.post('/validate-promo', authMiddleware, (req, res) => {
  const { code, subtotal } = req.body;
  const promo = promotions.find(p => p.code === code && p.active);
  if (!promo) return res.status(404).json({ message: 'Invalid promo code' });
  if (subtotal < promo.minOrder) return res.status(400).json({ message: `Minimum order $${promo.minOrder} required` });
  const discount = promo.type === 'percentage' ? subtotal * (promo.discount / 100) : promo.discount;
  res.json({ promo, discount: parseFloat(discount.toFixed(2)) });
});

module.exports = router;
