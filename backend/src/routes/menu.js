// src/routes/menu.js
const router = require('express').Router();
const { getDb } = require('../data/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const row = getDb().prepare(`SELECT settings FROM menu_settings WHERE id='singleton'`).get();
  res.json(row ? JSON.parse(row.settings) : {});
});

router.put('/', requireAdmin, (req, res) => {
  const settings = JSON.stringify(req.body);
  getDb().prepare(`INSERT INTO menu_settings (id,settings) VALUES ('singleton',?) ON CONFLICT(id) DO UPDATE SET settings=excluded.settings`).run(settings);
  res.json(req.body);
});

module.exports = router;
