// src/routes/menu.js
const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const menuController = require('../controllers/menuController');

/**
 * GET /api/menu-settings
 * Get menu settings (public endpoint)
 * Auth: Not required
 * Returns: menu settings object
 */
router.get('/', menuController.getMenuSettings);

/**
 * PUT /api/menu-settings
 * Update menu settings (admin only)
 * Auth: Required (admin)
 * Body: menu settings object
 * Returns: updated menu settings
 */
router.put('/', authenticate, requireAdmin, menuController.updateMenuSettings);

module.exports = router;
