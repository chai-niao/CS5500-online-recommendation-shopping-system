const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const pool = require('../db/postgres');
const { tryGetDb, isMongoConnected } = require('../db/mongo');

const router = express.Router();

// Lazy-init OpenAI client (only when API key is configured)
let openai = null;
function getOpenAI() {
  if (openai) return openai;
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') return null;
  const { OpenAI } = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

const MAX_PRODUCTS_IN_PROMPT = parseInt(process.env.CHAT_PROMPT_PRODUCT_LIMIT || '15', 10);
const MAX_HISTORY_MESSAGES = parseInt(process.env.CHAT_HISTORY_MAX_MESSAGES || '12', 10);
const MAX_USER_MESSAGE_LENGTH = parseInt(process.env.CHAT_USER_MESSAGE_MAX_CHARS || '1200', 10);

function sanitizeConversationHistory(conversationHistory = []) {
  if (!Array.isArray(conversationHistory)) return [];
  return conversationHistory
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_USER_MESSAGE_LENGTH) }))
    .slice(-MAX_HISTORY_MESSAGES);
}

async function getRelevantProductsForPrompt(userMessage) {
  const db = tryGetDb();
  if (!db) return [];

  const col = db.collection('products');
  const text = (userMessage || '').trim();

  if (!text) {
    return col.find({ featured: true }).limit(MAX_PRODUCTS_IN_PROMPT).toArray();
  }

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3)
    .slice(0, 8);

  // Try full-text first (index created in mongo-seed.js)
  try {
    const textSearch = await col.find({ $text: { $search: text } }, { projection: { score: { $meta: 'textScore' } } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(MAX_PRODUCTS_IN_PROMPT)
      .toArray();

    if (textSearch.length > 0) return textSearch;
  } catch (_) {
    // ignore and fallback to regex strategy
  }

  if (tokens.length === 0) {
    return col.find({ featured: true }).limit(MAX_PRODUCTS_IN_PROMPT).toArray();
  }

  const regex = new RegExp(tokens.join('|'), 'i');
  const fallback = await col.find({
    $or: [
      { name: regex },
      { category: regex },
      { brand: regex },
      { tags: regex },
      { dietaryInfo: regex },
    ],
  }).limit(MAX_PRODUCTS_IN_PROMPT).toArray();

  if (fallback.length > 0) return fallback;
  return col.find({ featured: true }).limit(MAX_PRODUCTS_IN_PROMPT).toArray();
}


async function buildSystemPrompt(userId, userMessage) {
  const products = await getRelevantProductsForPrompt(userMessage);
  const productLines = products.map(p => {
    const loc = p.location
      ? `Location: Aisle ${p.location.aisle}, Section ${p.location.section}, Shelf ${p.location.shelf}, ${p.location.zone} Zone`
      : 'Location: Not available';
    const dietary = Array.isArray(p.dietaryInfo) && p.dietaryInfo.length > 0 ? `Dietary: ${p.dietaryInfo.join(', ')}` : '';
    return `- ${p.name} (${p.id}) | $${p.price} | Category: ${p.category} | ${loc} | ${dietary} | Stock: ${p.stock}`;
  }).join('\n');

  let userProfileInfo = 'No user profile available.';
  if (userId) {
    const userResult = await pool.query(
      'SELECT name, age_range, preferred_language, cultural_interests, dietary_preferences FROM users WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (userResult.rows.length > 0) {
      const u = userResult.rows[0];
      const cultural = Array.isArray(u.cultural_interests) && u.cultural_interests.length > 0
        ? u.cultural_interests.join(', ')
        : 'None';
      const dietary = Array.isArray(u.dietary_preferences) && u.dietary_preferences.length > 0
        ? u.dietary_preferences.join(', ')
        : 'None';
      userProfileInfo = `- Name: ${u.name || 'N/A'}\n- Age range: ${u.age_range || 'N/A'}\n- Preferred language: ${u.preferred_language || 'English'}\n- Cultural interests: ${cultural}\n- Dietary preferences: ${dietary}`;
    }
  }

  let orderInfo = 'No recent orders.';
  if (userId) {
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [userId]
    );
    if (ordersResult.rows.length > 0) {
      const orderLines = [];
      for (const o of ordersResult.rows) {
        const items = await pool.query('SELECT name, quantity, price FROM order_items WHERE order_id = $1', [o.id]);
        const itemStr = items.rows.map(i => `${i.name} x${i.quantity}`).join(', ');
        orderLines.push(`- Order ${o.id}: ${o.status} | $${o.total} | Items: ${itemStr} | Date: ${o.created_at}`);
      }
      orderInfo = orderLines.join('\n');
    }
  }

  const promosResult = await pool.query('SELECT * FROM promotions WHERE active = true LIMIT 10');
  const promoLines = promosResult.rows.map(p =>
    `- Code: ${p.code} | ${p.description} | Min order: $${p.min_order}`
  ).join('\n');

  return `You are a helpful AI shopping assistant for AI Hypermarket, a modern supermarket.

Your capabilities:
1. Help customers find products and tell them the EXACT in-store location (aisle, section, shelf, zone)
2. Provide allergen and dietary information for any product
3. Check order status and history
4. Recommend products based on preferences
5. Share available promotions and discount codes
6. Answer general questions about the store

IMPORTANT RULES:
- When asked about product locations, ALWAYS provide the specific aisle number, section letter, shelf number, and zone.
- Format locations as: "Aisle [number], Section [letter], Shelf [number] in the [Zone] Zone"
- When asked about allergens or dietary info, check the product's dietaryInfo field.
- Prefer suggestions aligned with customer's dietary preferences and cultural interests.
- Be friendly, concise, and helpful.
- If you don't know something, say so honestly.

CUSTOMER PROFILE PREFERENCES:
${userProfileInfo}

RELEVANT PRODUCT CONTEXT (TOP ${MAX_PRODUCTS_IN_PROMPT}):
${productLines}

CUSTOMER'S RECENT ORDERS:
${orderInfo}

AVAILABLE PROMOTIONS:
${promoLines}`;
}

// POST /api/chat/message
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }

    const trimmedMessage = String(message).trim().slice(0, MAX_USER_MESSAGE_LENGTH);
    const safeHistory = sanitizeConversationHistory(conversationHistory);

    const client = getOpenAI();

    // If OpenAI is not configured, fall back to stub
    if (!client) {
      const stubReply = generateStubReply(trimmedMessage);
      return res.json({
        reply: stubReply,
        timestamp: new Date().toISOString(),
        note: 'AI chatbot stub response. Set OPENAI_API_KEY in .env to enable AI.',
      });
    }

    // Build system prompt with bounded and relevant context
    const systemPrompt = await buildSystemPrompt(req.user.id, trimmedMessage);

    // Call OpenAI
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...safeHistory,
        { role: 'user', content: trimmedMessage },
      ],
      max_tokens: parseInt(process.env.CHAT_MAX_TOKENS || '500', 10),
      temperature: parseFloat(process.env.CHAT_TEMPERATURE || '0.7'),
    });

    const reply = completion.choices[0].message.content;

    // Save conversation to MongoDB
    try {
      const db = tryGetDb();
      if (db) {
        const chatCol = db.collection('chat_conversations');
        await chatCol.updateOne(
          { userId: req.user.id },
          {
            $push: {
              messages: {
                $each: [
                  { role: 'user', content: trimmedMessage, timestamp: new Date() },
                  { role: 'assistant', content: reply, timestamp: new Date() },
                ],
              },
            },
            $set: { updatedAt: new Date() },
            $setOnInsert: { userId: req.user.id, sessionId: uuidv4(), createdAt: new Date() },
          },
          { upsert: true }
        );
      }
    } catch (saveErr) {
      console.error('Failed to save chat history:', saveErr.message);
    }

    res.json({
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    // Graceful fallback
    res.json({
      reply: "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again in a moment, or I can help you with basic questions!",
      timestamp: new Date().toISOString(),
      note: 'AI service error, fallback response.',
    });
  }
});

// GET /api/chat/status - check if AI service is available
router.get('/status', (req, res) => {
  const client = getOpenAI();
  res.json({
    available: !!client,
    mongoConnected: isMongoConnected(),
    message: client
      ? 'AI chatbot is active and ready.'
      : 'AI chatbot is in stub mode. Set OPENAI_API_KEY in .env to enable AI.',
  });
});

// Stub reply fallback (used when OpenAI key is not configured)
function generateStubReply(message) {
  const msg = message.toLowerCase();
  if (msg.includes('hello') || msg.includes('hi')) {
    return "Hello! I'm your AI shopping assistant. How can I help you today? I can help you find products, check allergen information, or answer questions about your orders.";
  }
  if (msg.includes('where') || msg.includes('find') || msg.includes('location') || msg.includes('aisle')) {
    return "I can help you find products in our store! To get exact aisle and shelf locations, please enable the AI service by setting OPENAI_API_KEY in the backend .env file. In the meantime, you can check product detail pages for location info.";
  }
  if (msg.includes('allergen') || msg.includes('ingredient') || msg.includes('dietary')) {
    return "I can help you check allergen information! Please tell me which product you're interested in and I'll look up its dietary details for you.";
  }
  if (msg.includes('order') || msg.includes('delivery')) {
    return "You can track your order status in the My Account section. If you need further assistance with a specific order, please share your order number.";
  }
  if (msg.includes('recommend') || msg.includes('suggest')) {
    return "Based on your preferences, I'd recommend checking out our AI Recommendations page! We have personalized suggestions just for you.";
  }
  if (msg.includes('price') || msg.includes('discount') || msg.includes('promo')) {
    return "We have several promotions available! Try promo code WELCOME10 for 10% off your first order, or FESTIVAL20 for 20% off festival items.";
  }
  return "Thank you for your message! I'm here to help with product queries, allergen checks, order status, and personalized recommendations. What would you like to know?";
}

module.exports = router;
