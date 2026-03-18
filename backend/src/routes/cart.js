const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db/postgres');
const { getDb } = require('../db/mongo');

const router = express.Router();

async function enrichCart(userId) {
  // Get cart items from PG
  const result = await pool.query(`
    SELECT ci.product_id, ci.quantity
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    WHERE c.user_id = $1
  `, [userId]);

  if (result.rows.length === 0) {
    return { items: [], subtotal: 0 };
  }

  // Fetch product details from MongoDB
  const productIds = result.rows.map(r => r.product_id);
  const products = await getDb().collection('products')
    .find({ id: { $in: productIds } })
    .toArray();

  const productMap = {};
  products.forEach(p => { const { _id, ...rest } = p; productMap[p.id] = rest; });

  const items = result.rows
    .map(row => {
      const product = productMap[row.product_id];
      if (!product) return null;
      return { productId: row.product_id, quantity: row.quantity, product };
    })
    .filter(Boolean);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return { items, subtotal: parseFloat(subtotal.toFixed(2)) };
}

async function ensureCart(userId) {
  const result = await pool.query(
    'INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW() RETURNING id',
    [userId]
  );
  return result.rows[0].id;
}

// GET /api/cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json(await enrichCart(req.user.id));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/cart/add
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    // Verify product exists in MongoDB
    const product = await getDb().collection('products').findOne({ id: productId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const cartId = await ensureCart(uid);

    await pool.query(`
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + $3
    `, [cartId, productId, parseInt(quantity)]);

    await pool.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);

    res.json(await enrichCart(uid));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/cart/update
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const { productId, quantity } = req.body;

    if (parseInt(quantity) <= 0) {
      await pool.query(`
        DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1) AND product_id = $2
      `, [uid, productId]);
    } else {
      await pool.query(`
        UPDATE cart_items SET quantity = $1
        WHERE cart_id = (SELECT id FROM carts WHERE user_id = $2) AND product_id = $3
      `, [parseInt(quantity), uid, productId]);
    }

    await pool.query('UPDATE carts SET updated_at = NOW() WHERE user_id = $1', [uid]);
    res.json(await enrichCart(uid));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    await pool.query(`
      DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1) AND product_id = $2
    `, [uid, req.params.productId]);
    await pool.query('UPDATE carts SET updated_at = NOW() WHERE user_id = $1', [uid]);
    res.json(await enrichCart(uid));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    await pool.query(`
      DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)
    `, [uid]);
    await pool.query('UPDATE carts SET updated_at = NOW() WHERE user_id = $1', [uid]);
    res.json({ items: [], subtotal: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
