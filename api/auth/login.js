const bcrypt = require('bcryptjs');
const { getDb, initDb } = require('../_lib/db');
const { sign } = require('../_lib/auth');
const { sendJson, sendError, handleOptions } = require('../_lib/middleware');

export default function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    initDb(); // Ensure DB is initialized
    
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Email and password required', 400);
    }

    const user = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return sendError(res, 'Invalid credentials', 401);
    }
    if (user.status !== 'active') {
      return sendError(res, `Account is ${user.status}`, 403);
    }

    // Update last_active
    getDb().prepare('UPDATE users SET last_active = ? WHERE id = ?').run(
      new Date().toISOString(),
      user.id
    );

    const token = sign({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      team: user.team || null,
    });

    const { password_hash, ...safe } = user;
    return sendJson(res, { token, user: safe });
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, err.message);
  }
}
