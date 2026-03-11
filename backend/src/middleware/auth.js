// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const DEFAULT_SECRET = 'pgds-dev-secret-change-in-prod';

function getSecret() {
  return process.env.JWT_SECRET || DEFAULT_SECRET;
}

function authenticate(req, res, next) {
  const JWT_SECRET = getSecret();
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
  return jwt.sign(payload, getSecret(), { expiresIn: '8h' });
}

module.exports = { authenticate, requireAdmin, sign };

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
