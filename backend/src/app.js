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
// CORS: Allow frontend from localhost:3000 (dev) and any IP:3000 (network demo)
const corsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  /^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/ // Allow any IP:3000
];
app.use(cors({ origin: corsOrigins, credentials: true }));
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

  app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let localIP = 'localhost';
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
          break;
        }
      }
    }
    console.log(`Server running on http://${localIP}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

start();

module.exports = app;
