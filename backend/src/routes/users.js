// src/routes/users.js
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDb } = require('../data/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const safe = (u) => { const { password_hash, ...rest } = u; return rest; };

router.use(authenticate);

// GET all users (admin only)
router.get('/', requireAdmin, (req, res) => {
  const users = getDb().prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json(users.map(safe));
});

// GET single user
router.get('/:id', requireAdmin, (req, res) => {
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(safe(user));
});

// POST create user (admin only)
router.post('/', requireAdmin, (req, res) => {
  const { name, username, email, password, role, team, phone, status, bio } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'name, email, password, role required' });
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  if (password.length < 8) return res.status(400).json({ error: 'Password min 8 chars' });

  const now = new Date().toISOString();
  const id  = uuid();
  const autoUsername = username || name.toLowerCase().replace(/\s+/g, '.');

  try {
    getDb().prepare(`INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, name, autoUsername, email, bcrypt.hashSync(password, 10),
      role, team || null, phone || null, status || 'active', bio || null,
      now, now, now
    );
    const created = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json(safe(created));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email or username already exists' });
    throw e;
  }
});

// PUT update user
router.put('/:id', requireAdmin, (req, res) => {
  const { name, email, role, team, phone, status, bio, username } = req.body;
  if (!name || !email || !username || !role) return res.status(400).json({ error: 'name, email, username, role required' });
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  if (!['super_admin','designer','engineer','developer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (!['active','inactive','suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  // Prevent super_admin from demoting themselves
  if (req.params.id === req.user.id && role !== 'super_admin') return res.status(400).json({ error: 'Cannot change your own role' });
  const now = new Date().toISOString();
  getDb().prepare(`UPDATE users SET name=?,email=?,username=?,role=?,team=?,phone=?,status=?,bio=?,updated_at=? WHERE id=?`)
    .run(name, email, username, role, team || null, phone || null, status, bio || null, now, req.params.id);
  const updated = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(safe(updated));
});

// PATCH toggle status
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['active','inactive','suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  getDb().prepare('UPDATE users SET status=?, updated_at=? WHERE id=?').run(status, new Date().toISOString(), req.params.id);
  res.json({ ok: true, status });
});

// DELETE user
router.delete('/:id', requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  getDb().prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
