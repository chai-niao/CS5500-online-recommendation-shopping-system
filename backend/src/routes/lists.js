const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const pool = require('../db/postgres');
const { getDb } = require('../db/mongo');

const router = express.Router();

async function getListsWithItems(userId) {
  const listsResult = await pool.query(
    'SELECT * FROM shopping_lists WHERE user_id = $1 ORDER BY created_at DESC', [userId]
  );

  const lists = [];
  for (const row of listsResult.rows) {
    const itemsResult = await pool.query(
      'SELECT product_id, name, checked FROM shopping_list_items WHERE list_id = $1', [row.id]
    );
    lists.push({
      id: row.id,
      name: row.name,
      items: itemsResult.rows.map(i => ({
        productId: i.product_id,
        name: i.name,
        checked: i.checked,
      })),
      createdAt: row.created_at,
      syncedToDevice: row.synced_to_device,
      lastSynced: row.last_synced || undefined,
    });
  }
  return lists;
}

async function getListWithItems(listId, userId) {
  const listResult = await pool.query(
    'SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2', [listId, userId]
  );
  if (listResult.rows.length === 0) return null;

  const row = listResult.rows[0];
  const itemsResult = await pool.query(
    'SELECT product_id, name, checked FROM shopping_list_items WHERE list_id = $1', [listId]
  );

  return {
    id: row.id,
    name: row.name,
    items: itemsResult.rows.map(i => ({
      productId: i.product_id,
      name: i.name,
      checked: i.checked,
    })),
    createdAt: row.created_at,
    syncedToDevice: row.synced_to_device,
    lastSynced: row.last_synced || undefined,
  };
}

// GET /api/lists
router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json({ lists: await getListsWithItems(req.user.id) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/lists - create a new list
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'List name is required' });

    const id = uuidv4();
    await pool.query(
      'INSERT INTO shopping_lists (id, user_id, name) VALUES ($1, $2, $3)',
      [id, req.user.id, name]
    );

    const list = await getListWithItems(id, req.user.id);
    res.status(201).json({ list });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/lists/:listId/items
router.post('/:listId/items', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const listId = req.params.listId;

    // Verify ownership
    const listCheck = await pool.query(
      'SELECT id FROM shopping_lists WHERE id = $1 AND user_id = $2', [listId, uid]
    );
    if (listCheck.rows.length === 0) return res.status(404).json({ message: 'List not found' });

    const { productId, name } = req.body;

    // Get product name from MongoDB if not provided
    let itemName = name;
    if (!itemName) {
      const product = await getDb().collection('products').findOne({ id: productId });
      itemName = product ? product.name : 'Unknown Item';
    }

    // Check if already exists
    const existing = await pool.query(
      'SELECT id FROM shopping_list_items WHERE list_id = $1 AND product_id = $2', [listId, productId]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO shopping_list_items (list_id, product_id, name, checked) VALUES ($1, $2, $3, false)',
        [listId, productId, itemName]
      );
    }

    const list = await getListWithItems(listId, uid);
    res.json({ list });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/lists/:listId/items/:productId - toggle check
router.put('/:listId/items/:productId', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const { listId, productId } = req.params;

    // Verify ownership
    const listCheck = await pool.query(
      'SELECT id FROM shopping_lists WHERE id = $1 AND user_id = $2', [listId, uid]
    );
    if (listCheck.rows.length === 0) return res.status(404).json({ message: 'List not found' });

    await pool.query(
      'UPDATE shopping_list_items SET checked = NOT checked WHERE list_id = $1 AND product_id = $2',
      [listId, productId]
    );

    const list = await getListWithItems(listId, uid);
    res.json({ list });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/lists/:listId
router.delete('/:listId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM shopping_lists WHERE id = $1 AND user_id = $2', [req.params.listId, req.user.id]
    );
    res.json({ message: 'List deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/lists/:listId/sync - simulate sync to in-store device
router.post('/:listId/sync', authMiddleware, async (req, res) => {
  try {
    const uid = req.user.id;
    const listId = req.params.listId;

    const result = await pool.query(
      'UPDATE shopping_lists SET synced_to_device = true, last_synced = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [listId, uid]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'List not found' });

    const list = await getListWithItems(listId, uid);
    res.json({ list, message: 'List synced to in-store device (simulated)' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
