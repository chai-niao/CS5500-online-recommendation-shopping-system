const { rankProducts } = require('../src/recommendation/ranker');

const makeProduct = (overrides = {}) => ({
  id: 'p1',
  name: 'Test Product',
  category: 'produce',
  price: 5,
  rating: 4.0,
  reviewCount: 50,
  stock: 80,
  featured: false,
  tags: [],
  dietaryInfo: [],
  festivalTags: [],
  _normalizedTags: ['category:produce', 'price:budget', 'occasion:daily'],
  ...overrides
});

const makeUser = (overrides = {}) => ({
  id: 'u1',
  dietaryPreferences: [],
  culturalInterests: [],
  _profileTags: [],
  ...overrides
});

describe('rankProducts', () => {
  test('should return ranked array and weights', () => {
    const products = [makeProduct()];
    const user = makeUser();
    const result = rankProducts({ user, products });

    expect(result).toHaveProperty('ranked');
    expect(result).toHaveProperty('weights');
    expect(Array.isArray(result.ranked)).toBe(true);
    expect(result.ranked.length).toBe(1);
  });

  test('each ranked item should have product, score, and scoreBreakdown', () => {
    const products = [makeProduct()];
    const user = makeUser();
    const { ranked } = rankProducts({ user, products });

    const item = ranked[0];
    expect(item).toHaveProperty('product');
    expect(item).toHaveProperty('score');
    expect(item).toHaveProperty('scoreBreakdown');
    expect(typeof item.score).toBe('number');
    expect(item.score).toBeGreaterThanOrEqual(0);
  });

  test('scoreBreakdown should contain all component scores', () => {
    const products = [makeProduct()];
    const user = makeUser();
    const { ranked } = rankProducts({ user, products });

    const breakdown = ranked[0].scoreBreakdown;
    expect(breakdown).toHaveProperty('tagScore');
    expect(breakdown).toHaveProperty('popularityScore');
    expect(breakdown).toHaveProperty('ratingScore');
    expect(breakdown).toHaveProperty('featuredScore');
    expect(breakdown).toHaveProperty('priceScore');
    expect(breakdown).toHaveProperty('freshnessScore');
    expect(breakdown).toHaveProperty('ruleScore');
    expect(breakdown).toHaveProperty('embeddingScore');
  });

  test('should rank higher-rated products above lower-rated ones', () => {
    const products = [
      makeProduct({ id: 'low', rating: 1.0, reviewCount: 10 }),
      makeProduct({ id: 'high', rating: 5.0, reviewCount: 10 })
    ];
    const user = makeUser();
    const { ranked } = rankProducts({ user, products });

    expect(ranked[0].product.id).toBe('high');
    expect(ranked[1].product.id).toBe('low');
  });

  test('should give featured products a bonus', () => {
    const products = [
      makeProduct({ id: 'normal', featured: false, rating: 4.0, reviewCount: 50 }),
      makeProduct({ id: 'feat', featured: true, rating: 4.0, reviewCount: 50 })
    ];
    const user = makeUser();
    const { ranked } = rankProducts({ user, products });

    const featItem = ranked.find(r => r.product.id === 'feat');
    const normItem = ranked.find(r => r.product.id === 'normal');
    expect(featItem.scoreBreakdown.featuredScore).toBe(1);
    expect(normItem.scoreBreakdown.featuredScore).toBe(0);
    expect(featItem.score).toBeGreaterThan(normItem.score);
  });

  test('should score tag overlap for matching user preferences', () => {
    const products = [
      makeProduct({
        id: 'match',
        _normalizedTags: ['dietary:vegan', 'price:budget', 'occasion:daily']
      }),
      makeProduct({
        id: 'nomatch',
        _normalizedTags: ['dietary:organic', 'price:premium', 'occasion:gift']
      })
    ];
    const user = makeUser({ _profileTags: ['dietary:vegan'] });
    const { ranked } = rankProducts({ user, products });

    const matchItem = ranked.find(r => r.product.id === 'match');
    const noMatchItem = ranked.find(r => r.product.id === 'nomatch');
    expect(matchItem.scoreBreakdown.tagScore).toBeGreaterThan(noMatchItem.scoreBreakdown.tagScore);
  });

  test('should blend embedding scores when provided', () => {
    const products = [makeProduct({ id: 'p1' })];
    const user = makeUser();

    const withoutEmb = rankProducts({ user, products });
    const withEmb = rankProducts({ user, products, embeddingScores: { p1: 0.9 } });

    expect(withoutEmb.ranked[0].scoreBreakdown.embeddingScore).toBeNull();
    expect(withEmb.ranked[0].scoreBreakdown.embeddingScore).toBe(0.9);
    expect(withEmb.ranked[0].score).not.toBe(withoutEmb.ranked[0].score);
  });

  test('embeddingScore null should fall back to pure rule score', () => {
    const products = [makeProduct({ id: 'p1' })];
    const user = makeUser();

    const result = rankProducts({ user, products, embeddingScores: {} });
    const item = result.ranked[0];
    expect(item.scoreBreakdown.embeddingScore).toBeNull();
    expect(item.score).toBeCloseTo(item.scoreBreakdown.ruleScore, 10);
  });

  test('should handle empty product list', () => {
    const user = makeUser();
    const result = rankProducts({ user, products: [] });
    expect(result.ranked).toEqual([]);
  });

  test('should handle single product', () => {
    const products = [makeProduct()];
    const user = makeUser();
    const result = rankProducts({ user, products });
    expect(result.ranked.length).toBe(1);
  });

  test('should sort products by descending score', () => {
    const products = [
      makeProduct({ id: 'a', rating: 2.0, reviewCount: 5, stock: 10 }),
      makeProduct({ id: 'b', rating: 5.0, reviewCount: 100, stock: 90, featured: true }),
      makeProduct({ id: 'c', rating: 3.5, reviewCount: 30, stock: 50 })
    ];
    const user = makeUser();
    const { ranked } = rankProducts({ user, products });

    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].score).toBeGreaterThanOrEqual(ranked[i + 1].score);
    }
  });

  test('ratingScore should be rating / 5', () => {
    const products = [makeProduct({ rating: 3.5 })];
    const user = makeUser();
    const { ranked } = rankProducts({ user, products });
    expect(ranked[0].scoreBreakdown.ratingScore).toBeCloseTo(0.7, 5);
  });

  test('freshnessScore should be capped at 1', () => {
    const products = [makeProduct({ stock: 200 })];
    const user = makeUser();
    const { ranked } = rankProducts({ user, products });
    expect(ranked[0].scoreBreakdown.freshnessScore).toBe(1);
  });

  test('price affinity should favor budget for default user', () => {
    const products = [
      makeProduct({ id: 'cheap', _normalizedTags: ['price:budget'] }),
      makeProduct({ id: 'pricey', _normalizedTags: ['price:premium'] })
    ];
    const user = makeUser();
    const { ranked } = rankProducts({ user, products });

    const cheapItem = ranked.find(r => r.product.id === 'cheap');
    const priceyItem = ranked.find(r => r.product.id === 'pricey');
    expect(cheapItem.scoreBreakdown.priceScore).toBe(1);
    expect(priceyItem.scoreBreakdown.priceScore).toBe(0.4);
  });

  test('user with organic preference should favor mid price band', () => {
    const products = [
      makeProduct({ id: 'mid', _normalizedTags: ['price:mid'] }),
      makeProduct({ id: 'budget', _normalizedTags: ['price:budget'] })
    ];
    const user = makeUser({ dietaryPreferences: ['Organic'] });
    const { ranked } = rankProducts({ user, products });

    const midItem = ranked.find(r => r.product.id === 'mid');
    const budgetItem = ranked.find(r => r.product.id === 'budget');
    expect(midItem.scoreBreakdown.priceScore).toBe(1);
    expect(budgetItem.scoreBreakdown.priceScore).toBe(0.4);
  });

  test('weights should use default values without env vars', () => {
    const products = [makeProduct()];
    const user = makeUser();
    const { weights } = rankProducts({ user, products });

    expect(weights.tagMatch).toBe(0.5);
    expect(weights.popularity).toBe(0.2);
    expect(weights.rating).toBe(0.15);
    expect(weights.featured).toBe(0.05);
    expect(weights.priceAffinity).toBe(0.05);
    expect(weights.freshness).toBe(0.05);
  });
});
