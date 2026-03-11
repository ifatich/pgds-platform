/**
 * Vercel Serverless API Wrapper
 * Wraps the Express app untuk Vercel deployment
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDb } = require('../backend/src/data/db');

const app = express();

// Trust Vercel proxy for rate limiting and client IP
app.set('trust proxy', 1);

// CORS — must be before helmet
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

// Prevent API caching in Vercel
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  next();
});

// Security headers
app.use(helmet());
app.use(express.json({ limit: '20mb' }));

// Rate limiting — auth endpoints: max 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/auth/login', authLimiter);

// Initialize database
try {
  initDb();
  console.log('✅ Database initialized');
} catch (err) {
  console.error('❌ Database initialization failed:', err.message);
}

// Routes - with debug logging
const mountRoute = (path, handler) => {
  try {
    app.use(path, handler);
    console.log(`✅ Route mounted: ${path}`);
  } catch (err) {
    console.error(`❌ Failed to mount route ${path}:`, err.message);
  }
};

mountRoute('/api/auth', require('../backend/src/routes/auth'));
mountRoute('/api/requests', require('../backend/src/routes/requests'));
mountRoute('/api/components', require('../backend/src/routes/components'));
mountRoute('/api/users', require('../backend/src/routes/users'));
mountRoute('/api/menu-settings', require('../backend/src/routes/menu'));
mountRoute('/api/data-master', require('../backend/src/routes/data-master'));
mountRoute('/api/activity', require('../backend/src/routes/activity'));

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// 404 handler with debug info
app.use('/api/*', (req, res) => {
  console.warn(`⚠️ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found', path: req.originalUrl, method: req.method });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`\n🚀  PGDS API  →  http://localhost:${PORT}/api\n`);
  });
}

// Export for Vercel serverless
module.exports = app;
