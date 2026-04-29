// src/controllers/menuController.js
const { getDb } = require('../data/db');

/**
 * Get menu settings (public endpoint)
 */
async function getMenuSettings(req, res) {
  try {
    const row = getDb()
      .prepare(`SELECT settings FROM menu_settings WHERE id='singleton'`)
      .get();

    res.json(row ? JSON.parse(row.settings) : {});
  } catch (error) {
    console.error('Get menu settings error:', error);
    res.status(500).json({ error: 'Failed to fetch menu settings' });
  }
}

/**
 * Update menu settings (admin only)
 */
async function updateMenuSettings(req, res) {
  try {
    const settings = JSON.stringify(req.body);

    getDb()
      .prepare(
        `INSERT INTO menu_settings (id,settings) VALUES ('singleton',?) ON CONFLICT(id) DO UPDATE SET settings=excluded.settings`
      )
      .run(settings);

    res.json(req.body);
  } catch (error) {
    console.error('Update menu settings error:', error);
    res.status(500).json({ error: 'Failed to update menu settings' });
  }
}

module.exports = {
  getMenuSettings,
  updateMenuSettings,
};
