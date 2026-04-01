/**
 * Generate synthetic demo/test data for showcase and recommendation testing.
 *
 * Usage:
 *   node src/db/seed-demo-data.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('./postgres');
const { connectMongo, client: mongoClient } = require('./mongo');

const USER_COUNT = parseInt(process.env.DEMO_USER_COUNT || '40', 10);
const EXTRA_PRODUCT_COUNT = parseInt(process.env.DEMO_EXTRA_PRODUCT_COUNT || '60', 10);

const FIRST_NAMES = ['Alex', 'Jamie', 'Taylor', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Avery', 'Skyler', 'Quinn'];
const LAST_NAMES = ['Chen', 'Johnson', 'Patel', 'Garcia', 'Kim', 'Brown', 'Nguyen', 'Lee', 'Wilson', 'Wang'];
const CITIES = ['Boston', 'Seattle', 'Austin', 'San Diego', 'New York', 'Chicago'];
const STATES = ['MA', 'WA', 'TX', 'CA', 'NY', 'IL'];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54'];
const LANGS = ['English', 'Spanish', 'Chinese', 'Hindi'];
const CULTURAL_INTERESTS = ['Christmas', 'Thanksgiving', 'Diwali', 'Lunar New Year', 'Mid-Autumn Festival', 'Easter'];
const DIET_PREFS = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Organic', 'High-Protein', 'Keto-Friendly', 'No Sugar Added'];
const LIST_NAMES = ['Weekly Essentials', 'Party Prep', 'Healthy Picks', 'Family Favorites'];
const PAYMENT_METHODS = ['Credit Card', 'PayPal', 'Apple Pay', 'Debit Card'];
const LOYALTY_TIERS = ['Bronze', 'Silver', 'Gold'];

const CATEGORY_CONFIG = {
  Produce: { emojis: ['🥗', '🥦', '🍎', '🥕'], aisle: 1, zone: 'Fresh', tags: ['fresh', 'organic', 'vegan'], dietaryInfo: ['Vegan', 'Organic'] },
  Bakery: { emojis: ['🍞', '🥐', '🥯', '🧁'], aisle: 2, zone: 'Fresh', tags: ['fresh-baked', 'vegetarian'], dietaryInfo: ['Vegetarian'] },
  Dairy: { emojis: ['🥛', '🧀', '🍦'], aisle: 3, zone: 'Refrigerated', tags: ['dairy', 'protein'], dietaryInfo: ['Vegetarian', 'High-Protein'] },
  'Meat & Seafood': { emojis: ['🍗', '🐟', '🥩'], aisle: 4, zone: 'Refrigerated', tags: ['protein', 'fresh'], dietaryInfo: ['High-Protein'] },
  Beverages: { emojis: ['🍵', '🍊', '💧'], aisle: 5, zone: 'Center', tags: ['refreshing', 'vegan'], dietaryInfo: ['Vegan'] },
  Snacks: { emojis: ['🥜', '🍫', '🍿'], aisle: 6, zone: 'Center', tags: ['snack', 'vegan'], dietaryInfo: ['Vegan', 'Gluten-Free'] },
  Festival: { emojis: ['🎉', '🧧', '🪔', '🎄'], aisle: 8, zone: 'Seasonal', tags: ['seasonal'], dietaryInfo: ['Vegetarian'] },
};

const FESTIVAL_TAGS = ['christmas', 'thanksgiving', 'diwali', 'lunar-new-year', 'mid-autumn', 'easter'];
const PRODUCT_SUFFIXES = ['Selection', 'Bundle', 'Special', 'Collection', 'Pack'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function pickSome(arr, min = 1, max = 2) {
  const count = randInt(min, Math.min(max, arr.length));
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const idx = randInt(0, copy.length - 1);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function toDateISO(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function categoryPrice(category) {
  switch (category) {
    case 'Produce': return [2, 8];
    case 'Bakery': return [3, 10];
    case 'Dairy': return [3, 12];
    case 'Meat & Seafood': return [6, 22];
    case 'Beverages': return [2, 9];
    case 'Snacks': return [2, 12];
    case 'Festival': return [8, 35];
    default: return [3, 10];
  }
}

function twoDecimals(num) {
  return Math.round(num * 100) / 100;
}

async function generateExtraProducts(db) {
  const col = db.collection('products');

  await col.deleteMany({ id: { $regex: /^px\d{3}$/ } });

  const categories = Object.keys(CATEGORY_CONFIG);
  const extraProducts = [];

  for (let i = 1; i <= EXTRA_PRODUCT_COUNT; i += 1) {
    const category = pick(categories);
    const cfg = CATEGORY_CONFIG[category];
    const id = `px${String(i).padStart(3, '0')}`;
    const [minP, maxP] = categoryPrice(category);
    const price = twoDecimals(randInt(minP * 100, maxP * 100) / 100);
    const originalPrice = twoDecimals(price + randInt(0, 300) / 100);

    const dietary = pickSome(cfg.dietaryInfo, 1, Math.min(2, cfg.dietaryInfo.length));
    const tags = [...new Set([...cfg.tags, ...dietary.map(d => d.toLowerCase().replace(/\s+/g, '-'))])];
    const festivalTags = category === 'Festival' ? pickSome(FESTIVAL_TAGS, 1, 2) : (Math.random() < 0.2 ? [pick(FESTIVAL_TAGS)] : []);

    extraProducts.push({
      id,
      name: `${pick(['Premium', 'Fresh', 'Classic', 'Organic', 'Family'])} ${category} ${pick(PRODUCT_SUFFIXES)}`,
      category,
      price,
      originalPrice,
      emoji: pick(cfg.emojis),
      rating: twoDecimals(randInt(35, 50) / 10),
      reviewCount: randInt(10, 600),
      brand: pick(['Green Farm', 'Urban Basket', 'Daily Choice', 'House Select', 'Freshly Co.']),
      tags,
      dietaryInfo: dietary,
      description: `Synthetic demo product ${i} in ${category}. Generated for recommendation showcase and stress testing.`,
      stock: randInt(8, 180),
      loyaltyPoints: randInt(1, 35),
      festivalTags,
      featured: Math.random() < 0.22,
      location: {
        aisle: cfg.aisle,
        section: pick(['A', 'B', 'C', 'D']),
        shelf: randInt(1, 4),
        zone: cfg.zone,
      },
    });
  }

  if (extraProducts.length > 0) {
    await col.insertMany(extraProducts);
  }

  return extraProducts.length;
}

async function generateUsersAndRelations(db) {
  const pg = await pool.connect();
  const products = await db.collection('products').find({}).toArray();
  const productIds = products.map(p => p.id);
  const productById = {};
  products.forEach(p => { productById[p.id] = p; });

  const passwordHash = await bcrypt.hash('password123', 10);

  try {
    await pg.query('BEGIN');

    // cleanup previous synthetic users
    const oldUsers = await pg.query("SELECT id FROM users WHERE email LIKE 'demo+test%'");
    const oldIds = oldUsers.rows.map(r => r.id);
    if (oldIds.length > 0) {
      await pg.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ANY($1))', [oldIds]);
      await pg.query('DELETE FROM orders WHERE user_id = ANY($1)', [oldIds]);
      await pg.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ANY($1))', [oldIds]);
      await pg.query('DELETE FROM carts WHERE user_id = ANY($1)', [oldIds]);
      await pg.query('DELETE FROM shopping_list_items WHERE list_id IN (SELECT id FROM shopping_lists WHERE user_id = ANY($1))', [oldIds]);
      await pg.query('DELETE FROM shopping_lists WHERE user_id = ANY($1)', [oldIds]);
      await pg.query('DELETE FROM user_addresses WHERE user_id = ANY($1)', [oldIds]);
      await pg.query('DELETE FROM users WHERE id = ANY($1)', [oldIds]);
      await db.collection('chat_conversations').deleteMany({ userId: { $in: oldIds } });
      await db.collection('user_activity_logs').deleteMany({ userId: { $in: oldIds } });
    }

    let totalOrders = 0;
    let totalOrderItems = 0;

    for (let i = 1; i <= USER_COUNT; i += 1) {
      const uid = `ut${String(i).padStart(3, '0')}`;
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      const email = `demo+test${String(i).padStart(3, '0')}@hypermarket.com`;
      const cityIdx = randInt(0, CITIES.length - 1);
      const loyaltyTier = pick(LOYALTY_TIERS);
      const points = randInt(0, 5000);

      const culturalInterests = pickSome(CULTURAL_INTERESTS, 1, 3);
      const dietaryPreferences = pickSome(DIET_PREFS, 1, 3);
      const createdAt = toDateISO(randInt(1, 240));

      await pg.query(
        `INSERT INTO users (id, email, password, name, phone, age_range, preferred_language, cultural_interests, dietary_preferences, loyalty_tier, loyalty_points, order_history, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          uid,
          email,
          passwordHash,
          name,
          `+1-555-${String(randInt(1000, 9999))}`,
          pick(AGE_RANGES),
          pick(LANGS),
          culturalInterests,
          dietaryPreferences,
          loyaltyTier,
          points,
          [],
          createdAt,
        ]
      );

      // address
      await pg.query(
        'INSERT INTO user_addresses (id, user_id, label, street, city, state, zip, is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [uuidv4(), uid, 'Home', `${randInt(10, 999)} Main St`, CITIES[cityIdx], STATES[cityIdx], `${randInt(10000, 99999)}`, true]
      );

      // cart
      const cart = await pg.query('INSERT INTO carts (user_id, updated_at) VALUES ($1, NOW()) RETURNING id', [uid]);
      const cartId = cart.rows[0].id;
      const cartCount = randInt(2, 5);
      for (let c = 0; c < cartCount; c += 1) {
        const pid = pick(productIds);
        await pg.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1,$2,$3) ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity',
          [cartId, pid, randInt(1, 3)]
        );
      }

      // shopping list
      const listId = uuidv4();
      await pg.query('INSERT INTO shopping_lists (id, user_id, name, created_at, synced_to_device) VALUES ($1,$2,$3,$4,$5)',
        [listId, uid, pick(LIST_NAMES), createdAt, Math.random() < 0.5]);
      for (let li = 0; li < randInt(2, 6); li += 1) {
        const pid = pick(productIds);
        await pg.query(
          'INSERT INTO shopping_list_items (list_id, product_id, name, checked) VALUES ($1,$2,$3,$4)',
          [listId, pid, productById[pid]?.name || 'Unknown', Math.random() < 0.35]
        );
      }

      // orders
      const orderHistory = [];
      const orderCount = randInt(2, 6);
      for (let o = 0; o < orderCount; o += 1) {
        const orderId = `ot${uid}${String(o + 1).padStart(2, '0')}`;
        const created = toDateISO(randInt(1, 180));
        const itemCount = randInt(1, 5);
        const orderItems = [];

        for (let oi = 0; oi < itemCount; oi += 1) {
          const pid = pick(productIds);
          const p = productById[pid];
          const qty = randInt(1, 3);
          const price = p?.price || twoDecimals(randInt(200, 1200) / 100);
          orderItems.push({ pid, name: p?.name || 'Unknown', quantity: qty, price });
        }

        const subtotal = twoDecimals(orderItems.reduce((s, it) => s + it.quantity * it.price, 0));
        const discount = Math.random() < 0.3 ? twoDecimals(subtotal * 0.1) : 0;
        const total = twoDecimals(Math.max(0, subtotal - discount));
        const pointsEarned = Math.floor(total);
        const delivered = Math.random() < 0.65;

        await pg.query(
          `INSERT INTO orders (id, user_id, status, subtotal, discount, loyalty_points_earned, total, shipping_address, payment_method, created_at, delivered_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            orderId,
            uid,
            delivered ? 'Delivered' : 'Processing',
            subtotal,
            discount,
            pointsEarned,
            total,
            `${randInt(10, 999)} Main St, ${CITIES[cityIdx]}, ${STATES[cityIdx]}`,
            pick(PAYMENT_METHODS),
            created,
            delivered ? created : null,
          ]
        );

        for (const it of orderItems) {
          await pg.query('INSERT INTO order_items (order_id, product_id, name, quantity, price) VALUES ($1,$2,$3,$4,$5)',
            [orderId, it.pid, it.name, it.quantity, it.price]);
          totalOrderItems += 1;
        }

        orderHistory.push(orderId);
        totalOrders += 1;
      }

      await pg.query('UPDATE users SET order_history = $1, loyalty_points = loyalty_points + $2 WHERE id = $3',
        [orderHistory, randInt(30, 250), uid]);

      // Mongo activity logs
      const logs = [];
      const logCount = randInt(25, 70);
      for (let lg = 0; lg < logCount; lg += 1) {
        const pid = pick(productIds);
        const action = pick(['view_product', 'search', 'add_to_cart', 'checkout']);
        logs.push({
          userId: uid,
          action,
          data: action === 'search'
            ? { q: pick(['vegan', 'festival', 'organic', 'gluten-free', 'gift']) }
            : { productId: pid },
          timestamp: new Date(Date.now() - randInt(0, 45) * 24 * 60 * 60 * 1000),
        });
      }
      if (logs.length > 0) {
        await db.collection('user_activity_logs').insertMany(logs);
      }
    }

    await pg.query('COMMIT');

    return {
      users: USER_COUNT,
      orders: totalOrders,
      orderItems: totalOrderItems,
    };
  } catch (err) {
    await pg.query('ROLLBACK');
    throw err;
  } finally {
    pg.release();
  }
}

async function main() {
  try {
    const db = await connectMongo();

    const insertedProducts = await generateExtraProducts(db);
    const pgStats = await generateUsersAndRelations(db);

    console.log('Synthetic demo data generation complete.');
    console.log(`Extra products inserted (Mongo): ${insertedProducts}`);
    console.log(`Users inserted (PostgreSQL): ${pgStats.users}`);
    console.log(`Orders inserted (PostgreSQL): ${pgStats.orders}`);
    console.log(`Order items inserted (PostgreSQL): ${pgStats.orderItems}`);
    console.log('Default password for generated test users: password123');
    console.log('Email pattern for generated test users: demo+testNNN@hypermarket.com (e.g., demo+test001@hypermarket.com)');
  } catch (err) {
    console.error('Failed to generate synthetic demo data:', err);
    process.exit(1);
  } finally {
    await mongoClient.close().catch(() => undefined);
    await pool.end().catch(() => undefined);
  }
}

main();
