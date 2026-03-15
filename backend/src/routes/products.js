const express = require('express');
const { products, festivals } = require('../data/mockData');

const router = express.Router();

// GET /api/products - list with optional filters
router.get('/', (req, res) => {
  const { category, q, festivalTag, featured, limit = 20, page = 1 } = req.query;
  let result = [...products];

  if (category) result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  if (festivalTag) result = result.filter(p => p.festivalTags.includes(festivalTag));
  if (featured === 'true') result = result.filter(p => p.featured);
  if (q) {
    const query = q.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.tags.some(t => t.includes(query))
    );
  }

  const total = result.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const paginated = result.slice(start, start + parseInt(limit));

  res.json({ products: paginated, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/products/categories - all categories
router.get('/categories', (req, res) => {
  const categories = [...new Set(products.map(p => p.category))];
  res.json({ categories });
});

// GET /api/products/festivals - festival list
router.get('/festivals', (req, res) => {
  res.json({ festivals });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
});

module.exports = router;
