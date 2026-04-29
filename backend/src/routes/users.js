// src/routes/users.js
const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

router.use(authenticate);

/**
 * GET /api/users
 * Get all users (admin only)
 * Auth: Required (admin)
 * Returns: array of users
 */
router.get('/', requireAdmin, usersController.getAllUsers);

/**
 * GET /api/users/:id
 * Get single user (admin only)
 * Auth: Required (admin)
 * Returns: user object
 */
router.get('/:id', requireAdmin, usersController.getUserById);

/**
 * POST /api/users
 * Create new user (admin only)
 * Auth: Required (admin)
 * Body: { name, username?, email, password, role, team?, phone?, status?, bio? }
 * Returns: created user object
 */
router.post('/', requireAdmin, usersController.createUser);

/**
 * PUT /api/users/:id
 * Update user (admin only)
 * Auth: Required (admin)
 * Body: { name, email, username, role, team?, phone?, status, bio? }
 * Returns: updated user object
 */
router.put('/:id', requireAdmin, usersController.updateUser);

/**
 * PATCH /api/users/:id/status
 * Update user status (admin only)
 * Auth: Required (admin)
 * Body: { status: 'active' | 'inactive' | 'suspended' }
 * Returns: { ok, status }
 */
router.patch('/:id/status', requireAdmin, usersController.updateUserStatus);

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 * Auth: Required (admin)
 * Returns: { ok }
 */
router.delete('/:id', requireAdmin, usersController.deleteUser);

module.exports = router;
