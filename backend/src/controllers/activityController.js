// src/controllers/activityController.js
const { getDb } = require('../data/db');

/**
 * Get recent activity logs (limited to 100 latest)
 */
async function getActivityLog(req, res) {
  try {
    const rows = getDb()
      .prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 100')
      .all();

    const formatted = rows.map(r => ({
      ...r,
      at: r.created_at,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
}

module.exports = {
  getActivityLog,
};
