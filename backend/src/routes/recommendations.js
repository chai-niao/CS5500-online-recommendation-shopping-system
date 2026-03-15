const express = require('express');
const authMiddleware = require('../middleware/auth');
const { products, users, festivals } = require('../data/mockData');

const router = express.Router();

/**
 * Simple content-based recommendation:
 * Based on user's dietary preferences and cultural interests,
 * filter and rank products.
 * (DB/ML interface reserved for future implementation)
 */
const getPersonalizedRecommendations = (user, limit = 8) => {
  const prefs = (user.dietaryPreferences || []).map(p => p.toLowerCase());
  const interests = (user.culturalInterests || []).map(i => i.toLowerCase());

  let scored = products.map(product => {
    let score = 0;
    // Dietary match
    prefs.forEach(pref => {
      if (product.tags.some(t => t.toLowerCase().includes(pref.split('-')[0]))) score += 2;
      if (product.dietaryInfo.some(d => d.toLowerCase().includes(pref.split('-')[0]))) score += 2;
    });
    // Festival match
    interests.forEach(interest => {
      if (product.festivalTags.some(ft => ft.toLowerCase().includes(interest.split(' ')[0]))) score += 3;
    });
    // Featured bonus
    if (product.featured) score += 1;
    // Rating bonus
    score += product.rating * 0.5;
    return { ...product, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, limit).map(({ _score, ...p }) => p);
};

// GET /api/recommendations - personalized recommendations
router.get('/', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const limit = parseInt(req.query.limit) || 8;
  if (!user) return res.status(404).json({ message: 'User not found' });
  const recs = getPersonalizedRecommendations(user, limit);
  res.json({
    recommendations: recs,
    basedOn: { dietaryPreferences: user.dietaryPreferences, culturalInterests: user.culturalInterests },
    // TODO: Replace with collaborative filtering + content-based ML model (DB required)
    note: 'Content-based recommendations. Full hybrid ML recommendations pending DB integration.'
  });
});

// GET /api/recommendations/festival - festival-aware recommendations
router.get('/festival', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const now = new Date();
  const upcoming = festivals
    .filter(f => {
      const diff = (new Date(f.date) - now) / (1000 * 60 * 60 * 24);
      return diff >= -7 && diff <= 90;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const festivalProducts = upcoming.map(f => ({
    festival: f,
    products: products.filter(p => p.festivalTags.some(t => f.tags.includes(t))).slice(0, 6)
  }));

  res.json({ festivalRecommendations: festivalProducts });
});

// GET /api/recommendations/similar/:productId - similar products
router.get('/similar/:productId', (req, res) => {
  const product = products.find(p => p.id === req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const similar = products
    .filter(p => p.id !== product.id && p.category === product.category)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);
  res.json({ similar });
});

module.exports = router;
