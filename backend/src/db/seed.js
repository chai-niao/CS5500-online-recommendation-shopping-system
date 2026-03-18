/**
 * PostgreSQL Seed Script
 * Seeds all relational data: users, addresses, orders, carts, lists, festivals, promotions
 *
 * Usage: node src/db/seed.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./postgres');

async function seed() {
  const client = await pool.connect();
  try {
    // 1. Execute schema.sql
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSQL);
    console.log('Schema created.');

    // 2. Seed users
    await client.query(`
      INSERT INTO users (id, email, password, name, phone, age_range, preferred_language, cultural_interests, dietary_preferences, loyalty_tier, loyalty_points, order_history, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      'u1', 'demo@hypermarket.com',
      '$2a$10$vgbyMbHE/ArG9MuKQrSQ.OrmR1.ZQTsp4KKnjjJsJTzq1g6Q/PR3q', // password123
      'Alex Johnson', '+1-555-0101', '25-34', 'English',
      ['Christmas', 'Thanksgiving'],
      ['Gluten-Free', 'Organic'],
      'Gold', 2450,
      ['ord1', 'ord2'],
      '2025-01-15'
    ]);
    console.log('Users seeded.');

    // 3. Seed user addresses
    await client.query(`
      INSERT INTO user_addresses (id, user_id, label, street, city, state, zip, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, ['addr1', 'u1', 'Home', '123 Main St', 'Boston', 'MA', '02101', true]);
    console.log('Addresses seeded.');

    // 4. Seed orders
    await client.query(`
      INSERT INTO orders (id, user_id, status, subtotal, discount, loyalty_points_earned, total, shipping_address, payment_method, created_at, delivered_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11), ($12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
    `, [
      'ord1', 'u1', 'Delivered', 14.97, 1.50, 15, 13.47, '123 Main St, Boston, MA 02101', 'Credit Card', '2026-02-20', '2026-02-22',
      'ord2', 'u1', 'Processing', 14.98, 0, 15, 14.98, '123 Main St, Boston, MA 02101', 'PayPal', '2026-03-08', null
    ]);

    // 5. Seed order items
    await client.query(`
      INSERT INTO order_items (order_id, product_id, name, quantity, price) VALUES
      ($1, $2, $3, $4, $5),
      ($6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15),
      ($16, $17, $18, $19, $20)
    `, [
      'ord1', 'p1', 'Organic Salad Mix', 2, 4.99,
      'ord1', 'p14', 'Orange Juice (64 oz)', 1, 4.99,
      'ord2', 'p11', 'Chicken Breast (2 lbs)', 1, 8.99,
      'ord2', 'p5', 'Sourdough Bread', 1, 5.99
    ]);
    console.log('Orders seeded.');

    // 6. Seed cart
    const cartRes = await client.query(`
      INSERT INTO carts (user_id, updated_at) VALUES ($1, NOW()) RETURNING id
    `, ['u1']);
    const cartId = cartRes.rows[0].id;

    await client.query(`
      INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3), ($4, $5, $6)
    `, [cartId, 'p1', 2, cartId, 'p8', 1]);
    console.log('Cart seeded.');

    // 7. Seed shopping lists
    await client.query(`
      INSERT INTO shopping_lists (id, user_id, name, created_at, synced_to_device)
      VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10)
    `, [
      'list1', 'u1', 'Weekly Groceries', '2026-03-01', true,
      'list2', 'u1', 'Christmas Party', '2026-03-05', false
    ]);

    await client.query(`
      INSERT INTO shopping_list_items (list_id, product_id, name, checked) VALUES
      ($1, $2, $3, $4), ($5, $6, $7, $8), ($9, $10, $11, $12), ($13, $14, $15, $16)
    `, [
      'list1', 'p1', 'Organic Salad Mix', false,
      'list1', 'p8', 'Organic Whole Milk (1 gal)', true,
      'list2', 'p22', 'Christmas Fruit Cake', false,
      'list2', 'p17', 'Mixed Nuts (16 oz)', false
    ]);
    console.log('Shopping lists seeded.');

    // 8. Seed festivals
    await client.query(`
      INSERT INTO festivals (id, name, emoji, date, tags, color, description) VALUES
      ($1,$2,$3,$4,$5,$6,$7), ($8,$9,$10,$11,$12,$13,$14), ($15,$16,$17,$18,$19,$20,$21),
      ($22,$23,$24,$25,$26,$27,$28), ($29,$30,$31,$32,$33,$34,$35), ($36,$37,$38,$39,$40,$41,$42)
    `, [
      'f1', 'Lunar New Year', '🧧', '2026-02-17', ['lunar-new-year', 'chinese-new-year'], '#e53935', 'Celebrate the Year of the Horse with traditional foods and gifts.',
      'f2', 'Easter', '🐣', '2026-04-05', ['easter'], '#7b1fa2', 'Spring celebration with chocolate eggs and Easter-themed treats.',
      'f3', 'Diwali', '🪔', '2026-10-28', ['diwali'], '#f57f17', 'Festival of Lights celebrated with sweets, fireworks, and decorations.',
      'f4', 'Christmas', '🎄', '2026-12-25', ['christmas'], '#2e7d32', 'The festive season filled with gifts, decorations, and special foods.',
      'f5', 'Mid-Autumn Festival', '🥮', '2026-09-25', ['mid-autumn'], '#1565c0', 'Mooncakes and lanterns to celebrate the harvest moon.',
      'f6', 'Thanksgiving', '🦃', '2026-11-26', ['thanksgiving'], '#e65100', 'A time for gratitude, family, and a traditional feast.'
    ]);
    console.log('Festivals seeded.');

    // 9. Seed promotions
    await client.query(`
      INSERT INTO promotions (id, code, discount, type, description, min_order, active) VALUES
      ($1,$2,$3,$4,$5,$6,$7), ($8,$9,$10,$11,$12,$13,$14), ($15,$16,$17,$18,$19,$20,$21)
    `, [
      'promo1', 'WELCOME10', 10, 'percentage', '10% off your first order', 20, true,
      'promo2', 'FESTIVAL20', 20, 'percentage', '20% off festival items', 30, true,
      'promo3', 'SAVE5', 5, 'fixed', '$5 off orders over $50', 50, true
    ]);
    console.log('Promotions seeded.');

    console.log('\nPostgreSQL seed complete!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
