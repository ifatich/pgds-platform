// src/routes/data-master.js
const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const dataMasterController = require('../controllers/dataMasterController');

/**
 * GET /api/data-master
 * Get all master data settings
 * Auth: Required
 * Returns: data master settings object
 */
router.get('/', authenticate, dataMasterController.getDataMaster);

/**
 * PUT /api/data-master
 * Update master data settings (admin only)
 * Auth: Required (admin)
 * Body: {
 *   requestTypes,
 *   priorities,
 *   impactLevels,
 *   stateRequirements,
 *   responsiveBehaviours,
 *   severityLevels,
 *   requestPipelines,
 *   requestActions,
 * }
 * Returns: updated data master settings
 */
router.put('/', authenticate, requireAdmin, dataMasterController.updateDataMaster);

module.exports = router;
