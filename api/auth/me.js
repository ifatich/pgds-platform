const { getDb, initDb } = require('../_lib/db');
const { authenticate } = require('../_lib/auth');
const { sendJson, sendError, handleOptions } = require('../_lib/middleware');

export default function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const auth = authenticate(req, res);
    if (!auth.user) {
      return sendError(res, auth.error, 401);
    }

    initDb();
    const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(auth.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const { password_hash, ...safe } = user;
    return sendJson(res, safe);
  } catch (err) {
    console.error('Get me error:', err);
    return sendError(res, err.message);
  }
}
