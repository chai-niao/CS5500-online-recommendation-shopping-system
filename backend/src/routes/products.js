const express = require('express');
const { getDb } = require('../db/mongo');
const pool = require('../db/postgres');

const router = express.Router();

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
      date: row.date,
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
    res.json({ product: cleaned });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
