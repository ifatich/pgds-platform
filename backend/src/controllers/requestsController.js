// src/controllers/requestsController.js
const { v4: uuid } = require('uuid');
const { getDb } = require('../data/db');
const { parseRequest, parseRequestLog } = require('../services/parsers');
const { isValidRequestStatus } = require('../services/validators');
const { resolveCreatePolicyByRequestType } = require('../services/requestTypeHandlers');
const { getRequestActionsConfig } = require('../services/workflowConfig');

/**
 * Get request with logs
 */
function getRequestWithLogs(requestId) {
  const req = getDb().prepare('SELECT * FROM requests WHERE id=?').get(requestId);
  if (!req) return null;

  const logs = getDb()
    .prepare('SELECT * FROM request_logs WHERE request_id=? ORDER BY created_at DESC')
    .all(requestId);

  const parsed = parseRequest(req);
  parsed.logs = logs.map(parseRequestLog);
  return parsed;
}

/**
 * Get all requests with logs
 */
async function getAllRequests(req, res) {
  try {
    const rows = getDb().prepare('SELECT * FROM requests ORDER BY updated_at DESC').all();

    const result = rows.map(r => {
      const logs = getDb()
        .prepare('SELECT * FROM request_logs WHERE request_id=? ORDER BY created_at DESC')
        .all(r.id);
      const parsed = parseRequest(r);
      parsed.logs = logs.map(parseRequestLog);
      return parsed;
    });

    res.json(result);
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
}

/**
 * Get single request with logs by ID
 */
async function getRequestById(req, res) {
  try {
    const r = getRequestWithLogs(req.params.id);
    if (!r) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(r);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
}

/**
 * Create new request (developer/designer/admin only)
 */
async function createRequest(req, res) {
  const { role, name: actorName, id: actorId, team: actorTeam } = req.user;

  // Authorization check
  if (!['developer', 'designer', 'super_admin'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const {
    title,
    requestType,
    priority,
    platform,
    componentName,
    componentDescription,
    useCase,
    whatWeHelp,
    expectedOutcome,
    affectedProducts,
    designReferenceLink,
    productionLink,
    referenceProduct,
    interactionBehaviour,
    responsiveBehaviour,
    accessibilityRequirement,
    stateRequirements,
    impactLevel,
    deadline,
    businessGoal,
    additionalNotes,
    projectName,
    problemDescription,
    ...rest
  } = req.body;

  // Unified Title handling
  const finalTitle = title || projectName;

  // Validation
  if (!finalTitle || !requestType) {
    return res.status(400).json({
      error: 'title (or projectName) and requestType are required',
    });
  }

  try {
    // Determine workflow and initial status from requestType category
    const policy = resolveCreatePolicyByRequestType(requestType);
    if (!policy.valid) {
      return res.status(400).json({ error: policy.error });
    }

    const { workflow, initialStatus } = policy;
    const requesterRole = role === 'super_admin' ? 'developer' : role;

    const now = new Date().toISOString();
    const id = uuid();

    // Get requester team from JWT or fallback to database
    const requesterTeam =
      actorTeam ||
      (getDb().prepare('SELECT team FROM users WHERE id=?').get(actorId)?.team || null);

    // Create request
    getDb()
      .prepare(
        `
        INSERT INTO requests (
          id,title,request_type,requester_role,requester_name,requester_team,requester_id,
          priority,platform,component_name,component_description,use_case,affected_products,
          design_reference_link,production_link,reference_product,interaction_behaviour,responsive_behaviour,
          accessibility_requirement,state_requirements,impact_level,deadline,business_goal,
          additional_notes,metadata,status,workflow,created_at,updated_at
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `
      )
      .run(
        id,
        finalTitle,
        requestType,
        requesterRole,
        actorName,
        requesterTeam,
        actorId,
        priority || 'Medium',
        platform || 'Web',
        componentName || projectName || null,
        componentDescription || problemDescription || null,
        useCase || whatWeHelp || expectedOutcome || null,
        JSON.stringify(affectedProducts || []),
        designReferenceLink || null,
        productionLink || null,
        referenceProduct || null,
        interactionBehaviour || null,
        responsiveBehaviour || null,
        accessibilityRequirement ? 1 : 0,
        JSON.stringify(stateRequirements || []),
        impactLevel || null,
        deadline || null,
        businessGoal || null,
        additionalNotes || null,
        JSON.stringify(rest || {}),
        initialStatus,
        workflow,
        now,
        now
      );

    // Create initial log entry
    getDb()
      .prepare(
        `INSERT INTO request_logs (id,request_id,actor,actor_id,actor_role,action,note,icon,dot_class,badge_class,badge_text,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        uuid(),
        id,
        actorName,
        actorId,
        role,
        'created',
        'Request submitted.',
        '📝',
        'info',
        'b-' + initialStatus,
        initialStatus.replace(/_/g, ' '),
        now
      );

    res.status(201).json(getRequestWithLogs(id));
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
}

/**
 * Execute workflow action on request (state machine)
 */
async function executeAction(req, res) {
  const { role, name: actorName, id: actorId } = req.user;
  const {
    action,
    notes,
    version,
    score,
    library,
    componentName,
    projectName,
    docLink,
    figmaLink,
    previewLink,
    screenshotName,
    screenshotDataUrl,
    ...rest
  } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'action required' });
  }

  try {
    const reqRow = getDb().prepare('SELECT * FROM requests WHERE id=?').get(req.params.id);
    if (!reqRow) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Server-side state machine validation from data master config
    const actionConfig = getRequestActionsConfig();
    const transition = actionConfig.transitions[action];
    const actionUi = actionConfig.ui[action] || {};
    if (!transition) {
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    if (!transition.roles.includes(role)) {
      return res.status(403).json({ error: `Action not allowed for role: ${role}` });
    }

    if (!transition.from.includes(reqRow.status)) {
      return res.status(409).json({
        error: `Action '${action}' cannot be performed from status '${reqRow.status}'`,
      });
    }

    const nextStatus = transition.next;
    const now = new Date().toISOString();

    // Merge new metadata if provided
    const currentMetadata = JSON.parse(reqRow.metadata || '{}');
    const updatedMetadata = { ...currentMetadata, ...rest };

    // Update request status and metadata
    getDb()
      .prepare('UPDATE requests SET status=?, metadata=?, updated_at=? WHERE id=?')
      .run(nextStatus, JSON.stringify(updatedMetadata), now, req.params.id);

    // If publishing with new component name, update it
    const providedName = (componentName || projectName)?.trim();
    const effectiveComponentName = (action === 'publish' && providedName) ? providedName : reqRow.component_name;

    if (action === 'publish' && providedName && providedName !== reqRow.component_name) {
      getDb()
        .prepare('UPDATE requests SET component_name=? WHERE id=?')
        .run(providedName, req.params.id);
    }

    // Create log entry
    getDb()
      .prepare(
        `INSERT INTO request_logs (id,request_id,actor,actor_id,actor_role,action,note,icon,dot_class,badge_class,badge_text,score,version,library,doc_link,component_name,figma_link,preview_link,screenshot_name,screenshot_data_url,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        uuid(),
        req.params.id,
        actorName,
        actorId,
        role,
        action,
        notes || action + ' completed.',
        actionUi.logIcon || actionUi.icon || '🔄',
        actionUi.dotClass || 'info',
        'b-' + nextStatus,
        nextStatus.replace(/_/g, ' '),
        score || null,
        version || null,
        library || null,
        docLink || null,
        action === 'publish' ? effectiveComponentName : null,
        figmaLink || null,
        previewLink || null,
        screenshotName || null,
        screenshotDataUrl || null,
        now
      );

    // If published, sync/create component record (UPSERT) — skip audit workflow
    if (nextStatus === 'done' && reqRow.workflow !== 'audit') {
      const existingComp = getDb()
        .prepare('SELECT id FROM components WHERE name=? AND is_active=1')
        .get(reqRow.component_name);

      if (existingComp) {
        getDb()
          .prepare(
            `UPDATE components SET status='done', version=?, library=?, doc_link=?, name=?, updated_at=? WHERE id=?`
          )
          .run(version || null, library || null, docLink || null, effectiveComponentName, now, existingComp.id);
      } else {
        const slug = effectiveComponentName
          .replace(/([A-Z])/g, (m, l, i) => (i > 0 ? '-' + l.toLowerCase() : l.toLowerCase()))
          .replace(/^-/, '')
          .replace(/\s+/g, '-');
        const compId = uuid();

        try {
          getDb()
            .prepare(
              `INSERT INTO components (id,name,slug,atomic_level,status,version,library,doc_link,is_active,tags,created_at,updated_at) VALUES (?,?,?,NULL,'done',?,?,?,1,'[]',?,?)`
            )
            .run(compId, effectiveComponentName, slug, version || null, library || null, docLink || null, now, now);
        } catch (e) {
          // Handle duplicate slug
          getDb()
            .prepare(
              `INSERT INTO components (id,name,slug,atomic_level,status,version,library,doc_link,is_active,tags,created_at,updated_at) VALUES (?,?,?,NULL,'done',?,?,?,1,'[]',?,?)`
            )
            .run(
              compId,
              effectiveComponentName,
              slug + '-' + compId.slice(0, 6),
              version || null,
              library || null,
              docLink || null,
              now,
              now
            );
        }
      }
    }

    // Log global activity
    getDb()
      .prepare(`INSERT INTO activity_log VALUES (?,?,?,?,?)`)
      .run(
        uuid(),
        `${actorName} — ${action.replace(/_/g, ' ')} on "${reqRow.title}"`,
        actorName,
        actionUi.logIcon || actionUi.icon || '🔄',
        now
      );

    res.json(getRequestWithLogs(req.params.id));
  } catch (error) {
    console.error('Execute action error:', error);
    res.status(500).json({ error: 'Failed to execute action' });
  }
}

/**
 * Trigger audit workflow (designer/admin only)
 */
async function triggerAudit(req, res) {
  if (!['designer', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { componentName, reason, priority, notes } = req.body;

  if (!componentName || !reason) {
    return res.status(400).json({ error: 'componentName and reason required' });
  }

  try {
    const now = new Date().toISOString();
    const id = uuid();

    getDb()
      .prepare(
        `INSERT INTO requests (id,title,request_type,requester_role,priority,component_name,component_description,use_case,affected_products,state_requirements,status,workflow,audit_reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        id,
        `Audit: ${componentName}`,
        'component_enhancement',
        req.user.role,
        priority || 'Medium',
        componentName,
        reason,
        'Audit triggered.',
        '[]',
        '[]',
        'need_audit',
        'audit',
        reason,
        now,
        now
      );

    getDb()
      .prepare(
        `INSERT INTO request_logs (id,request_id,actor,actor_id,actor_role,action,note,icon,dot_class,badge_class,badge_text,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        uuid(),
        id,
        req.user.name,
        req.user.id,
        req.user.role,
        'trigger_audit',
        notes || `Audit triggered: ${reason}`,
        '🔍',
        'info',
        'b-need_audit',
        'Need Audit',
        now
      );

    res.status(201).json(getRequestWithLogs(id));
  } catch (error) {
    console.error('Trigger audit error:', error);
    res.status(500).json({ error: 'Failed to trigger audit' });
  }
}

/**
 * Override request status (super_admin only)
 */
async function overrideStatus(req, res) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super Admin only' });
  }

  const { status, note } = req.body;
  const normalizedStatus = String(status || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_');

  if (!normalizedStatus) {
    return res.status(400).json({ error: 'status required' });
  }

  if (!isValidRequestStatus(normalizedStatus)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const now = new Date().toISOString();

    getDb()
      .prepare('UPDATE requests SET status=?, updated_at=? WHERE id=?')
      .run(normalizedStatus, now, req.params.id);

    getDb()
      .prepare(
        `INSERT INTO request_logs (id,request_id,actor,actor_id,actor_role,action,note,icon,dot_class,badge_class,badge_text,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        uuid(),
        req.params.id,
        req.user.name,
        req.user.id,
        'super_admin',
        'override',
        note || 'Status overridden.',
        '⚡',
        'revision',
        'b-' + normalizedStatus,
        normalizedStatus.replace(/_/g, ' '),
        now
      );

    res.json(getRequestWithLogs(req.params.id));
  } catch (error) {
    console.error('Override status error:', error);
    res.status(500).json({ error: 'Failed to override status' });
  }
}

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  executeAction,
  triggerAudit,
  overrideStatus,
};
