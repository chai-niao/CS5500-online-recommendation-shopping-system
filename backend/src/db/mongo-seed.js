/**
 * MongoDB Seed Script
 * Seeds product catalog (with location data), creates indexes, and initializes collections.
 *
 * Usage: node src/db/mongo-seed.js
 */
require('dotenv').config();
const { connectMongo, client } = require('./mongo');

const products = [
  // --- Produce (Aisle 1, Fresh Zone) ---
  { id: 'p1', name: 'Organic Salad Mix', category: 'Produce', price: 4.99, originalPrice: 6.99, emoji: '🥗', rating: 4.5, reviewCount: 128, brand: 'Green Farm', tags: ['organic', 'vegan', 'gluten-free'], dietaryInfo: ['Vegan', 'Gluten-Free', 'Organic'], description: 'Fresh organic mixed salad greens sourced from local farms. Perfect for healthy meals.', stock: 50, loyaltyPoints: 5, festivalTags: [], featured: true, location: { aisle: 1, section: 'A', shelf: 2, zone: 'Fresh' } },
  { id: 'p2', name: 'Fresh Strawberries', category: 'Produce', price: 3.99, originalPrice: 4.99, emoji: '🍓', rating: 4.7, reviewCount: 204, brand: 'Berry Best', tags: ['fresh', 'vegan'], dietaryInfo: ['Vegan', 'Gluten-Free'], description: 'Sweet, juicy strawberries picked at peak ripeness.', stock: 80, loyaltyPoints: 4, festivalTags: ['christmas', 'valentines'], featured: true, location: { aisle: 1, section: 'B', shelf: 1, zone: 'Fresh' } },
  { id: 'p3', name: 'Avocado (Pack of 4)', category: 'Produce', price: 5.49, originalPrice: 5.49, emoji: '🥑', rating: 4.3, reviewCount: 97, brand: 'Tropical Fresh', tags: ['vegan', 'keto'], dietaryInfo: ['Vegan', 'Keto-Friendly'], description: 'Creamy Hass avocados, perfect for guacamole or toast.', stock: 40, loyaltyPoints: 5, festivalTags: [], featured: false, location: { aisle: 1, section: 'C', shelf: 2, zone: 'Fresh' } },
  { id: 'p4', name: 'Broccoli Crown', category: 'Produce', price: 2.49, originalPrice: 2.99, emoji: '🥦', rating: 4.1, reviewCount: 73, brand: 'Green Farm', tags: ['organic', 'vegan'], dietaryInfo: ['Vegan', 'Organic'], description: 'Fresh broccoli crowns, rich in vitamins and minerals.', stock: 60, loyaltyPoints: 2, festivalTags: [], featured: false, location: { aisle: 1, section: 'D', shelf: 3, zone: 'Fresh' } },

  // --- Bakery (Aisle 2, Fresh Zone) ---
  { id: 'p5', name: 'Sourdough Bread', category: 'Bakery', price: 5.99, originalPrice: 5.99, emoji: '🍞', rating: 4.8, reviewCount: 315, brand: 'Artisan Bake', tags: ['vegetarian'], dietaryInfo: ['Vegetarian'], description: 'Traditional sourdough made with slow fermentation for authentic flavor.', stock: 30, loyaltyPoints: 6, festivalTags: [], featured: true, location: { aisle: 2, section: 'A', shelf: 2, zone: 'Fresh' } },
  { id: 'p6', name: 'Croissants (4-pack)', category: 'Bakery', price: 4.49, originalPrice: 5.49, emoji: '🥐', rating: 4.6, reviewCount: 188, brand: 'Artisan Bake', tags: ['vegetarian'], dietaryInfo: ['Vegetarian'], description: 'Buttery, flaky croissants baked fresh daily.', stock: 25, loyaltyPoints: 4, festivalTags: ['christmas'], featured: false, location: { aisle: 2, section: 'B', shelf: 1, zone: 'Fresh' } },
  { id: 'p7', name: 'Whole Wheat Bagels (6-pack)', category: 'Bakery', price: 3.99, originalPrice: 3.99, emoji: '🥯', rating: 4.2, reviewCount: 92, brand: 'Morning Fresh', tags: ['vegetarian'], dietaryInfo: ['Vegetarian'], description: 'Hearty whole wheat bagels, high in fiber.', stock: 35, loyaltyPoints: 4, festivalTags: [], featured: false, location: { aisle: 2, section: 'C', shelf: 2, zone: 'Fresh' } },

  // --- Dairy (Aisle 3, Refrigerated Zone) ---
  { id: 'p8', name: 'Organic Whole Milk (1 gal)', category: 'Dairy', price: 6.99, originalPrice: 7.49, emoji: '🥛', rating: 4.4, reviewCount: 241, brand: 'Happy Cow', tags: ['organic', 'vegetarian'], dietaryInfo: ['Vegetarian', 'Organic'], description: 'Certified organic whole milk from pasture-raised cows.', stock: 45, loyaltyPoints: 7, festivalTags: [], featured: true, location: { aisle: 3, section: 'A', shelf: 1, zone: 'Refrigerated' } },
  { id: 'p9', name: 'Greek Yogurt (32 oz)', category: 'Dairy', price: 5.49, originalPrice: 6.49, emoji: '🍦', rating: 4.6, reviewCount: 176, brand: 'Happy Cow', tags: ['vegetarian', 'high-protein'], dietaryInfo: ['Vegetarian', 'High-Protein'], description: 'Thick, creamy Greek yogurt with live active cultures.', stock: 55, loyaltyPoints: 5, festivalTags: [], featured: false, location: { aisle: 3, section: 'B', shelf: 2, zone: 'Refrigerated' } },
  { id: 'p10', name: 'Sharp Cheddar Cheese (8 oz)', category: 'Dairy', price: 4.99, originalPrice: 4.99, emoji: '🧀', rating: 4.5, reviewCount: 203, brand: 'Valley Gold', tags: ['vegetarian'], dietaryInfo: ['Vegetarian'], description: 'Aged sharp cheddar with bold, rich flavor.', stock: 60, loyaltyPoints: 5, festivalTags: ['christmas'], featured: false, location: { aisle: 3, section: 'C', shelf: 3, zone: 'Refrigerated' } },

  // --- Meat & Seafood (Aisle 4, Refrigerated Zone) ---
  { id: 'p11', name: 'Chicken Breast (2 lbs)', category: 'Meat & Seafood', price: 8.99, originalPrice: 10.99, emoji: '🍗', rating: 4.3, reviewCount: 167, brand: 'Free Range Farms', tags: ['high-protein', 'gluten-free'], dietaryInfo: ['High-Protein', 'Gluten-Free'], description: 'Boneless, skinless chicken breast from free-range farms.', stock: 40, loyaltyPoints: 9, festivalTags: [], featured: true, location: { aisle: 4, section: 'A', shelf: 1, zone: 'Refrigerated' } },
  { id: 'p12', name: 'Atlantic Salmon Fillet', category: 'Meat & Seafood', price: 12.99, originalPrice: 14.99, emoji: '🐟', rating: 4.7, reviewCount: 139, brand: 'Ocean Fresh', tags: ['omega-3', 'gluten-free'], dietaryInfo: ['Gluten-Free', 'High-Protein'], description: 'Fresh Atlantic salmon fillet, rich in Omega-3 fatty acids.', stock: 20, loyaltyPoints: 13, festivalTags: ['lunar-new-year', 'christmas'], featured: false, location: { aisle: 4, section: 'B', shelf: 1, zone: 'Refrigerated' } },
  { id: 'p13', name: 'Ground Beef 80/20 (1 lb)', category: 'Meat & Seafood', price: 6.99, originalPrice: 7.99, emoji: '🥩', rating: 4.2, reviewCount: 211, brand: 'Ranch Select', tags: ['high-protein'], dietaryInfo: ['High-Protein'], description: 'USDA Choice ground beef, perfect for burgers and meatballs.', stock: 35, loyaltyPoints: 7, festivalTags: [], featured: false, location: { aisle: 4, section: 'C', shelf: 2, zone: 'Refrigerated' } },

  // --- Beverages (Aisle 5, Center Zone) ---
  { id: 'p14', name: 'Orange Juice (64 oz)', category: 'Beverages', price: 4.99, originalPrice: 5.99, emoji: '🍊', rating: 4.4, reviewCount: 298, brand: 'Sunny Squeeze', tags: ['vegan', 'no-sugar-added'], dietaryInfo: ['Vegan', 'No Sugar Added'], description: '100% pure squeezed orange juice with no added sugar.', stock: 70, loyaltyPoints: 5, festivalTags: [], featured: true, location: { aisle: 5, section: 'A', shelf: 2, zone: 'Center' } },
  { id: 'p15', name: 'Green Tea (20 bags)', category: 'Beverages', price: 3.49, originalPrice: 3.99, emoji: '🍵', rating: 4.5, reviewCount: 155, brand: 'Zen Garden', tags: ['vegan', 'antioxidants'], dietaryInfo: ['Vegan', 'Gluten-Free'], description: 'Premium green tea bags rich in antioxidants.', stock: 100, loyaltyPoints: 3, festivalTags: ['lunar-new-year', 'chinese-new-year'], featured: false, location: { aisle: 5, section: 'B', shelf: 3, zone: 'Center' } },
  { id: 'p16', name: 'Sparkling Water (12-pack)', category: 'Beverages', price: 5.99, originalPrice: 6.99, emoji: '💧', rating: 4.1, reviewCount: 82, brand: 'Bubble Spring', tags: ['vegan', 'zero-calorie'], dietaryInfo: ['Vegan', 'Zero Calorie'], description: 'Refreshing sparkling water with natural mineral content.', stock: 90, loyaltyPoints: 6, festivalTags: [], featured: false, location: { aisle: 5, section: 'C', shelf: 1, zone: 'Center' } },

  // --- Snacks (Aisle 6, Center Zone) ---
  { id: 'p17', name: 'Mixed Nuts (16 oz)', category: 'Snacks', price: 9.99, originalPrice: 11.99, emoji: '🥜', rating: 4.6, reviewCount: 267, brand: "Nature's Best", tags: ['vegan', 'keto', 'gluten-free'], dietaryInfo: ['Vegan', 'Keto-Friendly', 'Gluten-Free'], description: 'Premium blend of almonds, cashews, walnuts, and pecans.', stock: 55, loyaltyPoints: 10, festivalTags: ['diwali', 'christmas'], featured: true, location: { aisle: 6, section: 'A', shelf: 2, zone: 'Center' } },
  { id: 'p18', name: 'Dark Chocolate Bar (70%)', category: 'Snacks', price: 3.99, originalPrice: 4.49, emoji: '🍫', rating: 4.8, reviewCount: 412, brand: 'Cocoa Dreams', tags: ['vegan', 'antioxidants'], dietaryInfo: ['Vegan', 'Gluten-Free'], description: '70% dark chocolate bar with rich, complex flavor notes.', stock: 80, loyaltyPoints: 4, festivalTags: ['valentines', 'christmas', 'diwali'], featured: false, location: { aisle: 6, section: 'B', shelf: 3, zone: 'Center' } },
  { id: 'p19', name: 'Potato Chips (Family Size)', category: 'Snacks', price: 4.49, originalPrice: 5.49, emoji: '🥔', rating: 4.0, reviewCount: 189, brand: 'Crispy Co.', tags: ['vegan'], dietaryInfo: ['Vegan'], description: 'Classic salted potato chips, crispy and delicious.', stock: 65, loyaltyPoints: 4, festivalTags: [], featured: false, location: { aisle: 6, section: 'C', shelf: 1, zone: 'Center' } },

  // --- Festival / Seasonal (Aisle 7-8, Seasonal Zone) ---
  { id: 'p20', name: 'Mooncake Gift Box (8-pack)', category: 'Festival', price: 28.99, originalPrice: 32.99, emoji: '🥮', rating: 4.9, reviewCount: 503, brand: 'Golden Moon', tags: ['seasonal'], dietaryInfo: ['Vegetarian'], description: 'Traditional mooncakes with lotus paste and salted egg yolks. Perfect for Mid-Autumn Festival gifts.', stock: 30, loyaltyPoints: 29, festivalTags: ['mid-autumn', 'chinese-new-year'], featured: true, location: { aisle: 7, section: 'A', shelf: 2, zone: 'Seasonal' } },
  { id: 'p21', name: 'Diwali Sweets Box', category: 'Festival', price: 22.99, originalPrice: 26.99, emoji: '🪔', rating: 4.7, reviewCount: 234, brand: 'Mithai Palace', tags: ['seasonal'], dietaryInfo: ['Vegetarian'], description: 'Assorted Indian sweets including ladoo, barfi, and halwa. Perfect for Diwali celebrations.', stock: 25, loyaltyPoints: 23, festivalTags: ['diwali'], featured: true, location: { aisle: 7, section: 'B', shelf: 1, zone: 'Seasonal' } },
  { id: 'p22', name: 'Christmas Fruit Cake', category: 'Festival', price: 18.99, originalPrice: 21.99, emoji: '🎂', rating: 4.5, reviewCount: 178, brand: 'Holly Baker', tags: ['seasonal'], dietaryInfo: ['Vegetarian'], description: 'Rich, moist Christmas fruit cake with brandy-soaked fruits and marzipan icing.', stock: 20, loyaltyPoints: 19, festivalTags: ['christmas'], featured: true, location: { aisle: 7, section: 'C', shelf: 2, zone: 'Seasonal' } },
  { id: 'p23', name: 'Lunar New Year Red Envelopes (10-pack)', category: 'Festival', price: 4.99, originalPrice: 5.99, emoji: '🧧', rating: 4.8, reviewCount: 621, brand: 'Lucky Red', tags: ['seasonal'], dietaryInfo: [], description: 'Beautiful red envelopes with traditional patterns for Lunar New Year gifts.', stock: 150, loyaltyPoints: 5, festivalTags: ['lunar-new-year', 'chinese-new-year'], featured: true, location: { aisle: 8, section: 'A', shelf: 1, zone: 'Seasonal' } },
  { id: 'p24', name: 'Thanksgiving Turkey (12-16 lbs)', category: 'Festival', price: 34.99, originalPrice: 39.99, emoji: '🦃', rating: 4.6, reviewCount: 312, brand: 'Heritage Farms', tags: ['seasonal', 'gluten-free'], dietaryInfo: ['Gluten-Free'], description: 'Whole frozen turkey, perfect for Thanksgiving dinner.', stock: 15, loyaltyPoints: 35, festivalTags: ['thanksgiving'], featured: true, location: { aisle: 8, section: 'B', shelf: 1, zone: 'Seasonal' } },
];

async function seed() {
  try {
    const db = await connectMongo();

    // 1. Seed products
    const productsCol = db.collection('products');
    await productsCol.deleteMany({});
    await productsCol.insertMany(products);
    console.log(`Inserted ${products.length} products.`);

    // Create indexes
    await productsCol.createIndex({ id: 1 }, { unique: true });
    await productsCol.createIndex({ category: 1 });
    await productsCol.createIndex({ featured: 1 });
    await productsCol.createIndex({ festivalTags: 1 });
    await productsCol.createIndex(
      { name: 'text', brand: 'text', description: 'text' },
      { weights: { name: 10, brand: 5, description: 1 } }
    );
    console.log('Product indexes created.');

    // 2. Initialize chat_conversations collection
    const chatCol = db.collection('chat_conversations');
    await chatCol.deleteMany({});
    await chatCol.createIndex({ userId: 1 });
    await chatCol.createIndex({ sessionId: 1 });
    console.log('Chat conversations collection initialized.');

    // 3. Initialize user_activity_logs collection
    const logsCol = db.collection('user_activity_logs');
    await logsCol.deleteMany({});
    await logsCol.createIndex({ userId: 1, timestamp: -1 });
    console.log('User activity logs collection initialized.');

    console.log('\nMongoDB seed complete!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
