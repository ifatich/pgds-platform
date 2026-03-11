// src/routes/auth.js
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { getDb } = require('../data/db');
const { sign, authenticate } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account is ' + user.status });
  }

  // update last_active
  getDb().prepare('UPDATE users SET last_active = ? WHERE id = ?').run(new Date().toISOString(), user.id);

  const token = sign({ id: user.id, role: user.role, name: user.name, email: user.email, team: user.team || null });
  const { password_hash, ...safe } = user;
  res.json({ token, user: safe });
});

router.get('/me', authenticate, (req, res) => {
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...safe } = user;
  res.json(safe);
});

module.exports = router;
