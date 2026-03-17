const express = require('express');
const authMiddleware = require('../middleware/auth');
const { products, users, festivals } = require('../data/mockData');
const { inferProductTags, buildUserTagProfile, tagOverlapScore } = require('../recommendation/tagSystem');
const { rankProducts } = require('../recommendation/ranker');
const { getEmbeddingServiceStatus, getEmbeddingScoresForUserItems } = require('../recommendation/embeddingClient');
const { getTagExtractionStatus, extractCandidateTagsForProduct } = require('../recommendation/tagExtractionClient');

const router = express.Router();

const buildCandidates = () => products.map(p => ({ ...p, _normalizedTags: inferProductTags(p) }));

// GET /api/recommendations - personalized recommendations
router.get('/', authMiddleware, async (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const limit = parseInt(req.query.limit) || 8;
  if (!user) return res.status(404).json({ message: 'User not found' });

  const candidates = buildCandidates();
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
        reason: embedding.reason
      }
    },
    note: embedding.available
      ? 'Hybrid recommendations active: rule ranking + embedding blending.'
      : 'Hybrid pipeline is active with embedding slot reserved. Currently using tag+formula ranking fallback until BAAI service is ready.'
  });
});

// GET /api/recommendations/festival - festival-aware recommendations
router.get('/festival', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const userWithProfile = { ...user, _profileTags: buildUserTagProfile(user) };

  const now = new Date();
  const upcoming = festivals
    .filter(f => {
      const diff = (new Date(f.date) - now) / (1000 * 60 * 60 * 24);
      return diff >= -7 && diff <= 90;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const festivalProducts = upcoming.map(f => {
    const matched = products
      .filter(p => p.festivalTags.some(t => f.tags.includes(t)))
      .map(p => ({ ...p, _normalizedTags: inferProductTags(p) }));

    const { ranked } = rankProducts({ user: userWithProfile, products: matched, embeddingScores: {} });

    return {
      festival: f,
      products: ranked.slice(0, 6).map(r => r.product)
    };
  });

  res.json({ festivalRecommendations: festivalProducts });
});

// GET /api/recommendations/similar/:productId - similar products
router.get('/similar/:productId', (req, res) => {
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
});

// GET /api/recommendations/pipeline/status - model slots status
router.get('/pipeline/status', authMiddleware, (req, res) => {
  res.json({
    pipeline: ['2-tag-system', '4-formula-ranking', '3-embedding-hybrid', '5-ai-tagging-slot'],
    embedding: getEmbeddingServiceStatus(),
    tagExtraction: getTagExtractionStatus()
  });
});

// POST /api/recommendations/tags/extract/:productId - Qwen tag extraction slot
router.post('/tags/extract/:productId', authMiddleware, async (req, res) => {
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
    note: result.note
  });
});

module.exports = router;
