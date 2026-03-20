require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/postgres');
const { connectMongo, isMongoConnected } = require('./db/mongo');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const recommendationRoutes = require('./routes/recommendations');
const listRoutes = require('./routes/lists');
const chatRoutes = require('./routes/chat');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  let postgres = 'unknown';
  try {
    await pool.query('SELECT 1');
    postgres = 'up';
  } catch (_) {
    postgres = 'down';
  }

  const mongo = isMongoConnected() ? 'up' : 'down';
  const status = postgres === 'up' ? 'ok' : 'degraded';

  res.json({
    status,
    message: 'AI Hypermarket API is running',
    services: { postgres, mongo },
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  // Mongo is optional at boot: if unavailable, API still starts in degraded mode.
  try {
    await connectMongo();
  } catch (err) {
    console.warn('MongoDB unavailable at startup. Running in degraded mode.');
    console.warn(`MongoDB error: ${err.message}`);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

start();

module.exports = app;
