const express = require('express');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const { users } = require('../data/mockData');

const router = express.Router();

// GET /api/users/me
router.get('/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password, ...userData } = user;
  res.json({ user: userData });
});

// PUT /api/users/me - update profile
router.put('/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { name, phone, ageRange, preferredLanguage, culturalInterests, dietaryPreferences } = req.body;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (ageRange) user.ageRange = ageRange;
  if (preferredLanguage) user.preferredLanguage = preferredLanguage;
  if (culturalInterests) user.culturalInterests = culturalInterests;
  if (dietaryPreferences) user.dietaryPreferences = dietaryPreferences;

  const { password, ...userData } = user;
  res.json({ user: userData });
});

// PUT /api/users/me/password
router.put('/me/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

  user.password = await bcrypt.hash(newPassword, 10);
  res.json({ message: 'Password updated successfully' });
});

// POST /api/users/me/addresses
router.post('/me/addresses', authMiddleware, (req, res) => {
  const { v4: uuidv4 } = require('uuid');
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { label, street, city, state, zip, isDefault } = req.body;
  const addr = { id: uuidv4(), label, street, city, state, zip, isDefault: !!isDefault };
  if (isDefault) user.addresses.forEach(a => (a.isDefault = false));
  user.addresses.push(addr);
  res.status(201).json({ addresses: user.addresses });
});

// DELETE /api/users/me/addresses/:addrId
router.delete('/me/addresses/:addrId', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.addresses = user.addresses.filter(a => a.id !== req.params.addrId);
  res.json({ addresses: user.addresses });
});

module.exports = router;
