const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const pool = require('../db/postgres');
const { getDb, tryGetDb } = require('../db/mongo');
const { logUserEvent } = require('../recommendation/behaviorLogger');

const router = express.Router();

// GET /api/orders - get user orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [uid]
    );

    const orders = [];
    for (const row of ordersResult.rows) {
      const itemsResult = await pool.query(
        'SELECT product_id, name, quantity, price FROM order_items WHERE order_id = $1', [row.id]
      );
      orders.push(mapOrderRow(row, itemsResult.rows));
    }

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    const itemsResult = await pool.query(
      'SELECT product_id, name, quantity, price FROM order_items WHERE order_id = $1', [req.params.id]
    );
    res.json({ order: mapOrderRow(result.rows[0], itemsResult.rows) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/orders - create order (simulated checkout)
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const uid = req.user.id;
    const { shippingAddress, paymentMethod, promoCode, selectedProductIds } = req.body;

    // Get cart items from PG
    const cartResult = await client.query(`
      SELECT ci.product_id, ci.quantity
      FROM cart_items ci JOIN carts c ON ci.cart_id = c.id
      WHERE c.user_id = $1
    `, [uid]);

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const selectedSet = Array.isArray(selectedProductIds) && selectedProductIds.length > 0
      ? new Set(selectedProductIds)
      : null;

    const selectedRows = selectedSet
      ? cartResult.rows.filter((row) => selectedSet.has(row.product_id))
      : cartResult.rows;

    if (selectedRows.length === 0) {
      return res.status(400).json({ message: 'No selected cart items to checkout' });
    }

    // Fetch product details from MongoDB
    const productIds = selectedRows.map(r => r.product_id);
    const products = await getDb().collection('products')
      .find({ id: { $in: productIds } }).toArray();
    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    const cartItems = selectedRows.map(row => {
      const product = productMap[row.product_id];
      return {
        productId: row.product_id,
        name: product ? product.name : 'Unknown',
        quantity: row.quantity,
        price: product ? product.price : 0,
      };
    });

    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let discount = 0;

    if (promoCode) {
      const promoResult = await client.query(
        'SELECT * FROM promotions WHERE code = $1 AND active = true', [promoCode]
      );
      if (promoResult.rows.length > 0) {
        const promo = promoResult.rows[0];
        if (subtotal >= parseFloat(promo.min_order)) {
          discount = promo.type === 'percentage'
            ? subtotal * (parseFloat(promo.discount) / 100)
            : parseFloat(promo.discount);
        }
      }
    }

    const total = Math.max(0, subtotal - discount);
    const loyaltyPointsEarned = Math.floor(total);
    const orderId = uuidv4();

    await client.query('BEGIN');

    // Insert order
    await client.query(`
      INSERT INTO orders (id, user_id, status, subtotal, discount, loyalty_points_earned, total, shipping_address, payment_method, created_at)
      VALUES ($1, $2, 'Processing', $3, $4, $5, $6, $7, $8, CURRENT_DATE)
    `, [orderId, uid, subtotal.toFixed(2), discount.toFixed(2), loyaltyPointsEarned, total.toFixed(2), shippingAddress, paymentMethod]);

    // Insert order items
    for (const item of cartItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, name, quantity, price) VALUES ($1, $2, $3, $4, $5)',
        [orderId, item.productId, item.name, item.quantity, item.price]
      );
    }

    // Update user loyalty points and order history
    await client.query(
      'UPDATE users SET loyalty_points = loyalty_points + $1, order_history = array_append(order_history, $2) WHERE id = $3',
      [loyaltyPointsEarned, orderId, uid]
    );

    // Remove only purchased items from cart
    await client.query(
      'DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1) AND product_id = ANY($2::text[])',
      [uid, productIds]
    );

    await client.query('COMMIT');

    const db = tryGetDb();
    await logUserEvent({
      db,
      userId: uid,
      action: 'checkout',
      data: {
        orderId,
        total: parseFloat(total.toFixed(2)),
        itemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      }
    });
    for (const item of cartItems) {
      await logUserEvent({
        db,
        userId: uid,
        action: 'purchase',
        productId: item.productId,
        data: {
          orderId,
          quantity: item.quantity,
          price: item.price,
        }
      });
    }

    const order = {
      id: orderId,
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

    res.status(201).json({ order });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
});

// Validate promo code
router.post('/validate-promo', authMiddleware, async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const result = await pool.query(
      'SELECT * FROM promotions WHERE code = $1 AND active = true', [code]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Invalid promo code' });

    const promo = result.rows[0];
    if (subtotal < parseFloat(promo.min_order)) {
      return res.status(400).json({ message: `Minimum order $${promo.min_order} required` });
    }

    const discount = promo.type === 'percentage'
      ? subtotal * (parseFloat(promo.discount) / 100)
      : parseFloat(promo.discount);

    res.json({
      promo: {
        id: promo.id,
        code: promo.code,
        discount: parseFloat(promo.discount),
        type: promo.type,
        description: promo.description,
        minOrder: parseFloat(promo.min_order),
        active: promo.active,
      },
      discount: parseFloat(discount.toFixed(2)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

function mapOrderRow(row, itemRows) {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    items: itemRows.map(i => ({
      productId: i.product_id,
      name: i.name,
      quantity: i.quantity,
      price: parseFloat(i.price),
    })),
    subtotal: parseFloat(row.subtotal),
    discount: parseFloat(row.discount),
    loyaltyPointsEarned: row.loyalty_points_earned,
    total: parseFloat(row.total),
    shippingAddress: row.shipping_address,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at || undefined,
  };
}

module.exports = router;
