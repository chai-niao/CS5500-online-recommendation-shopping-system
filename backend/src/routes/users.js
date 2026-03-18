const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const pool = require('../db/postgres');
const { mapUserRow, mapAddressRow } = require('./auth');

const router = express.Router();

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, age_range, preferred_language, cultural_interests, dietary_preferences, loyalty_tier, loyalty_points, order_history, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = mapUserRow(result.rows[0]);

    const addrResult = await pool.query('SELECT * FROM user_addresses WHERE user_id = $1', [req.user.id]);
    user.addresses = addrResult.rows.map(mapAddressRow);

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/me - update profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, phone, ageRange, preferredLanguage, culturalInterests, dietaryPreferences } = req.body;

    const result = await pool.query(`
      UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        age_range = COALESCE($3, age_range),
        preferred_language = COALESCE($4, preferred_language),
        cultural_interests = COALESCE($5, cultural_interests),
        dietary_preferences = COALESCE($6, dietary_preferences)
      WHERE id = $7
      RETURNING id, email, name, phone, age_range, preferred_language, cultural_interests, dietary_preferences, loyalty_tier, loyalty_points, order_history, created_at
    `, [name || null, phone !== undefined ? phone : null, ageRange || null, preferredLanguage || null, culturalInterests || null, dietaryPreferences || null, req.user.id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = mapUserRow(result.rows[0]);
    const addrResult = await pool.query('SELECT * FROM user_addresses WHERE user_id = $1', [req.user.id]);
    user.addresses = addrResult.rows.map(mapAddressRow);

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/me/password
router.put('/me/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/me/addresses
router.post('/me/addresses', authMiddleware, async (req, res) => {
  try {
    const { label, street, city, state, zip, isDefault } = req.body;
    const addrId = uuidv4();

    if (isDefault) {
      await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    await pool.query(
      'INSERT INTO user_addresses (id, user_id, label, street, city, state, zip, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [addrId, req.user.id, label, street, city, state, zip, !!isDefault]
    );

    const addrResult = await pool.query('SELECT * FROM user_addresses WHERE user_id = $1', [req.user.id]);
    res.status(201).json({ addresses: addrResult.rows.map(mapAddressRow) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/me/addresses/:addrId
router.delete('/me/addresses/:addrId', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [req.params.addrId, req.user.id]);
    const addrResult = await pool.query('SELECT * FROM user_addresses WHERE user_id = $1', [req.user.id]);
    res.json({ addresses: addrResult.rows.map(mapAddressRow) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
