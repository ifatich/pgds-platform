// src/routes/requests.js
const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { getDb } = require('../data/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── helpers ─────────────────────────────────────────────────────────────────
function parseReq(r) {
  return {
    ...r,
    affectedProducts: JSON.parse(r.affected_products || '[]'),
    stateRequirements: JSON.parse(r.state_requirements || '[]'),
    accessibilityRequirement: !!r.accessibility_requirement,
    requestType: r.request_type,
    requesterRole: r.requester_role,
    requesterName: r.requester_name || null,
    requesterTeam: r.requester_team || null,
    requesterId: r.requester_id || null,
    componentName: r.component_name,
    componentDescription: r.component_description,
    useCase: r.use_case,
    designReferenceLink: r.design_reference_link,
    referenceProduct: r.reference_product,
    interactionBehaviour: r.interaction_behaviour,
    responsiveBehaviour: r.responsive_behaviour,
    impactLevel: r.impact_level,
    businessGoal: r.business_goal,
    additionalNotes: r.additional_notes,
    auditReason: r.audit_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    logs: [],
  };
}

function parseLog(l) {
  return {
    ...l,
    actorRole: l.actor_role,
    actorId: l.actor_id || null,
    dotClass: l.dot_class,
    badge: { class: l.badge_class, text: l.badge_text },
    figmaLink: l.figma_link,
    previewLink: l.preview_link,
    screenshotName: l.screenshot_name,
    screenshotDataUrl: l.screenshot_data_url,
    docLink: l.doc_link || null,
    componentName: l.component_name || null,
    at: l.created_at,
  };
}

function getWithLogs(id) {
  const req = getDb().prepare('SELECT * FROM requests WHERE id=?').get(id);
  if (!req) return null;
  const logs = getDb().prepare('SELECT * FROM request_logs WHERE request_id=? ORDER BY created_at DESC').all(id);
  const parsed = parseReq(req);
  parsed.logs = logs.map(parseLog);
  return parsed;
}

// ── GET all ──────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM requests ORDER BY updated_at DESC').all();
  const result = rows.map(r => {
    const parsed = parseReq(r);
    const logs = getDb().prepare('SELECT * FROM request_logs WHERE request_id=? ORDER BY created_at DESC').all(r.id);
    parsed.logs = logs.map(parseLog);
    return parsed;
  });
  res.json(result);
});

// ── GET single ───────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const r = getWithLogs(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});

// ── POST create ──────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { role, name: actorName, id: actorId, team: actorTeam } = req.user;
  // actorId must exist — auth middleware provides it from JWT
  if (!['developer','designer','super_admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' });

  const {
    title, requestType, priority, platform, componentName, componentDescription,
    useCase, affectedProducts, designReferenceLink, referenceProduct,
    interactionBehaviour, responsiveBehaviour, accessibilityRequirement,
    stateRequirements, impactLevel, deadline, businessGoal, additionalNotes
  } = req.body;

  if (!title || !requestType || !componentName || !componentDescription || !useCase) {
    return res.status(400).json({ error: 'title, requestType, componentName, componentDescription, useCase required' });
  }

  const wf = role === 'designer' ? 'designer' : 'developer';
  const initStatus = wf === 'designer' ? 'need_design_validation' : 'backlog';
  const now = new Date().toISOString();
  const id  = uuid();
  const requesterRole = role === 'super_admin' ? 'developer' : role;

  // team: prefer JWT claim, fallback to DB lookup (for tokens issued before this update)
  const requesterTeam = actorTeam || getDb().prepare('SELECT team FROM users WHERE id=?').get(actorId)?.team || null;

  getDb().prepare(`
    INSERT INTO requests (id,title,request_type,requester_role,requester_name,requester_team,requester_id,priority,platform,component_name,component_description,use_case,affected_products,design_reference_link,reference_product,interaction_behaviour,responsive_behaviour,accessibility_requirement,state_requirements,impact_level,deadline,business_goal,additional_notes,status,workflow,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, title, requestType, requesterRole, actorName, requesterTeam, actorId, priority||'Medium', platform||'Web', componentName, componentDescription, useCase,
    JSON.stringify(affectedProducts||[]), designReferenceLink||null, referenceProduct||null,
    interactionBehaviour||null, responsiveBehaviour||null, accessibilityRequirement?1:0,
    JSON.stringify(stateRequirements||[]), impactLevel||null, deadline||null,
    businessGoal||null, additionalNotes||null, initStatus, wf, now, now
  );

  // Initial log
  getDb().prepare(`INSERT INTO request_logs (id,request_id,actor,actor_id,actor_role,action,note,icon,dot_class,badge_class,badge_text,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(uuid(), id, actorName, actorId, role, 'created', 'Request submitted.', '📝', 'info', 'b-'+initStatus, initStatus.replace(/_/g,' '), now);

  res.status(201).json(getWithLogs(id));
});

// ── Workflow state machine ────────────────────────────────────────────────────
// Maps action → { allowedCurrentStatuses, nextStatus, allowedRoles }
const STATE_MACHINE = {
  // Designer workflow
  approve_validation: { from: ['need_design_validation'],                           next: 'backlog',                   roles: ['designer','super_admin'] },
  start_design:       { from: ['backlog'],                                           next: 'in_design',                 roles: ['designer','super_admin'] },
  finish_design:      { from: ['in_design'],                                         next: 'design_done',               roles: ['designer','super_admin'] },
  start_review:       { from: ['need_review_designer'],                              next: 'on_review_designer',        roles: ['designer','super_admin'] },
  approve_review:     { from: ['on_review_designer'],                                next: 'done_review',               roles: ['designer','super_admin'] },
  request_revision:   { from: ['on_review_designer'],                                next: 'need_revision',             roles: ['designer','super_admin'] },
  start_audit:        { from: ['need_audit'],                                        next: 'on_audit',                  roles: ['designer','super_admin'] },
  require_redesign:   { from: ['on_audit'],                                          next: 'need_redesign',             roles: ['designer','super_admin'] },
  audit_pass:         { from: ['on_audit'],                                          next: 'need_development_update',   roles: ['designer','super_admin'] },
  start_redesign:     { from: ['need_redesign'],                                     next: 'in_redesign',               roles: ['designer','super_admin'] },
  finish_redesign:    { from: ['in_redesign'],                                       next: 'redesign_done',             roles: ['designer','super_admin'] },
  // Engineer workflow
  start_dev:          { from: ['design_done','redesign_done','need_development_update'], next: 'in_progress_code',      roles: ['engineer','super_admin'] },
  finish_dev:         { from: ['in_progress_code'],                                  next: 'need_review_designer',      roles: ['engineer','super_admin'] },
  submit_revision:    { from: ['need_revision'],                                     next: 'need_review_designer',      roles: ['engineer','super_admin'] },
  publish:            { from: ['done_review','need_publish'],                        next: 'done',                      roles: ['engineer','super_admin'] },
};

// ── POST action (workflow engine) ────────────────────────────────────────────
router.post('/:id/action', (req, res) => {
  const { role, name: actorName } = req.user;
  const reqRow = getDb().prepare('SELECT * FROM requests WHERE id=?').get(req.params.id);
  if (!reqRow) return res.status(404).json({ error: 'Not found' });

  const {
    action, notes, version, score, library, componentName, docLink,
    figmaLink, previewLink, screenshotName, screenshotDataUrl
  } = req.body;

  if (!action) return res.status(400).json({ error: 'action required' });

  // ── Server-side state machine validation ─────────────────────────────────
  const transition = STATE_MACHINE[action];
  if (!transition) return res.status(400).json({ error: `Unknown action: ${action}` });
  if (!transition.roles.includes(role)) return res.status(403).json({ error: `Action not allowed for role: ${role}` });
  if (!transition.from.includes(reqRow.status)) {
    return res.status(409).json({ error: `Action '${action}' cannot be performed from status '${reqRow.status}'` });
  }
  const nextStatus = transition.next;  // always server-determined, never from client

  const now = new Date().toISOString();

  // Determine icon + dotClass
  const iconMap = { finish_design:'✅', approve_review:'✅', audit_pass:'✅', finish_dev:'✅', finish_redesign:'✅', approve_validation:'✅', publish:'🚀', request_revision:'↻', start_design:'🎨', start_redesign:'🎨', start_dev:'⚙️', submit_revision:'📤', start_audit:'🔍' };
  const dotMap  = { finish_design:'approved', approve_review:'approved', audit_pass:'approved', finish_dev:'approved', finish_redesign:'approved', approve_validation:'approved', publish:'done', request_revision:'revision' };
  const icon    = iconMap[action] || '🔄';
  const dotClass= dotMap[action]  || 'info';

  getDb().prepare('UPDATE requests SET status=?, updated_at=? WHERE id=?').run(nextStatus, now, req.params.id);

  // If a new component name is provided on publish, update the request record
  const effectiveComponentName = (action === 'publish' && componentName?.trim())
    ? componentName.trim()
    : reqRow.component_name;
  if (action === 'publish' && componentName?.trim() && componentName.trim() !== reqRow.component_name) {
    getDb().prepare('UPDATE requests SET component_name=? WHERE id=?').run(componentName.trim(), req.params.id);
  }

  getDb().prepare(`INSERT INTO request_logs (id,request_id,actor,actor_id,actor_role,action,note,icon,dot_class,badge_class,badge_text,score,version,library,doc_link,component_name,figma_link,preview_link,screenshot_name,screenshot_data_url,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(uuid(), req.params.id, actorName, req.user.id, role, action, notes||action+' completed.', icon, dotClass,
      'b-'+nextStatus, nextStatus.replace(/_/g,' '), score||null, version||null, library||null, docLink||null,
      action==='publish' ? effectiveComponentName : null,
      figmaLink||null, previewLink||null, screenshotName||null, screenshotDataUrl||null, now);

  // If published, sync/create component record (UPSERT) — skip audit workflow
  if (nextStatus === 'done' && reqRow.workflow !== 'audit') {
    const existingComp = getDb().prepare('SELECT id FROM components WHERE name=? AND is_active=1').get(reqRow.component_name);
    if (existingComp) {
      getDb().prepare(`UPDATE components SET status='done', version=?, library=?, doc_link=?, name=?, updated_at=? WHERE id=?`)
        .run(version||null, library||null, docLink||null, effectiveComponentName, now, existingComp.id);
    } else {
      const slug = effectiveComponentName.replace(/([A-Z])/g,(m,l,i)=>i>0?'-'+l.toLowerCase():l.toLowerCase()).replace(/^-/,'').replace(/\s+/g,'-');
      const compId = uuid();
      try {
        getDb().prepare(`INSERT INTO components (id,name,slug,atomic_level,status,version,library,doc_link,is_active,tags,created_at,updated_at) VALUES (?,?,?,NULL,'done',?,?,?,1,'[]',?,?)`)
          .run(compId, effectiveComponentName, slug, version||null, library||null, docLink||null, now, now);
      } catch(e) {
        getDb().prepare(`INSERT INTO components (id,name,slug,atomic_level,status,version,library,doc_link,is_active,tags,created_at,updated_at) VALUES (?,?,?,NULL,'done',?,?,?,1,'[]',?,?)`)
          .run(compId, effectiveComponentName, slug+'-'+compId.slice(0,6), version||null, library||null, docLink||null, now, now);
      }
    }
  }

  // Log global activity
  getDb().prepare(`INSERT INTO activity_log VALUES (?,?,?,?,?)`).run(uuid(), `${actorName} — ${action.replace(/_/g,' ')} on "${reqRow.title}"`, actorName, icon, now);

  res.json(getWithLogs(req.params.id));
});

// ── POST audit trigger ────────────────────────────────────────────────────────
router.post('/audit/trigger', (req, res) => {
  if (!['designer','super_admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const { componentName, reason, priority, notes } = req.body;
  if (!componentName || !reason) return res.status(400).json({ error: 'componentName and reason required' });

  const now = new Date().toISOString();
  const id  = uuid();
  getDb().prepare(`INSERT INTO requests (id,title,request_type,requester_role,priority,component_name,component_description,use_case,affected_products,state_requirements,status,workflow,audit_reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, `Audit: ${componentName}`, 'component_enhancement', req.user.role, priority||'Medium', componentName, reason, 'Audit triggered.', '[]', '[]', 'need_audit', 'audit', reason, now, now);
  getDb().prepare(`INSERT INTO request_logs (id,request_id,actor,actor_id,actor_role,action,note,icon,dot_class,badge_class,badge_text,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(uuid(), id, req.user.name, req.user.id, req.user.role, 'trigger_audit', notes||`Audit triggered: ${reason}`, '🔍', 'info', 'b-need_audit', 'Need Audit', now);

  res.status(201).json(getWithLogs(id));
});

// ── PUT override status (super_admin) ─────────────────────────────────────────
router.put('/:id/override', (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Super Admin only' });
  const { status, note } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });
  const now = new Date().toISOString();
  getDb().prepare('UPDATE requests SET status=?, updated_at=? WHERE id=?').run(status, now, req.params.id);
  getDb().prepare(`INSERT INTO request_logs (id,request_id,actor,actor_id,actor_role,action,note,icon,dot_class,badge_class,badge_text,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(uuid(), req.params.id, req.user.name, req.user.id, 'super_admin', 'override', note||'Status overridden.', '⚡', 'revision', 'b-'+status, status.replace(/_/g,' '), now);
  res.json(getWithLogs(req.params.id));
});

module.exports = router;
