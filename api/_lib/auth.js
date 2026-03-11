const jwt = require('jsonwebtoken');

const DEFAULT_SECRET = 'pgds-dev-secret-change-in-prod';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

if (JWT_SECRET === DEFAULT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('\n⚠️  WARNING: JWT_SECRET is not set. Using insecure default secret.');
  console.warn('   Set JWT_SECRET in your .env file for production use.\n');
}

function authenticate(req, res) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return { user: null, error: 'Unauthorized' };
  }
  try {
    const user = jwt.verify(header.slice(7), JWT_SECRET);
    return { user, error: null };
  } catch {
    return { user: null, error: 'Invalid or expired token' };
  }
}

function requireAdmin(user) {
  return user?.role === 'super_admin';
}

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { authenticate, requireAdmin, sign };
