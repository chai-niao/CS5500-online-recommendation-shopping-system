const express = require('express');
const { getDb } = require('../db/mongo');
const pool = require('../db/postgres');
const jwt = require('jsonwebtoken');
const { tryGetDb } = require('../db/mongo');
const { logUserEvent } = require('../recommendation/behaviorLogger');

const router = express.Router();

function getOptionalUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

function formatDateOnly(value) {
  if (!value) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

// GET /api/products - list with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, q, festivalTag, featured, limit = 20, page = 1 } = req.query;
    const col = getDb().collection('products');

    const filter = {};
    if (category) filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (festivalTag) filter.festivalTags = festivalTag;
    if (featured === 'true') filter.featured = true;
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { category: regex },
        { brand: regex },
        { tags: regex },
      ];
    }

    const total = await col.countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await col.find(filter).skip(skip).limit(parseInt(limit)).toArray();

    const cleaned = products.map(({ _id, ...rest }) => rest);

    const userId = getOptionalUserId(req);
    if (userId && q) {
      await logUserEvent({
        db: tryGetDb(),
        userId,
        action: 'search',
        data: {
          query: q,
          category: category || null,
          festivalTag: festivalTag || null,
          featured: featured || null,
          resultCount: cleaned.length,
          topProductIds: cleaned.slice(0, 10).map(p => p.id),
        },
      });
    }

    res.json({ products: cleaned, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/products/categories - all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await getDb().collection('products').distinct('category');
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/products/festivals - festival list
router.get('/festivals', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM festivals ORDER BY date');
    const festivals = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      date: formatDateOnly(row.date),
      tags: row.tags || [],
      color: row.color,
      description: row.description,
    }));
    res.json({ festivals });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await getDb().collection('products').findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { _id, ...cleaned } = product;

    const userId = getOptionalUserId(req);
    if (userId) {
      await logUserEvent({
        db: tryGetDb(),
        userId,
        action: 'view_product',
        productId: cleaned.id,
        data: { category: cleaned.category || null, price: cleaned.price || null }
      });
    }

    res.json({ product: cleaned });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
