// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const DEFAULT_SECRET = 'pgds-dev-secret-change-in-prod';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

const isProduction = process.env.NODE_ENV === 'production';
if (JWT_SECRET === DEFAULT_SECRET && isProduction) {
  console.error('\n❌ CRITICAL: JWT_SECRET is not set in production!');
  console.error('   Set JWT_SECRET in Vercel Environment Variables.\n');
} else if (JWT_SECRET === DEFAULT_SECRET) {
  console.warn('\n⚠️  WARNING: JWT_SECRET is not set. Using insecure default secret.');
  console.warn('   Set JWT_SECRET in your .env file for production use.\n');
} else if (isProduction) {
  console.log('✅ JWT_SECRET is configured for production');
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    console.warn(`⚠️  No Authorization header for ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized - no token' });
  }
  if (!header.startsWith('Bearer ')) {
    console.warn(`⚠️  Invalid Authorization format for ${req.method} ${req.path}: ${header.substring(0, 20)}...`);
    return res.status(401).json({ error: 'Unauthorized - invalid format' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    console.warn(`⚠️  Token verification failed for ${req.method} ${req.path}:`, err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super Admin only' });
  }
  next();
}

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { authenticate, requireAdmin, sign };
