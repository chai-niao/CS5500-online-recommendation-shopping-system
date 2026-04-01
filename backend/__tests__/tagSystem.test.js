const {
  TAG_TAXONOMY,
  inferProductTags,
  buildUserTagProfile,
  tagOverlapScore,
  extractCandidateTagsHeuristic
} = require('../src/recommendation/tagSystem');

describe('TAG_TAXONOMY', () => {
  test('should contain all required tag categories', () => {
    expect(TAG_TAXONOMY).toHaveProperty('category');
    expect(TAG_TAXONOMY).toHaveProperty('dietary');
    expect(TAG_TAXONOMY).toHaveProperty('festival');
    expect(TAG_TAXONOMY).toHaveProperty('occasion');
    expect(TAG_TAXONOMY).toHaveProperty('priceBand');
  });

  test('category list should include core product types', () => {
    expect(TAG_TAXONOMY.category).toContain('produce');
    expect(TAG_TAXONOMY.category).toContain('bakery');
    expect(TAG_TAXONOMY.category).toContain('dairy');
    expect(TAG_TAXONOMY.category).toContain('beverages');
  });

  test('festival list should include multi-cultural festivals', () => {
    expect(TAG_TAXONOMY.festival).toContain('christmas');
    expect(TAG_TAXONOMY.festival).toContain('diwali');
    expect(TAG_TAXONOMY.festival).toContain('lunar-new-year');
  });
});

describe('inferProductTags', () => {
  test('should infer category tag from product category', () => {
    const product = { category: 'Produce', price: 3 };
    const tags = inferProductTags(product);
    expect(tags).toContain('category:produce');
  });

  test('should infer dietary tags from product tags array', () => {
    const product = { category: 'Dairy', tags: ['Organic', 'Gluten-Free'], price: 8 };
    const tags = inferProductTags(product);
    expect(tags).toContain('dietary:organic');
    expect(tags).toContain('dietary:gluten-free');
  });

  test('should infer dietary tags from dietaryInfo array', () => {
    const product = { category: 'Snacks', dietaryInfo: ['Vegan', 'Keto'], price: 4 };
    const tags = inferProductTags(product);
    expect(tags).toContain('dietary:vegan');
    expect(tags).toContain('dietary:keto-friendly');
  });

  test('should infer festival tags from festivalTags array', () => {
    const product = { category: 'Bakery', festivalTags: ['Christmas', 'Easter'], price: 12 };
    const tags = inferProductTags(product);
    expect(tags).toContain('festival:christmas');
    expect(tags).toContain('festival:easter');
  });

  test('should assign budget price band for price <= 5', () => {
    const product = { category: 'Produce', price: 3 };
    const tags = inferProductTags(product);
    expect(tags).toContain('price:budget');
  });

  test('should assign mid price band for price 5-15', () => {
    const product = { category: 'Dairy', price: 10 };
    const tags = inferProductTags(product);
    expect(tags).toContain('price:mid');
  });

  test('should assign premium price band for price > 15', () => {
    const product = { category: 'Meat & Seafood', price: 25 };
    const tags = inferProductTags(product);
    expect(tags).toContain('price:premium');
  });

  test('should assign gift occasion for price > 20', () => {
    const product = { category: 'Beverages', price: 30 };
    const tags = inferProductTags(product);
    expect(tags).toContain('occasion:gift');
  });

  test('should assign daily occasion for price <= 20', () => {
    const product = { category: 'Snacks', price: 5 };
    const tags = inferProductTags(product);
    expect(tags).toContain('occasion:daily');
  });

  test('should handle product with missing optional fields', () => {
    const product = { price: 7 };
    const tags = inferProductTags(product);
    expect(tags).toContain('price:mid');
    expect(tags).toContain('occasion:daily');
    expect(tags.length).toBeGreaterThanOrEqual(2);
  });

  test('should not produce duplicate tags', () => {
    const product = {
      category: 'Bakery',
      tags: ['Christmas'],
      festivalTags: ['Christmas'],
      price: 10
    };
    const tags = inferProductTags(product);
    const christmasCount = tags.filter(t => t === 'festival:christmas').length;
    expect(christmasCount).toBe(1);
  });

  test('should resolve synonyms correctly', () => {
    const product = { category: 'Snacks', dietaryInfo: ['GlutenFree', 'Protein'], price: 8 };
    const tags = inferProductTags(product);
    expect(tags).toContain('dietary:gluten-free');
    expect(tags).toContain('dietary:high-protein');
  });
});

describe('buildUserTagProfile', () => {
  test('should build dietary tags from user preferences', () => {
    const user = { dietaryPreferences: ['Vegan', 'Organic'], culturalInterests: [] };
    const tags = buildUserTagProfile(user);
    expect(tags).toContain('dietary:vegan');
    expect(tags).toContain('dietary:organic');
  });

  test('should build festival tags from cultural interests', () => {
    const user = { dietaryPreferences: [], culturalInterests: ['Christmas', 'Diwali'] };
    const tags = buildUserTagProfile(user);
    expect(tags).toContain('festival:christmas');
    expect(tags).toContain('festival:diwali');
  });

  test('should handle empty user preferences', () => {
    const user = { dietaryPreferences: [], culturalInterests: [] };
    const tags = buildUserTagProfile(user);
    expect(tags).toEqual([]);
  });

  test('should handle missing fields gracefully', () => {
    const user = {};
    const tags = buildUserTagProfile(user);
    expect(tags).toEqual([]);
  });

  test('should resolve synonyms in user preferences', () => {
    const user = { dietaryPreferences: ['Keto'], culturalInterests: ['Lunar New Year'] };
    const tags = buildUserTagProfile(user);
    expect(tags).toContain('dietary:keto-friendly');
    expect(tags).toContain('festival:lunar-new-year');
  });
});

describe('tagOverlapScore', () => {
  test('should return 1.0 for perfect overlap', () => {
    const productTags = ['dietary:vegan', 'festival:christmas'];
    const userTags = ['dietary:vegan', 'festival:christmas'];
    expect(tagOverlapScore(productTags, userTags)).toBe(1.0);
  });

  test('should return 0 for no overlap', () => {
    const productTags = ['dietary:vegan'];
    const userTags = ['dietary:organic'];
    expect(tagOverlapScore(productTags, userTags)).toBe(0);
  });

  test('should return correct partial overlap ratio', () => {
    const productTags = ['dietary:vegan', 'festival:christmas'];
    const userTags = ['dietary:vegan', 'festival:diwali'];
    expect(tagOverlapScore(productTags, userTags)).toBe(0.5);
  });

  test('should return 0 when user tags are empty', () => {
    const productTags = ['dietary:vegan'];
    expect(tagOverlapScore(productTags, [])).toBe(0);
  });

  test('should handle empty product tags', () => {
    const userTags = ['dietary:vegan'];
    expect(tagOverlapScore([], userTags)).toBe(0);
  });

  test('should handle default parameters', () => {
    expect(tagOverlapScore()).toBe(0);
  });
});

describe('extractCandidateTagsHeuristic', () => {
  test('should extract dietary tags from product name', () => {
    const product = { name: 'Organic Whole Wheat Bread', price: 5 };
    const tags = extractCandidateTagsHeuristic(product);
    expect(tags).toContain('dietary:organic');
  });

  test('should extract festival tags from description', () => {
    const product = { name: 'Gift Box', description: 'Perfect for Christmas celebration', price: 25 };
    const tags = extractCandidateTagsHeuristic(product);
    expect(tags).toContain('festival:christmas');
  });

  test('should assign correct price band', () => {
    expect(extractCandidateTagsHeuristic({ price: 3 })).toContain('price:budget');
    expect(extractCandidateTagsHeuristic({ price: 10 })).toContain('price:mid');
    expect(extractCandidateTagsHeuristic({ price: 20 })).toContain('price:premium');
  });

  test('should not produce duplicates', () => {
    const product = { name: 'Vegan Cookie', tags: ['vegan'], price: 4 };
    const tags = extractCandidateTagsHeuristic(product);
    const veganCount = tags.filter(t => t === 'dietary:vegan').length;
    expect(veganCount).toBe(1);
  });

  test('should handle empty product gracefully', () => {
    const tags = extractCandidateTagsHeuristic({});
    expect(tags).toContain('price:budget');
    expect(Array.isArray(tags)).toBe(true);
  });
});
