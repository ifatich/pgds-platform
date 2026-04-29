// src/routes/activity.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

router.use(authenticate);

/**
 * GET /api/activity
 * Get recent activity logs (limited to 100 latest)
 * Auth: Required
 * Returns: array of activity log entries
 */
router.get('/', activityController.getActivityLog);

module.exports = router;
