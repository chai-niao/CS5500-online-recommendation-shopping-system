const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * AI Chatbot API - Interface Reserved
 * TODO: Integrate OpenAI API (GPT-4) for intelligent responses
 * The endpoint structure is designed for OpenAI API integration.
 * Replace the stubResponse with actual OpenAI API call.
 */

// POST /api/chat/message
router.post('/message', authMiddleware, async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message is required' });
  }

  // --- TODO: OpenAI Integration ---
  // const { OpenAI } = require('openai');
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const completion = await openai.chat.completions.create({
  //   model: 'gpt-4',
  //   messages: [
  //     { role: 'system', content: 'You are a helpful AI shopping assistant for AI Hypermarket...' },
  //     ...conversationHistory,
  //     { role: 'user', content: message }
  //   ]
  // });
  // const reply = completion.choices[0].message.content;
  // --- End TODO ---

  // Stub response until OpenAI is integrated
  const stubReply = generateStubReply(message);

  res.json({
    reply: stubReply,
    timestamp: new Date().toISOString(),
    note: 'AI chatbot stub response. OpenAI API integration pending.',
  });
});

// GET /api/chat/status - check if AI service is available
router.get('/status', (req, res) => {
  res.json({
    available: false,
    message: 'AI chatbot interface is ready. OpenAI API key not configured.',
    // TODO: Set available: true when OPENAI_API_KEY is set
  });
});

function generateStubReply(message) {
  const msg = message.toLowerCase();
  if (msg.includes('hello') || msg.includes('hi')) {
    return "Hello! I'm your AI shopping assistant. How can I help you today? I can help you find products, check allergen information, or answer questions about your orders.";
  }
  if (msg.includes('allergen') || msg.includes('ingredient')) {
    return "I can help you check allergen information! Please tell me which product you're interested in and I'll look up its ingredient and allergen details for you.";
  }
  if (msg.includes('order') || msg.includes('delivery')) {
    return "You can track your order status in the My Account section. If you need further assistance with a specific order, please share your order number.";
  }
  if (msg.includes('recommend') || msg.includes('suggest')) {
    return "Based on your preferences, I'd recommend checking out our AI Recommendations page! We have personalized suggestions just for you.";
  }
  if (msg.includes('festival') || msg.includes('holiday')) {
    return "We have a great Festival Specials section with products curated for upcoming holidays. Check it out for seasonal favorites!";
  }
  if (msg.includes('price') || msg.includes('discount') || msg.includes('promo')) {
    return "We have several promotions available! Try promo code WELCOME10 for 10% off your first order, or FESTIVAL20 for 20% off festival items.";
  }
  return "Thank you for your message! I'm here to help with product queries, allergen checks, order status, and personalized recommendations. What would you like to know?";
}

module.exports = router;
