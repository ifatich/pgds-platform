// src/controllers/usersController.js
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDb } = require('../data/db');
const { parseUser } = require('../services/parsers');
const {
  isValidEmail,
  isValidPassword,
  isValidRole,
  isValidUserStatus,
} = require('../services/validators');

/**
 * Get all users (admin only)
 */
async function getAllUsers(req, res) {
  try {
    const users = getDb()
      .prepare('SELECT * FROM users ORDER BY created_at DESC')
      .all();
    res.json(users.map(u => parseUser(u)));
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * Get single user by ID (admin only)
 */
async function getUserById(req, res) {
  try {
    const user = getDb()
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(parseUser(user));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

/**
 * Create new user (admin only)
 */
async function createUser(req, res) {
  const { name, username, email, password, role, team, phone, status, bio } = req.body;

  // Validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      error: 'name, email, password, role required',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (!isValidRole(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const now = new Date().toISOString();
    const id = uuid();
    const autoUsername = username || name.toLowerCase().replace(/\s+/g, '.');

    getDb()
      .prepare(
        `INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        id,
        name,
        autoUsername,
        email,
        bcrypt.hashSync(password, 10),
        role,
        team || null,
        phone || null,
        status || 'active',
        bio || null,
        now,
        now,
        now
      );

    const created = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json(parseUser(created));
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * Update user (admin only)
 */
async function updateUser(req, res) {
  const { name, email, role, team, phone, status, bio, username } = req.body;

  // Validation
  if (!name || !email || !username || !role) {
    return res.status(400).json({
      error: 'name, email, username, role required',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!isValidRole(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (!isValidUserStatus(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Prevent admin from demoting themselves
  if (req.params.id === req.user.id && role !== 'super_admin') {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  try {
    const now = new Date().toISOString();

    getDb()
      .prepare(
        `UPDATE users SET name=?,email=?,username=?,role=?,team=?,phone=?,status=?,bio=?,updated_at=? WHERE id=?`
      )
      .run(
        name,
        email,
        username,
        role,
        team || null,
        phone || null,
        status,
        bio || null,
        now,
        req.params.id
      );

    const updated = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(parseUser(updated));
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

/**
 * Update user status (admin only)
 */
async function updateUserStatus(req, res) {
  const { status } = req.body;

  if (!status || !isValidUserStatus(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    getDb()
      .prepare('UPDATE users SET status=?, updated_at=? WHERE id=?')
      .run(status, new Date().toISOString(), req.params.id);

    res.json({ ok: true, status });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
}

/**
 * Delete user (admin only)
 */
async function deleteUser(req, res) {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  try {
    getDb().prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
