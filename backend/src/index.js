// src/index.js
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./data/db');

const app  = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting and client IP
app.set('trust proxy', 1);

// CORS — must be before helmet
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests explicitly  
app.options('*', cors());

// Prevent API caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  next();
});

// Security headers
app.use(helmet());
app.use(express.json({ limit: '20mb' }));

// Rate limiting — auth endpoints: max 20 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/auth/login', authLimiter);

initDb();

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/requests',      require('./routes/requests'));
app.use('/api/components',    require('./routes/components'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/menu-settings', require('./routes/menu'));
app.use('/api/data-master',   require('./routes/data-master'));
app.use('/api/activity',      require('./routes/activity'));

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀  PGDS API  →  http://localhost:${PORT}/api\n`);
});
