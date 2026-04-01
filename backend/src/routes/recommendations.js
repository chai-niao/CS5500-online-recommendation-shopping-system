const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db/postgres');
const { getDb, tryGetDb } = require('../db/mongo');
const { inferProductTags, buildUserTagProfile, tagOverlapScore } = require('../recommendation/tagSystem');
const { rankProducts } = require('../recommendation/ranker');
const { getEmbeddingServiceStatus, getEmbeddingScoresForUserItems } = require('../recommendation/embeddingClient');
const { getTagExtractionStatus, extractCandidateTagsForProduct } = require('../recommendation/tagExtractionClient');
const { getCollaborativeScoresForUser } = require('../recommendation/collaborative');

const router = express.Router();

const num = (v, d) => {
  const parsed = parseFloat(v);
  return Number.isFinite(parsed) ? parsed : d;
};

const int = (v, d) => {
  const parsed = parseInt(v, 10);
  return Number.isFinite(parsed) ? parsed : d;
};

const isAiTagEnrichmentEnabled = () => process.env.RANK_ENABLE_AI_TAG_ENRICHMENT !== 'false';
const isCollaborativeEnabled = () => process.env.RANK_ENABLE_COLLABORATIVE !== 'false';

const normalizeAiTag = (tag) => {
  if (!tag || typeof tag !== 'string') return null;
  const trimmed = tag.trim();
  if (!trimmed.includes(':')) return null;
  // Align model output with current ranker conventions
  if (trimmed.startsWith('priceBand:')) return `price:${trimmed.split(':')[1]}`;
  return trimmed;
};

const mergeTags = (baseTags = [], aiTags = []) => {
  const allowed = ['category:', 'dietary:', 'festival:', 'occasion:', 'price:'];
  const set = new Set(baseTags);
  aiTags
    .map(normalizeAiTag)
    .filter(Boolean)
    .filter(t => allowed.some(prefix => t.startsWith(prefix)))
    .forEach(t => set.add(t));
  return [...set];
};

async function mapWithConcurrency(items, concurrency, worker) {
  const out = new Array(items.length);
  let cursor = 0;

  const run = async () => {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= items.length) break;
      out[idx] = await worker(items[idx], idx);
    }
  };

  const poolSize = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: poolSize }, () => run()));
  return out;
}

async function enrichCandidatesWithAiTags(candidates) {
  const status = getTagExtractionStatus();
  if (!isAiTagEnrichmentEnabled()) {
    return { enabled: false, available: false, reason: 'AI tag enrichment disabled by config', attempted: 0, enriched: 0, modelReadyCount: 0, fallbackCount: 0 };
  }
  if (!status.enabled) {
    return { enabled: true, available: false, reason: 'TAG_EXTRACTION_ENABLED=false', attempted: 0, enriched: 0, modelReadyCount: 0, fallbackCount: 0 };
  }

  const maxCandidates = Math.max(1, int(process.env.RANK_AI_TAG_MAX_CANDIDATES, 30));
  const concurrency = Math.max(1, int(process.env.RANK_AI_TAG_CONCURRENCY, 6));

  const selected = [...candidates]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, maxCandidates);

  let modelReadyCount = 0;
  let fallbackCount = 0;
  let enriched = 0;

  await mapWithConcurrency(selected, concurrency, async (product) => {
    const result = await extractCandidateTagsForProduct(product);
    if (result.modelReady) modelReadyCount += 1;
    if (result.source === 'heuristic-fallback') fallbackCount += 1;

    const merged = mergeTags(product._normalizedTags || [], result.tags || []);
    if (merged.length > (product._normalizedTags || []).length) enriched += 1;
    product._normalizedTags = merged;
  });

  return {
    enabled: true,
    available: true,
    reason: 'ok',
    attempted: selected.length,
    enriched,
    modelReadyCount,
    fallbackCount,
    maxCandidates,
    concurrency,
  };
}

function formatDateOnly(value) {
  if (!value) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

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
    const aiTagEnrichment = await enrichCandidatesWithAiTags(candidates);
    const profileTags = buildUserTagProfile(user);
    const userWithProfile = { ...user, _profileTags: profileTags };
    const embedding = await getEmbeddingScoresForUserItems(userWithProfile, candidates);
    const collaborative = isCollaborativeEnabled()
      ? await getCollaborativeScoresForUser({ userId: user.id, pool, mongoDb: tryGetDb() })
      : {
        available: false,
        reason: 'Collaborative filtering disabled by config',
        scores: {},
        meta: { similarUsersCount: 0, candidatesCount: 0 }
      };

    const { ranked, weights } = rankProducts({ user: userWithProfile, products: candidates, embeddingScores: embedding.scores });
    const collabBlend = num(process.env.RANK_BLEND_COLLABORATIVE, 0.3);
    const blended = ranked.map(item => {
      const collabScore = Number.isFinite(collaborative.scores[item.product.id]) ? collaborative.scores[item.product.id] : null;
      const score = collaborative.available && collabScore !== null
        ? ((1 - collabBlend) * item.score + collabBlend * collabScore)
        : item.score;
      return { ...item, blendedScore: score, _collabScore: collabScore };
    }).sort((a, b) => b.blendedScore - a.blendedScore);

    const recs = blended.slice(0, limit).map(r => r.product);

    res.json({
      recommendations: recs,
      basedOn: { dietaryPreferences: user.dietaryPreferences, culturalInterests: user.culturalInterests },
      strategy: {
        pipeline: ['2-tag-system', '4-formula-ranking', '3-embedding-hybrid', '6-collaborative-filtering', '5-ai-tagging-slot'],
        weights,
        collaborative: {
          enabled: isCollaborativeEnabled(),
          blend: collabBlend,
          available: collaborative.available,
          reason: collaborative.reason,
          similarUsersCount: collaborative.meta?.similarUsersCount || 0,
          candidatesCount: collaborative.meta?.candidatesCount || 0,
        },
        aiTagEnrichment,
        embedding: {
          provider: getEmbeddingServiceStatus().provider,
          model: getEmbeddingServiceStatus().model,
          enabled: getEmbeddingServiceStatus().enabled,
          available: embedding.available,
          reason: embedding.reason,
        },
      },
      note: collaborative.available
        ? 'Hybrid recommendations active: AI-tag-enriched rule+embedding ranking blended with collaborative filtering.'
        : (embedding.available
          ? 'Hybrid recommendations active: AI-tag-enriched rule ranking + embedding blending. Collaborative filtering is in fallback mode.'
          : 'Hybrid pipeline is active with AI-tag/embedding/collaborative slots reserved. Currently using tag+formula fallback for unavailable components.'),
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
          id: f.id, name: f.name, emoji: f.emoji, date: formatDateOnly(f.date),
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
    pipeline: ['2-tag-system', '4-formula-ranking', '3-embedding-hybrid', '6-collaborative-filtering', '5-ai-tagging-slot'],
    embedding: getEmbeddingServiceStatus(),
    tagExtraction: getTagExtractionStatus(),
    collaborative: {
      enabled: isCollaborativeEnabled(),
      blend: num(process.env.RANK_BLEND_COLLABORATIVE, 0.3),
      topKUsers: parseInt(process.env.COLLAB_TOP_K_USERS || '20', 10),
      weights: {
        purchase: num(process.env.COLLAB_WEIGHT_PURCHASE, 3),
        cart: num(process.env.COLLAB_WEIGHT_CART, 2),
        view: num(process.env.COLLAB_WEIGHT_VIEW, 1),
      },
      cacheTtlSec: Math.max(0, int(process.env.COLLAB_CACHE_TTL_SEC, 60)),
    },
    aiTagEnrichment: {
      enabled: isAiTagEnrichmentEnabled(),
      maxCandidates: Math.max(1, int(process.env.RANK_AI_TAG_MAX_CANDIDATES, 30)),
      concurrency: Math.max(1, int(process.env.RANK_AI_TAG_CONCURRENCY, 6)),
    }
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
