const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/postgres');

const router = express.Router();

function buildJwtOptions() {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return { expiresIn };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, ageRange, preferredLanguage, culturalInterests, dietaryPreferences } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const result = await pool.query(`
      INSERT INTO users (id, email, password, name, phone, age_range, preferred_language, cultural_interests, dietary_preferences, loyalty_tier, loyalty_points, order_history, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Bronze', 0, '{}', CURRENT_DATE)
      RETURNING id, email, name, phone, age_range, preferred_language, cultural_interests, dietary_preferences, loyalty_tier, loyalty_points, order_history, created_at
    `, [id, email, hashedPassword, name, phone || '', ageRange || '', preferredLanguage || 'English', culturalInterests || [], dietaryPreferences || []]);

    const user = mapUserRow(result.rows[0]);
    user.addresses = [];

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, buildJwtOptions());
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const row = result.rows[0];
    const isMatch = await bcrypt.compare(password, row.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = mapUserRow(row);

    // Fetch addresses
    const addrResult = await pool.query('SELECT * FROM user_addresses WHERE user_id = $1', [user.id]);
    user.addresses = addrResult.rows.map(mapAddressRow);

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, buildJwtOptions());
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Map DB row (snake_case) to API response (camelCase)
function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    ageRange: row.age_range,
    preferredLanguage: row.preferred_language,
    culturalInterests: row.cultural_interests || [],
    dietaryPreferences: row.dietary_preferences || [],
    loyaltyTier: row.loyalty_tier,
    loyaltyPoints: row.loyalty_points,
    orderHistory: row.order_history || [],
    createdAt: row.created_at,
  };
}

function mapAddressRow(row) {
  return {
    id: row.id,
    label: row.label,
    street: row.street,
    city: row.city,
    state: row.state,
    zip: row.zip,
    isDefault: row.is_default,
  };
}

module.exports = router;
module.exports.mapUserRow = mapUserRow;
module.exports.mapAddressRow = mapAddressRow;
