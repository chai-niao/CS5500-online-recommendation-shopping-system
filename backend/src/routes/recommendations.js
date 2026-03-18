const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db/postgres');
const { getDb } = require('../db/mongo');
const { inferProductTags, buildUserTagProfile, tagOverlapScore } = require('../recommendation/tagSystem');
const { rankProducts } = require('../recommendation/ranker');
const { getEmbeddingServiceStatus, getEmbeddingScoresForUserItems } = require('../recommendation/embeddingClient');
const { getTagExtractionStatus, extractCandidateTagsForProduct } = require('../recommendation/tagExtractionClient');

const router = express.Router();

async function getAllProducts() {
  const docs = await getDb().collection('products').find({}).toArray();
  return docs.map(({ _id, ...rest }) => rest);
}

async function getUserById(userId) {
  const result = await pool.query(
    'SELECT id, email, name, cultural_interests, dietary_preferences, loyalty_tier, loyalty_points FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    culturalInterests: row.cultural_interests || [],
    dietaryPreferences: row.dietary_preferences || [],
    loyaltyTier: row.loyalty_tier,
    loyaltyPoints: row.loyalty_points,
  };
}

const buildCandidates = (products) => products.map(p => ({ ...p, _normalizedTags: inferProductTags(p) }));

// GET /api/recommendations - personalized recommendations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    const limit = parseInt(req.query.limit) || 8;
    if (!user) return res.status(404).json({ message: 'User not found' });

    const products = await getAllProducts();
    const candidates = buildCandidates(products);
    const profileTags = buildUserTagProfile(user);
    const userWithProfile = { ...user, _profileTags: profileTags };
    const embedding = await getEmbeddingScoresForUserItems(userWithProfile, candidates);

    const { ranked, weights } = rankProducts({ user: userWithProfile, products: candidates, embeddingScores: embedding.scores });
    const recs = ranked.slice(0, limit).map(r => r.product);

    res.json({
      recommendations: recs,
      basedOn: { dietaryPreferences: user.dietaryPreferences, culturalInterests: user.culturalInterests },
      strategy: {
        pipeline: ['2-tag-system', '4-formula-ranking', '3-embedding-hybrid', '5-ai-tagging-slot'],
        weights,
        embedding: {
          provider: getEmbeddingServiceStatus().provider,
          model: getEmbeddingServiceStatus().model,
          enabled: getEmbeddingServiceStatus().enabled,
          available: embedding.available,
          reason: embedding.reason,
        },
      },
      note: embedding.available
        ? 'Hybrid recommendations active: rule ranking + embedding blending.'
        : 'Hybrid pipeline is active with embedding slot reserved. Currently using tag+formula ranking fallback until BAAI service is ready.',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/recommendations/festival - festival-aware recommendations
router.get('/festival', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userWithProfile = { ...user, _profileTags: buildUserTagProfile(user) };

    // Fetch festivals from PG
    const festResult = await pool.query('SELECT * FROM festivals ORDER BY date');
    const now = new Date();

    const upcoming = festResult.rows
      .filter(f => {
        const diff = (new Date(f.date) - now) / (1000 * 60 * 60 * 24);
        return diff >= -7 && diff <= 90;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const products = await getAllProducts();

    const festivalProducts = upcoming.map(f => {
      const tags = f.tags || [];
      const matched = products
        .filter(p => p.festivalTags.some(t => tags.includes(t)))
        .map(p => ({ ...p, _normalizedTags: inferProductTags(p) }));

      const { ranked } = rankProducts({ user: userWithProfile, products: matched, embeddingScores: {} });

      return {
        festival: {
          id: f.id, name: f.name, emoji: f.emoji, date: f.date,
          tags: f.tags, color: f.color, description: f.description,
        },
        products: ranked.slice(0, 6).map(r => r.product),
      };
    });

    res.json({ festivalRecommendations: festivalProducts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/recommendations/similar/:productId - similar products
router.get('/similar/:productId', async (req, res) => {
  try {
    const products = await getAllProducts();
    const product = products.find(p => p.id === req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const baseTags = inferProductTags(product);
    const similar = products
      .filter(p => p.id !== product.id)
      .map(p => {
        const pTags = inferProductTags(p);
        const overlap = tagOverlapScore(pTags, baseTags);
        const sameCategory = p.category === product.category ? 1 : 0;
        const score = overlap * 0.7 + sameCategory * 0.2 + (p.rating / 5) * 0.1;
        return { ...p, _score: score };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 4);

    res.json({ similar: similar.map(({ _score, ...rest }) => rest) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/recommendations/pipeline/status - model slots status
router.get('/pipeline/status', authMiddleware, (req, res) => {
  res.json({
    pipeline: ['2-tag-system', '4-formula-ranking', '3-embedding-hybrid', '5-ai-tagging-slot'],
    embedding: getEmbeddingServiceStatus(),
    tagExtraction: getTagExtractionStatus(),
  });
});

// POST /api/recommendations/tags/extract/:productId - Qwen tag extraction slot
router.post('/tags/extract/:productId', authMiddleware, async (req, res) => {
  try {
    const products = await getAllProducts();
    const product = products.find(p => p.id === req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const result = await extractCandidateTagsForProduct(product);
    res.json({
      productId: product.id,
      productName: product.name,
      candidateTags: result.tags,
      source: result.source,
      model: result.model,
      modelReady: result.modelReady,
      note: result.note,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
