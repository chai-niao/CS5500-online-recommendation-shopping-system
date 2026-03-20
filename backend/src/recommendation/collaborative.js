const num = (v, d) => {
  const parsed = parseFloat(v);
  return Number.isFinite(parsed) ? parsed : d;
};

const CONFIG = {
  purchaseWeight: () => num(process.env.COLLAB_WEIGHT_PURCHASE, 3),
  cartWeight: () => num(process.env.COLLAB_WEIGHT_CART, 2),
  viewWeight: () => num(process.env.COLLAB_WEIGHT_VIEW, 1),
  topKUsers: () => Math.max(1, parseInt(process.env.COLLAB_TOP_K_USERS || '20', 10)),
  maxEvents: () => Math.max(100, parseInt(process.env.COLLAB_MAX_EVENTS || '50000', 10)),
  recencyHalfLifeDays: () => num(process.env.COLLAB_HALF_LIFE_DAYS, 90),
  cacheTtlSec: () => Math.max(0, parseInt(process.env.COLLAB_CACHE_TTL_SEC || '60', 10)),
};

const userScoreCache = new Map();

const toDecay = (ts, halfLifeDays) => {
  if (!ts) return 1;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return 1;
  const days = Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  return Math.exp((-Math.log(2) * days) / Math.max(1, halfLifeDays));
};

const addScore = (vectors, userId, productId, score) => {
  if (!userId || !productId || !Number.isFinite(score) || score <= 0) return;
  const userMap = vectors.get(userId) || new Map();
  userMap.set(productId, (userMap.get(productId) || 0) + score);
  vectors.set(userId, userMap);
};

const dotCosine = (a, b) => {
  if (!a || !b || a.size === 0 || b.size === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [, v] of a) normA += v * v;
  for (const [, v] of b) normB += v * v;

  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [k, sv] of small) {
    const lv = large.get(k);
    if (lv) dot += sv * lv;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const normalizeScoreMap = (scoreMap) => {
  const values = Object.values(scoreMap);
  if (values.length === 0) return {};
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max <= min) {
    const out = {};
    Object.keys(scoreMap).forEach(k => { out[k] = 1; });
    return out;
  }
  const out = {};
  Object.entries(scoreMap).forEach(([k, v]) => {
    out[k] = (v - min) / (max - min);
  });
  return out;
};

const getProductIdFromLog = (log) => {
  if (!log) return null;
  if (typeof log.productId === 'string' && log.productId) return log.productId;
  if (log.data && typeof log.data.productId === 'string' && log.data.productId) return log.data.productId;
  return null;
};

const buildInteractionVectors = async ({ pool, mongoDb }) => {
  const vectors = new Map();
  const cfg = {
    purchaseWeight: CONFIG.purchaseWeight(),
    cartWeight: CONFIG.cartWeight(),
    viewWeight: CONFIG.viewWeight(),
    halfLife: CONFIG.recencyHalfLifeDays(),
  };

  const purchases = await pool.query(`
    SELECT o.user_id, oi.product_id, SUM(oi.quantity) AS qty, MAX(o.created_at) AS last_at
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    GROUP BY o.user_id, oi.product_id
  `);

  purchases.rows.forEach(row => {
    const qty = Number(row.qty) || 0;
    const decay = toDecay(row.last_at, cfg.halfLife);
    addScore(vectors, row.user_id, row.product_id, qty * cfg.purchaseWeight * decay);
  });

  const carts = await pool.query(`
    SELECT c.user_id, ci.product_id, SUM(ci.quantity) AS qty, MAX(c.updated_at) AS last_at
    FROM cart_items ci
    JOIN carts c ON c.id = ci.cart_id
    GROUP BY c.user_id, ci.product_id
  `);

  carts.rows.forEach(row => {
    const qty = Number(row.qty) || 0;
    const decay = toDecay(row.last_at, cfg.halfLife);
    addScore(vectors, row.user_id, row.product_id, qty * cfg.cartWeight * decay);
  });

  if (mongoDb) {
    const logs = await mongoDb.collection('user_activity_logs')
      .find({ action: { $in: ['view_product', 'add_to_cart', 'checkout', 'purchase'] } })
      .sort({ timestamp: -1 })
      .limit(CONFIG.maxEvents())
      .toArray();

    logs.forEach(log => {
      const userId = log.userId;
      const productId = getProductIdFromLog(log);
      if (!userId || !productId) return;

      let base = cfg.viewWeight;
      if (log.action === 'add_to_cart') base = cfg.cartWeight;
      if (log.action === 'checkout' || log.action === 'purchase') base = cfg.purchaseWeight;

      const decay = toDecay(log.timestamp, cfg.halfLife);
      addScore(vectors, userId, productId, base * decay);
    });
  }

  return vectors;
};

const getCollaborativeScoresForUser = async ({ userId, pool, mongoDb }) => {
  if (!userId) return { available: false, reason: 'Missing userId', scores: {}, meta: {} };

  const ttlMs = CONFIG.cacheTtlSec() * 1000;
  if (ttlMs > 0) {
    const cached = userScoreCache.get(userId);
    if (cached && (Date.now() - cached.ts) < ttlMs) {
      return cached.payload;
    }
  }

  const vectors = await buildInteractionVectors({ pool, mongoDb });
  const target = vectors.get(userId);
  if (!target || target.size === 0) {
    const payload = {
      available: false,
      reason: 'No interaction history yet for current user',
      scores: {},
      meta: { similarUsersCount: 0, candidatesCount: 0 }
    };
    if (ttlMs > 0) userScoreCache.set(userId, { ts: Date.now(), payload });
    return payload;
  }

  const sims = [];
  for (const [otherUserId, vec] of vectors) {
    if (otherUserId === userId) continue;
    const similarity = dotCosine(target, vec);
    if (similarity > 0) sims.push({ userId: otherUserId, similarity, vec });
  }

  sims.sort((a, b) => b.similarity - a.similarity);
  const top = sims.slice(0, CONFIG.topKUsers());
  if (top.length === 0) {
    const payload = {
      available: false,
      reason: 'No similar users found',
      scores: {},
      meta: { similarUsersCount: 0, candidatesCount: 0 }
    };
    if (ttlMs > 0) userScoreCache.set(userId, { ts: Date.now(), payload });
    return payload;
  }

  const seen = new Set([...target.keys()]);
  const raw = {};

  top.forEach(({ similarity, vec }) => {
    for (const [productId, val] of vec) {
      if (seen.has(productId)) continue;
      raw[productId] = (raw[productId] || 0) + similarity * val;
    }
  });

  const normalized = normalizeScoreMap(raw);
  const payload = {
    available: Object.keys(normalized).length > 0,
    reason: Object.keys(normalized).length > 0 ? 'ok' : 'No collaborative candidates after filtering',
    scores: normalized,
    meta: {
      similarUsersCount: top.length,
      candidatesCount: Object.keys(normalized).length,
      topSimilarity: top[0] ? Number(top[0].similarity.toFixed(4)) : 0,
    }
  };
  if (ttlMs > 0) userScoreCache.set(userId, { ts: Date.now(), payload });
  return payload;
};

module.exports = {
  getCollaborativeScoresForUser,
};
