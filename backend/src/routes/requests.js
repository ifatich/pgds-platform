// src/routes/requests.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const requestsController = require('../controllers/requestsController');

router.use(authenticate);

/**
 * GET /api/requests
 * Get all requests with logs
 * Auth: Required
 * Returns: array of requests with their workflow logs
 */
router.get('/', requestsController.getAllRequests);

/**
 * GET /api/requests/:id
 * Get single request with logs
 * Auth: Required
 * Returns: request object with logs array
 */
router.get('/:id', requestsController.getRequestById);

/**
 * POST /api/requests
 * Create new request (developer/designer/admin only)
 * Auth: Required (developer/designer/admin)
 * Body: {
 *   title, requestType, componentName, componentDescription, useCase,
 *   priority?, platform?, affectedProducts?, designReferenceLink?,
 *   referenceProduct?, interactionBehaviour?, responsiveBehaviour?,
 *   accessibilityRequirement?, stateRequirements?, impactLevel?,
 *   deadline?, businessGoal?, additionalNotes?
 * }
 * Returns: created request object with initial log
 */
router.post('/', requestsController.createRequest);

/**
 * POST /api/requests/:id/action
 * Execute workflow action on request (state machine)
 * Auth: Required (workflow role-based)
 * Body: {
 *   action: (see STATE_MACHINE), notes?, version?, score?, library?,
 *   componentName?, docLink?, figmaLink?, previewLink?,
 *   screenshotName?, screenshotDataUrl?
 * }
 * Returns: updated request object with new log entry
 */
router.post('/:id/action', requestsController.executeAction);

/**
 * POST /api/requests/audit/trigger
 * Trigger audit workflow (designer/admin only)
 * Auth: Required (designer/admin)
 * Body: { componentName, reason, priority?, notes? }
 * Returns: created audit request object
 */
router.post('/audit/trigger', requestsController.triggerAudit);

/**
 * PUT /api/requests/:id/override
 * Override request status (super_admin only)
 * Auth: Required (super_admin)
 * Body: { status, note? }
 * Returns: updated request object with override log
 */
router.put('/:id/override', requestsController.overrideStatus);

module.exports = router;
