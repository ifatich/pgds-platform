// src/controllers/researchRequestsController.js
const { v4: uuid } = require('uuid');
const { getDb } = require('../data/db');
const { parseResearchRequest } = require('../services/parsers');
const { isValidQuarter, isValidResearchStatus } = require('../services/validators');
const { getRequestTypeDefinitions, getPipelineByRequestType } = require('../services/requestTypeHandlers');

function normalizeStatus(status) {
  return String(status || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function resolveResearchTypeKey(whatWeHelp) {
  const normalizedInput = normalizeStatus(whatWeHelp);
  const requestTypes = getRequestTypeDefinitions();

  const byValue = requestTypes.find(t => normalizeStatus(t.value) === normalizedInput);
  if (byValue?.value) return byValue.value;

  const byLabel = requestTypes.find(t => normalizeStatus(t.label) === normalizedInput);
  if (byLabel?.value) return byLabel.value;

  const fuzzy = requestTypes.find(t => {
    const labelKey = normalizeStatus(t.label);
    return labelKey.includes(normalizedInput) || normalizedInput.includes(labelKey);
  });
  if (fuzzy?.value) return fuzzy.value;

  return whatWeHelp;
}

function resolveResearchPipelineStatuses(whatWeHelp) {
  const typeKey = resolveResearchTypeKey(whatWeHelp);
  const byTypePipeline = getPipelineByRequestType(typeKey)
    .map(normalizeStatus)
    .filter(Boolean);

  if (byTypePipeline.length > 0) return byTypePipeline;

  return ['submitted', 'in_progress', 'completed'];
}

/**
 * Get all research requests
 */
async function getAllResearchRequests(req, res) {
  try {
    const rows = getDb()
      .prepare('SELECT * FROM research_requests ORDER BY updated_at DESC')
      .all();

    res.json(rows.map(parseResearchRequest));
  } catch (error) {
    console.error('Get all research requests error:', error);
    res.status(500).json({ error: 'Failed to fetch research requests' });
  }
}

/**
 * Get single research request by ID
 */
async function getResearchRequestById(req, res) {
  try {
    const row = getDb()
      .prepare('SELECT * FROM research_requests WHERE id=?')
      .get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: 'Research request not found' });
    }

    res.json(parseResearchRequest(row));
  } catch (error) {
    console.error('Get research request error:', error);
    res.status(500).json({ error: 'Failed to fetch research request' });
  }
}

/**
 * Create new research request (authenticated users)
 */
async function createResearchRequest(req, res) {
  const { id: userId, name: userName, email: userEmail, phone: userPhone } = req.user;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
      error: 'whatWeHelp, projectName, problemDescription, timelineQuarter required',
    });
  }

  if (!isValidQuarter(timelineQuarter)) {
    return res.status(400).json({
      error: 'timelineQuarter must be Q1, Q2, Q3, or Q4',
    });
  }

  try {
    const now = new Date().toISOString();
    const id = uuid();
    const normalizedWhatWeHelp = resolveResearchTypeKey(whatWeHelp);
    const pipelineStatuses = resolveResearchPipelineStatuses(normalizedWhatWeHelp);
    const initialStatus = pipelineStatuses[0] || 'submitted';

    getDb()
      .prepare(
        `
        INSERT INTO research_requests 
          (id, requester_id, requester_name, requester_email, requester_phone, department, 
           what_we_help, project_name, problem_description, timeline_quarter, 
           attachment_name, attachment_data_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        id,
        userId,
        userName,
        userEmail,
        userPhone,
        department || null,
        normalizedWhatWeHelp,
        projectName,
        problemDescription,
        timelineQuarter,
        attachmentName || null,
        attachmentDataUrl || null,
        initialStatus,
        now,
        now
      );

    const created = getDb()
      .prepare('SELECT * FROM research_requests WHERE id=?')
      .get(id);

    res.status(201).json(parseResearchRequest(created));
  } catch (error) {
    console.error('Create research request error:', error);
    res.status(500).json({ error: 'Failed to create research request' });
  }
}

/**
 * Update research request status (designer/admin only)
 */
async function updateResearchRequestStatus(req, res) {
  const { status, notes } = req.body;
  const normalizedStatus = normalizeStatus(status);

  if (!normalizedStatus) {
    return res.status(400).json({ error: 'status required' });
  }

  try {
    const row = getDb()
      .prepare('SELECT * FROM research_requests WHERE id=?')
      .get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: 'Research request not found' });
    }

    const allowedStatuses = new Set([
      ...resolveResearchPipelineStatuses(row.what_we_help),
      'on_hold',
    ].map(normalizeStatus));

    if (!allowedStatuses.has(normalizedStatus) && !isValidResearchStatus(normalizedStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const now = new Date().toISOString();
    getDb()
      .prepare('UPDATE research_requests SET status=?, notes=?, updated_at=? WHERE id=?')
      .run(normalizedStatus, notes || null, now, req.params.id);

    const updated = getDb()
      .prepare('SELECT * FROM research_requests WHERE id=?')
      .get(req.params.id);

    res.json(parseResearchRequest(updated));
  } catch (error) {
    console.error('Update research request status error:', error);
    res.status(500).json({ error: 'Failed to update research request' });
  }
}

/**
 * Delete research request (requester or admin only)
 */
async function deleteResearchRequest(req, res) {
  try {
    const row = getDb()
      .prepare('SELECT * FROM research_requests WHERE id=?')
      .get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: 'Research request not found' });
    }

    // Only requester or admin can delete
    if (req.user.id !== row.requester_id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    getDb().prepare('DELETE FROM research_requests WHERE id=?').run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete research request error:', error);
    res.status(500).json({ error: 'Failed to delete research request' });
  }
}

module.exports = {
  getAllResearchRequests,
  getResearchRequestById,
  createResearchRequest,
  updateResearchRequestStatus,
  deleteResearchRequest,
};
