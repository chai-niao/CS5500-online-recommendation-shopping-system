const TAG_TAXONOMY = {
  category: ['produce', 'bakery', 'dairy', 'meat-seafood', 'beverages', 'snacks', 'festival'],
  dietary: ['vegan', 'vegetarian', 'gluten-free', 'organic', 'keto-friendly', 'high-protein', 'no-sugar-added', 'zero-calorie'],
  festival: ['christmas', 'thanksgiving', 'diwali', 'lunar-new-year', 'mid-autumn', 'easter', 'valentines', 'chinese-new-year'],
  occasion: ['daily', 'family', 'gift', 'party', 'quick-meal'],
  priceBand: ['budget', 'mid', 'premium']
};

const SYNONYM_MAP = {
  keto: 'keto-friendly',
  ketofriendly: 'keto-friendly',
  glutenfree: 'gluten-free',
  highsprotein: 'high-protein',
  protein: 'high-protein',
  lunarnewyear: 'lunar-new-year',
  chinesenewyear: 'chinese-new-year',
  midsutumn: 'mid-autumn'
};

const normalizeToken = (value = '') => value.toString().trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const canonical = (token) => SYNONYM_MAP[token] || token;

const inList = (token, list) => list.includes(token);

const toPriceBand = (price = 0) => {
  if (price <= 5) return 'budget';
  if (price <= 15) return 'mid';
  return 'premium';
};

const inferProductTags = (product) => {
  const tags = new Set();

  const categoryToken = canonical(normalizeToken(product.category));
  if (inList(categoryToken, TAG_TAXONOMY.category)) tags.add(`category:${categoryToken}`);

  [...(product.tags || []), ...(product.dietaryInfo || [])].forEach(raw => {
    const token = canonical(normalizeToken(raw));
    if (inList(token, TAG_TAXONOMY.dietary)) tags.add(`dietary:${token}`);
    if (inList(token, TAG_TAXONOMY.festival)) tags.add(`festival:${token}`);
  });

  (product.festivalTags || []).forEach(raw => {
    const token = canonical(normalizeToken(raw));
    if (inList(token, TAG_TAXONOMY.festival)) tags.add(`festival:${token}`);
  });

  tags.add(`price:${toPriceBand(product.price)}`);
  tags.add(product.price > 20 ? 'occasion:gift' : 'occasion:daily');

  return [...tags];
};

const buildUserTagProfile = (user) => {
  const tags = new Set();

  (user.dietaryPreferences || []).forEach(raw => {
    const token = canonical(normalizeToken(raw));
    if (inList(token, TAG_TAXONOMY.dietary)) tags.add(`dietary:${token}`);
  });

  (user.culturalInterests || []).forEach(raw => {
    const token = canonical(normalizeToken(raw));
    if (inList(token, TAG_TAXONOMY.festival)) tags.add(`festival:${token}`);
  });

  return [...tags];
};

const tagOverlapScore = (productTags = [], userTags = []) => {
  if (userTags.length === 0) return 0;
  const userSet = new Set(userTags);
  const overlap = productTags.filter(t => userSet.has(t)).length;
  return overlap / userTags.length;
};

const extractCandidateTagsHeuristic = (product) => {
  const text = `${product?.name || ''} ${product?.description || ''} ${(product?.tags || []).join(' ')}`.toLowerCase();
  const candidates = [];

  TAG_TAXONOMY.dietary.forEach(tag => {
    if (text.includes(tag.replace('-', ' ')) || text.includes(tag)) candidates.push(`dietary:${tag}`);
  });

  TAG_TAXONOMY.festival.forEach(tag => {
    if (text.includes(tag.replace('-', ' ')) || text.includes(tag)) candidates.push(`festival:${tag}`);
  });

  if ((product?.price || 0) <= 5) candidates.push('price:budget');
  else if ((product?.price || 0) <= 15) candidates.push('price:mid');
  else candidates.push('price:premium');

  return [...new Set(candidates)];
};

module.exports = {
  TAG_TAXONOMY,
  inferProductTags,
  buildUserTagProfile,
  tagOverlapScore,
  extractCandidateTagsHeuristic
};
