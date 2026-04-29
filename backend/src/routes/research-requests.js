// src/routes/research-requests.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const researchRequestsController = require('../controllers/researchRequestsController');

router.use(authenticate);

/**
 * GET /api/research-requests
 * Get all research requests
 * Auth: Required
 * Returns: array of research requests
 */
router.get('/', researchRequestsController.getAllResearchRequests);

/**
 * GET /api/research-requests/:id
 * Get single research request
 * Auth: Required
 * Returns: research request object
 */
router.get('/:id', researchRequestsController.getResearchRequestById);

/**
 * POST /api/research-requests
 * Create new research request
 * Auth: Required
 * Body: { whatWeHelp, projectName, problemDescription, timelineQuarter, department?, attachmentName?, attachmentDataUrl? }
 * Returns: created research request object
 */
router.post('/', researchRequestsController.createResearchRequest);

/**
 * PUT /api/research-requests/:id/status
 * Update research request status (designer/admin only)
 * Auth: Required (designer/admin)
 * Body: { status: 'submitted' | 'in_progress' | 'completed' | 'on_hold', notes? }
 * Returns: updated research request object
 */
router.put('/:id/status', (req, res, next) => {
  if (!['designer', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only designer or admin can update status' });
  }
  next();
}, researchRequestsController.updateResearchRequestStatus);

/**
 * DELETE /api/research-requests/:id
 * Delete research request (requester or admin only)
 * Auth: Required (requester or admin)
 * Returns: { success }
 */
router.delete('/:id', researchRequestsController.deleteResearchRequest);

module.exports = router;
