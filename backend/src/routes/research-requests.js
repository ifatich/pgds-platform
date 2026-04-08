// src/routes/research-requests.js
const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { getDb } = require('../data/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── helpers ─────────────────────────────────────────────────────────────────
function parseResearchRequest(r) {
  return {
    id: r.id,
    requesterId: r.requester_id,
    requesterName: r.requester_name,
    requesterEmail: r.requester_email,
    requesterPhone: r.requester_phone,
    department: r.department,
    whatWeHelp: r.what_we_help,
    projectName: r.project_name,
    problemDescription: r.problem_description,
    timelineQuarter: r.timeline_quarter,
    attachmentName: r.attachment_name,
    attachmentDataUrl: r.attachment_data_url,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── GET all research requests ───────────────────────────────────────────────
router.get('/', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM research_requests ORDER BY updated_at DESC').all();
  res.json(rows.map(parseResearchRequest));
});

// ── GET single research request ─────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM research_requests WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(parseResearchRequest(row));
});

// ── POST create research request ────────────────────────────────────────────
router.post('/', (req, res) => {
  const { id: userId, name: userName, email: userEmail, phone: userPhone, team: userTeam } = req.user;
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    whatWeHelp,
    projectName,
    problemDescription,
    timelineQuarter,
    department,
    attachmentName,
    attachmentDataUrl,
  } = req.body;

  // Validation
  if (!whatWeHelp || !projectName || !problemDescription || !timelineQuarter) {
    return res.status(400).json({ 
      error: 'whatWeHelp, projectName, problemDescription, timelineQuarter required' 
    });
  }

  if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(timelineQuarter)) {
    return res.status(400).json({ error: 'timelineQuarter must be Q1, Q2, Q3, or Q4' });
  }

  const now = new Date().toISOString();
  const id = uuid();

  try {
    getDb().prepare(`
      INSERT INTO research_requests 
        (id, requester_id, requester_name, requester_email, requester_phone, department, 
         what_we_help, project_name, problem_description, timeline_quarter, 
         attachment_name, attachment_data_url, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, userName, userEmail, userPhone, department || null,
      whatWeHelp, projectName, problemDescription, timelineQuarter,
      attachmentName || null, attachmentDataUrl || null, 'submitted', now, now
    );

    const created = getDb().prepare('SELECT * FROM research_requests WHERE id=?').get(id);
    res.status(201).json(parseResearchRequest(created));
  } catch (err) {
    console.error('Error creating research request:', err);
    res.status(500).json({ error: 'Failed to create research request' });
  }
});

// ── PUT update research request status ───────────────────────────────────────
router.put('/:id/status', (req, res) => {
  if (!['designer', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only designer or admin can update status' });
  }

  const { status, notes } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });

  if (!['submitted', 'in_progress', 'completed', 'on_hold'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const row = getDb().prepare('SELECT * FROM research_requests WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const now = new Date().toISOString();
  getDb().prepare('UPDATE research_requests SET status=?, notes=?, updated_at=? WHERE id=?')
    .run(status, notes || null, now, req.params.id);

  const updated = getDb().prepare('SELECT * FROM research_requests WHERE id=?').get(req.params.id);
  res.json(parseResearchRequest(updated));
});

// ── DELETE research request ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM research_requests WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  // Only requester or admin can delete
  if (req.user.id !== row.requester_id && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  getDb().prepare('DELETE FROM research_requests WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
