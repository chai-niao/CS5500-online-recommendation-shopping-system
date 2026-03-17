const { tagOverlapScore } = require('./tagSystem');

const num = (v, d) => {
  const parsed = parseFloat(v);
  return Number.isFinite(parsed) ? parsed : d;
};

const WEIGHTS = {
  tagMatch: () => num(process.env.RANK_WEIGHT_TAG, 0.5),
  popularity: () => num(process.env.RANK_WEIGHT_POPULARITY, 0.2),
  rating: () => num(process.env.RANK_WEIGHT_RATING, 0.15),
  featured: () => num(process.env.RANK_WEIGHT_FEATURED, 0.05),
  priceAffinity: () => num(process.env.RANK_WEIGHT_PRICE, 0.05),
  freshness: () => num(process.env.RANK_WEIGHT_FRESHNESS, 0.05),
  embeddingBlend: () => num(process.env.RANK_BLEND_EMBEDDING, 0.25)
};

const normalize01 = (v, min, max) => {
  if (max <= min) return 0;
  return (v - min) / (max - min);
};

const getUserPricePreference = (user) => {
  const lower = (user?.dietaryPreferences || []).map(v => v.toLowerCase());
  if (lower.includes('organic')) return 'mid';
  return 'budget';
};

const rankProducts = ({ user, products, embeddingScores = {} }) => {
  const weights = {
    tagMatch: WEIGHTS.tagMatch(),
    popularity: WEIGHTS.popularity(),
    rating: WEIGHTS.rating(),
    featured: WEIGHTS.featured(),
    priceAffinity: WEIGHTS.priceAffinity(),
    freshness: WEIGHTS.freshness(),
    embeddingBlend: WEIGHTS.embeddingBlend()
  };

  const reviewCounts = products.map(p => p.reviewCount || 0);
  const minReviews = Math.min(...reviewCounts, 0);
  const maxReviews = Math.max(...reviewCounts, 1);

  const userTags = user._profileTags || [];
  const userPrice = getUserPricePreference(user);

  const ranked = products.map(product => {
    const tagScore = tagOverlapScore(product._normalizedTags || [], userTags);
    const popularityScore = normalize01(product.reviewCount || 0, minReviews, maxReviews);
    const ratingScore = (product.rating || 0) / 5;
    const featuredScore = product.featured ? 1 : 0;
    const priceScore = (product._normalizedTags || []).includes(`price:${userPrice}`) ? 1 : 0.4;
    const freshnessScore = Math.min((product.stock || 0) / 100, 1);

    const ruleScore =
      tagScore * weights.tagMatch +
      popularityScore * weights.popularity +
      ratingScore * weights.rating +
      featuredScore * weights.featured +
      priceScore * weights.priceAffinity +
      freshnessScore * weights.freshness;

    const embeddingScore = Number.isFinite(embeddingScores[product.id]) ? embeddingScores[product.id] : null;
    const finalScore = embeddingScore === null
      ? ruleScore
      : ((1 - weights.embeddingBlend) * ruleScore + weights.embeddingBlend * embeddingScore);

    return {
      product,
      score: finalScore,
      scoreBreakdown: { tagScore, popularityScore, ratingScore, featuredScore, priceScore, freshnessScore, ruleScore, embeddingScore }
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return { ranked, weights };
};

module.exports = { rankProducts };
