// src/routes/components.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const componentsController = require('../controllers/componentsController');

/**
 * GET /api/components
 * Get all active components
 * Auth: Not required
 * Returns: array of active components
 */
router.get('/', componentsController.getAllComponents);

/**
 * GET /api/components/:id
 * Get single component
 * Auth: Not required
 * Returns: component object
 */
router.get('/:id', componentsController.getComponentById);

/**
 * POST /api/components
 * Create new component (engineer/admin only)
 * Auth: Required (engineer/admin)
 * Body: { name, slug, atomicLevel?, category?, description?, figmaUrl?, storybookUrl?, codeOwner?, tags?, library?, version?, docLink? }
 * Returns: created component object
 */
router.post('/', authenticate, (req, res, next) => {
  if (!['engineer', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}, componentsController.createComponent);

/**
 * PUT /api/components/:id
 * Update component (engineer/admin only)
 * Auth: Required (engineer/admin)
 * Body: { name, slug, atomicLevel?, category?, description?, figmaUrl?, storybookUrl?, codeOwner?, tags?, library?, version?, docLink? }
 * Returns: updated component object
 */
router.put('/:id', authenticate, (req, res, next) => {
  if (!['engineer', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}, componentsController.updateComponent);

/**
 * DELETE /api/components/:id
 * Soft delete component (engineer/admin only)
 * Auth: Required (engineer/admin)
 * Returns: { ok }
 */
router.delete('/:id', authenticate, (req, res, next) => {
  if (!['engineer', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}, componentsController.deleteComponent);

module.exports = router;
