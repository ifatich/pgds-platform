// src/routes/auth.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

/**
 * POST /api/auth/login
 * Login with email and password
 * Returns: { token, user }
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 * Auth: Required
 * Returns: user object
 */
router.get('/me', authenticate, authController.getMe);

module.exports = router;
