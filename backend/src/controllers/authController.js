// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const { getDb } = require('../data/db');
const { sign } = require('../middleware/auth');
const { parseUser } = require('../services/parsers');

/**
 * Login user with email and password
 * Returns JWT token and user data
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is ' + user.status });
    }

    // Update last_active timestamp
    getDb().prepare('UPDATE users SET last_active = ? WHERE id = ?').run(
      new Date().toISOString(),
      user.id
    );

    // Generate JWT token
    const token = sign({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      team: user.team || null,
    });

    res.json({
      token,
      user: parseUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Get current authenticated user profile
 */
async function getMe(req, res) {
  try {
    const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(parseUser(user));
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

module.exports = {
  login,
  getMe,
};
