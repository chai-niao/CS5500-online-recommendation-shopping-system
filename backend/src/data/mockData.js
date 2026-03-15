// ============================================================
// Mock Data Store (replaces DB until PostgreSQL is integrated)
// ============================================================

const products = [
  // --- Produce ---
  { id: 'p1', name: 'Organic Salad Mix', category: 'Produce', price: 4.99, originalPrice: 6.99, emoji: '🥗', rating: 4.5, reviewCount: 128, brand: 'Green Farm', tags: ['organic', 'vegan', 'gluten-free'], dietaryInfo: ['Vegan', 'Gluten-Free', 'Organic'], description: 'Fresh organic mixed salad greens sourced from local farms. Perfect for healthy meals.', stock: 50, loyaltyPoints: 5, festivalTags: [], featured: true },
  { id: 'p2', name: 'Fresh Strawberries', category: 'Produce', price: 3.99, originalPrice: 4.99, emoji: '🍓', rating: 4.7, reviewCount: 204, brand: 'Berry Best', tags: ['fresh', 'vegan'], dietaryInfo: ['Vegan', 'Gluten-Free'], description: 'Sweet, juicy strawberries picked at peak ripeness.', stock: 80, loyaltyPoints: 4, festivalTags: ['christmas', 'valentines'], featured: true },
  { id: 'p3', name: 'Avocado (Pack of 4)', category: 'Produce', price: 5.49, originalPrice: 5.49, emoji: '🥑', rating: 4.3, reviewCount: 97, brand: 'Tropical Fresh', tags: ['vegan', 'keto'], dietaryInfo: ['Vegan', 'Keto-Friendly'], description: 'Creamy Hass avocados, perfect for guacamole or toast.', stock: 40, loyaltyPoints: 5, festivalTags: [], featured: false },
  { id: 'p4', name: 'Broccoli Crown', category: 'Produce', price: 2.49, originalPrice: 2.99, emoji: '🥦', rating: 4.1, reviewCount: 73, brand: 'Green Farm', tags: ['organic', 'vegan'], dietaryInfo: ['Vegan', 'Organic'], description: 'Fresh broccoli crowns, rich in vitamins and minerals.', stock: 60, loyaltyPoints: 2, festivalTags: [], featured: false },

  // --- Bakery ---
  { id: 'p5', name: 'Sourdough Bread', category: 'Bakery', price: 5.99, originalPrice: 5.99, emoji: '🍞', rating: 4.8, reviewCount: 315, brand: 'Artisan Bake', tags: ['vegetarian'], dietaryInfo: ['Vegetarian'], description: 'Traditional sourdough made with slow fermentation for authentic flavor.', stock: 30, loyaltyPoints: 6, festivalTags: [], featured: true },
  { id: 'p6', name: 'Croissants (4-pack)', category: 'Bakery', price: 4.49, originalPrice: 5.49, emoji: '🥐', rating: 4.6, reviewCount: 188, brand: 'Artisan Bake', tags: ['vegetarian'], dietaryInfo: ['Vegetarian'], description: 'Buttery, flaky croissants baked fresh daily.', stock: 25, loyaltyPoints: 4, festivalTags: ['christmas'], featured: false },
  { id: 'p7', name: 'Whole Wheat Bagels (6-pack)', category: 'Bakery', price: 3.99, originalPrice: 3.99, emoji: '🥯', rating: 4.2, reviewCount: 92, brand: 'Morning Fresh', tags: ['vegetarian'], dietaryInfo: ['Vegetarian'], description: 'Hearty whole wheat bagels, high in fiber.', stock: 35, loyaltyPoints: 4, festivalTags: [], featured: false },

  // --- Dairy ---
  { id: 'p8', name: 'Organic Whole Milk (1 gal)', category: 'Dairy', price: 6.99, originalPrice: 7.49, emoji: '🥛', rating: 4.4, reviewCount: 241, brand: 'Happy Cow', tags: ['organic', 'vegetarian'], dietaryInfo: ['Vegetarian', 'Organic'], description: 'Certified organic whole milk from pasture-raised cows.', stock: 45, loyaltyPoints: 7, festivalTags: [], featured: true },
  { id: 'p9', name: 'Greek Yogurt (32 oz)', category: 'Dairy', price: 5.49, originalPrice: 6.49, emoji: '🍦', rating: 4.6, reviewCount: 176, brand: 'Happy Cow', tags: ['vegetarian', 'high-protein'], dietaryInfo: ['Vegetarian', 'High-Protein'], description: 'Thick, creamy Greek yogurt with live active cultures.', stock: 55, loyaltyPoints: 5, festivalTags: [], featured: false },
  { id: 'p10', name: 'Sharp Cheddar Cheese (8 oz)', category: 'Dairy', price: 4.99, originalPrice: 4.99, emoji: '🧀', rating: 4.5, reviewCount: 203, brand: 'Valley Gold', tags: ['vegetarian'], dietaryInfo: ['Vegetarian'], description: 'Aged sharp cheddar with bold, rich flavor.', stock: 60, loyaltyPoints: 5, festivalTags: ['christmas'], featured: false },

  // --- Meat & Seafood ---
  { id: 'p11', name: 'Chicken Breast (2 lbs)', category: 'Meat & Seafood', price: 8.99, originalPrice: 10.99, emoji: '🍗', rating: 4.3, reviewCount: 167, brand: 'Free Range Farms', tags: ['high-protein', 'gluten-free'], dietaryInfo: ['High-Protein', 'Gluten-Free'], description: 'Boneless, skinless chicken breast from free-range farms.', stock: 40, loyaltyPoints: 9, festivalTags: [], featured: true },
  { id: 'p12', name: 'Atlantic Salmon Fillet', category: 'Meat & Seafood', price: 12.99, originalPrice: 14.99, emoji: '🐟', rating: 4.7, reviewCount: 139, brand: 'Ocean Fresh', tags: ['omega-3', 'gluten-free'], dietaryInfo: ['Gluten-Free', 'High-Protein'], description: 'Fresh Atlantic salmon fillet, rich in Omega-3 fatty acids.', stock: 20, loyaltyPoints: 13, festivalTags: ['lunar-new-year', 'christmas'], featured: false },
  { id: 'p13', name: 'Ground Beef 80/20 (1 lb)', category: 'Meat & Seafood', price: 6.99, originalPrice: 7.99, emoji: '🥩', rating: 4.2, reviewCount: 211, brand: 'Ranch Select', tags: ['high-protein'], dietaryInfo: ['High-Protein'], description: 'USDA Choice ground beef, perfect for burgers and meatballs.', stock: 35, loyaltyPoints: 7, festivalTags: [], featured: false },

  // --- Beverages ---
  { id: 'p14', name: 'Orange Juice (64 oz)', category: 'Beverages', price: 4.99, originalPrice: 5.99, emoji: '🍊', rating: 4.4, reviewCount: 298, brand: 'Sunny Squeeze', tags: ['vegan', 'no-sugar-added'], dietaryInfo: ['Vegan', 'No Sugar Added'], description: '100% pure squeezed orange juice with no added sugar.', stock: 70, loyaltyPoints: 5, festivalTags: [], featured: true },
  { id: 'p15', name: 'Green Tea (20 bags)', category: 'Beverages', price: 3.49, originalPrice: 3.99, emoji: '🍵', rating: 4.5, reviewCount: 155, brand: 'Zen Garden', tags: ['vegan', 'antioxidants'], dietaryInfo: ['Vegan', 'Gluten-Free'], description: 'Premium green tea bags rich in antioxidants.', stock: 100, loyaltyPoints: 3, festivalTags: ['lunar-new-year', 'chinese-new-year'], featured: false },
  { id: 'p16', name: 'Sparkling Water (12-pack)', category: 'Beverages', price: 5.99, originalPrice: 6.99, emoji: '💧', rating: 4.1, reviewCount: 82, brand: 'Bubble Spring', tags: ['vegan', 'zero-calorie'], dietaryInfo: ['Vegan', 'Zero Calorie'], description: 'Refreshing sparkling water with natural mineral content.', stock: 90, loyaltyPoints: 6, festivalTags: [], featured: false },

  // --- Snacks ---
  { id: 'p17', name: 'Mixed Nuts (16 oz)', category: 'Snacks', price: 9.99, originalPrice: 11.99, emoji: '🥜', rating: 4.6, reviewCount: 267, brand: 'Nature\'s Best', tags: ['vegan', 'keto', 'gluten-free'], dietaryInfo: ['Vegan', 'Keto-Friendly', 'Gluten-Free'], description: 'Premium blend of almonds, cashews, walnuts, and pecans.', stock: 55, loyaltyPoints: 10, festivalTags: ['diwali', 'christmas'], featured: true },
  { id: 'p18', name: 'Dark Chocolate Bar (70%)', category: 'Snacks', price: 3.99, originalPrice: 4.49, emoji: '🍫', rating: 4.8, reviewCount: 412, brand: 'Cocoa Dreams', tags: ['vegan', 'antioxidants'], dietaryInfo: ['Vegan', 'Gluten-Free'], description: '70% dark chocolate bar with rich, complex flavor notes.', stock: 80, loyaltyPoints: 4, festivalTags: ['valentines', 'christmas', 'diwali'], featured: false },
  { id: 'p19', name: 'Potato Chips (Family Size)', category: 'Snacks', price: 4.49, originalPrice: 5.49, emoji: '🥔', rating: 4.0, reviewCount: 189, brand: 'Crispy Co.', tags: ['vegan'], dietaryInfo: ['Vegan'], description: 'Classic salted potato chips, crispy and delicious.', stock: 65, loyaltyPoints: 4, festivalTags: [], featured: false },

  // --- Festival / Seasonal ---
  { id: 'p20', name: 'Mooncake Gift Box (8-pack)', category: 'Festival', price: 28.99, originalPrice: 32.99, emoji: '🥮', rating: 4.9, reviewCount: 503, brand: 'Golden Moon', tags: ['seasonal'], dietaryInfo: ['Vegetarian'], description: 'Traditional mooncakes with lotus paste and salted egg yolks. Perfect for Mid-Autumn Festival gifts.', stock: 30, loyaltyPoints: 29, festivalTags: ['mid-autumn', 'chinese-new-year'], featured: true },
  { id: 'p21', name: 'Diwali Sweets Box', category: 'Festival', price: 22.99, originalPrice: 26.99, emoji: '🪔', rating: 4.7, reviewCount: 234, brand: 'Mithai Palace', tags: ['seasonal'], dietaryInfo: ['Vegetarian'], description: 'Assorted Indian sweets including ladoo, barfi, and halwa. Perfect for Diwali celebrations.', stock: 25, loyaltyPoints: 23, festivalTags: ['diwali'], featured: true },
  { id: 'p22', name: 'Christmas Fruit Cake', category: 'Festival', price: 18.99, originalPrice: 21.99, emoji: '🎂', rating: 4.5, reviewCount: 178, brand: 'Holly Baker', tags: ['seasonal'], dietaryInfo: ['Vegetarian'], description: 'Rich, moist Christmas fruit cake with brandy-soaked fruits and marzipan icing.', stock: 20, loyaltyPoints: 19, festivalTags: ['christmas'], featured: true },
  { id: 'p23', name: 'Lunar New Year Red Envelopes (10-pack)', category: 'Festival', price: 4.99, originalPrice: 5.99, emoji: '🧧', rating: 4.8, reviewCount: 621, brand: 'Lucky Red', tags: ['seasonal'], dietaryInfo: [], description: 'Beautiful red envelopes with traditional patterns for Lunar New Year gifts.', stock: 150, loyaltyPoints: 5, festivalTags: ['lunar-new-year', 'chinese-new-year'], featured: true },
  { id: 'p24', name: 'Thanksgiving Turkey (12-16 lbs)', category: 'Festival', price: 34.99, originalPrice: 39.99, emoji: '🦃', rating: 4.6, reviewCount: 312, brand: 'Heritage Farms', tags: ['seasonal', 'gluten-free'], dietaryInfo: ['Gluten-Free'], description: 'Whole frozen turkey, perfect for Thanksgiving dinner.', stock: 15, loyaltyPoints: 35, festivalTags: ['thanksgiving'], featured: true },
];

const users = [
  {
    id: 'u1',
    email: 'demo@hypermarket.com',
    password: '$2a$10$vgbyMbHE/ArG9MuKQrSQ.OrmR1.ZQTsp4KKnjjJsJTzq1g6Q/PR3q', // "password123"
    name: 'Alex Johnson',
    phone: '+1-555-0101',
    ageRange: '25-34',
    preferredLanguage: 'English',
    culturalInterests: ['Christmas', 'Thanksgiving'],
    dietaryPreferences: ['Gluten-Free', 'Organic'],
    loyaltyTier: 'Gold',
    loyaltyPoints: 2450,
    addresses: [
      { id: 'addr1', label: 'Home', street: '123 Main St', city: 'Boston', state: 'MA', zip: '02101', isDefault: true }
    ],
    orderHistory: ['ord1', 'ord2'],
    createdAt: '2025-01-15',
  },
];

// In-memory cart store: { [userId]: { items: [...], updatedAt } }
const carts = {
  u1: {
    items: [
      { productId: 'p1', quantity: 2 },
      { productId: 'p8', quantity: 1 },
    ],
    updatedAt: new Date().toISOString(),
  },
};

// In-memory shopping lists: { [userId]: [...] }
const shoppingLists = {
  u1: [
    { id: 'list1', name: 'Weekly Groceries', items: [{ productId: 'p1', name: 'Organic Salad Mix', checked: false }, { productId: 'p8', name: 'Organic Whole Milk (1 gal)', checked: true }], createdAt: '2026-03-01', syncedToDevice: true },
    { id: 'list2', name: 'Christmas Party', items: [{ productId: 'p22', name: 'Christmas Fruit Cake', checked: false }, { productId: 'p17', name: 'Mixed Nuts (16 oz)', checked: false }], createdAt: '2026-03-05', syncedToDevice: false },
  ],
};

const orders = [
  {
    id: 'ord1', userId: 'u1', status: 'Delivered',
    items: [{ productId: 'p1', name: 'Organic Salad Mix', quantity: 2, price: 4.99 }, { productId: 'p14', name: 'Orange Juice (64 oz)', quantity: 1, price: 4.99 }],
    subtotal: 14.97, discount: 1.50, loyaltyPointsEarned: 15, total: 13.47,
    shippingAddress: '123 Main St, Boston, MA 02101', paymentMethod: 'Credit Card', createdAt: '2026-02-20', deliveredAt: '2026-02-22',
  },
  {
    id: 'ord2', userId: 'u1', status: 'Processing',
    items: [{ productId: 'p11', name: 'Chicken Breast (2 lbs)', quantity: 1, price: 8.99 }, { productId: 'p5', name: 'Sourdough Bread', quantity: 1, price: 5.99 }],
    subtotal: 14.98, discount: 0, loyaltyPointsEarned: 15, total: 14.98,
    shippingAddress: '123 Main St, Boston, MA 02101', paymentMethod: 'PayPal', createdAt: '2026-03-08',
  },
];

const festivals = [
  { id: 'f1', name: 'Lunar New Year', emoji: '🧧', date: '2026-02-17', tags: ['lunar-new-year', 'chinese-new-year'], color: '#e53935', description: 'Celebrate the Year of the Horse with traditional foods and gifts.' },
  { id: 'f2', name: 'Easter', emoji: '🐣', date: '2026-04-05', tags: ['easter'], color: '#7b1fa2', description: 'Spring celebration with chocolate eggs and Easter-themed treats.' },
  { id: 'f3', name: 'Diwali', emoji: '🪔', date: '2026-10-28', tags: ['diwali'], color: '#f57f17', description: 'Festival of Lights celebrated with sweets, fireworks, and decorations.' },
  { id: 'f4', name: 'Christmas', emoji: '🎄', date: '2026-12-25', tags: ['christmas'], color: '#2e7d32', description: 'The festive season filled with gifts, decorations, and special foods.' },
  { id: 'f5', name: 'Mid-Autumn Festival', emoji: '🥮', date: '2026-09-25', tags: ['mid-autumn'], color: '#1565c0', description: 'Mooncakes and lanterns to celebrate the harvest moon.' },
  { id: 'f6', name: 'Thanksgiving', emoji: '🦃', date: '2026-11-26', tags: ['thanksgiving'], color: '#e65100', description: 'A time for gratitude, family, and a traditional feast.' },
];

const promotions = [
  { id: 'promo1', code: 'WELCOME10', discount: 10, type: 'percentage', description: '10% off your first order', minOrder: 20, active: true },
  { id: 'promo2', code: 'FESTIVAL20', discount: 20, type: 'percentage', description: '20% off festival items', minOrder: 30, active: true },
  { id: 'promo3', code: 'SAVE5', discount: 5, type: 'fixed', description: '$5 off orders over $50', minOrder: 50, active: true },
];

module.exports = { products, users, carts, shoppingLists, orders, festivals, promotions };
