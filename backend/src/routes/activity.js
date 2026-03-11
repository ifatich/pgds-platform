// src/routes/activity.js
const router = require('express').Router();
const { getDb } = require('../data/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 100').all();
  res.json(rows.map(r => ({ ...r, at: r.created_at })));
});

module.exports = router;
