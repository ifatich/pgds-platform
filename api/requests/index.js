const { v4: uuid } = require('uuid');
const { getDb, initDb } = require('../../_lib/db');
const { authenticate, requireAdmin } = require('../../_lib/auth');
const { sendJson, sendError, handleOptions } = require('../../_lib/middleware');

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

export default function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const auth = authenticate(req, res);
    if (!auth.user) {
      return sendError(res, auth.error, 401);
    }

    initDb();

    if (req.method === 'GET') {
      // GET all requests
      const rows = getDb()
        .prepare('SELECT * FROM requests ORDER BY updated_at DESC')
        .all();
      const result = rows.map((r) => {
        const parsed = parseReq(r);
        const logs = getDb()
          .prepare('SELECT * FROM request_logs WHERE request_id=? ORDER BY created_at DESC')
          .all(r.id);
        parsed.logs = logs.map(parseLog);
        return parsed;
      });
      return sendJson(res, result);
    }

    if (req.method === 'POST') {
      // POST create request
      const { role, name: actorName, id: actorId, team: actorTeam } = auth.user;

      if (!['developer', 'designer', 'super_admin'].includes(role)) {
        return sendError(res, 'Forbidden', 403);
      }

      const {
        title,
        requestType,
        priority,
        platform,
        componentName,
        componentDescription,
        useCase,
        affectedProducts,
        designReferenceLink,
        referenceProduct,
        interactionBehaviour,
        responsiveBehaviour,
        accessibilityRequirement,
        stateRequirements,
        impactLevel,
        deadline,
        businessGoal,
        additionalNotes,
      } = req.body;

      if (!title || !requestType || !componentName || !componentDescription || !useCase) {
        return sendError(res, 'title, requestType, componentName, componentDescription, useCase required', 400);
      }

      const wf = role === 'designer' ? 'designer' : 'developer';
      const initStatus = wf === 'designer' ? 'need_design_validation' : 'backlog';
      const now = new Date().toISOString();
      const id = uuid();
      const requesterRole = role === 'super_admin' ? 'developer' : role;
      const requesterTeam = actorTeam || null;

      try {
        getDb()
          .prepare(`
            INSERT INTO requests (id,title,request_type,requester_role,requester_name,requester_team,requester_id,priority,platform,component_name,component_description,use_case,affected_products,design_reference_link,reference_product,interaction_behaviour,responsive_behaviour,accessibility_requirement,state_requirements,impact_level,deadline,business_goal,additional_notes,status,workflow,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `)
          .run(
            id,
            title,
            requestType,
            requesterRole,
            actorName,
            requesterTeam,
            actorId,
            priority || 'Medium',
            platform || 'Web',
            componentName,
            componentDescription,
            useCase,
            JSON.stringify(affectedProducts || []),
            designReferenceLink || null,
            referenceProduct || null,
            interactionBehaviour || null,
            responsiveBehaviour || null,
            accessibilityRequirement ? 1 : 0,
            JSON.stringify(stateRequirements || []),
            impactLevel || null,
            deadline || null,
            businessGoal || null,
            additionalNotes || null,
            initStatus,
            wf,
            now,
            now
          );

        // Initial log
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
            'b-' + initStatus,
            initStatus.replace(/_/g, ' '),
            now
          );

        const createdReq = getDb().prepare('SELECT * FROM requests WHERE id=?').get(id);
        const parsed = parseReq(createdReq);
        const logs = getDb()
          .prepare('SELECT * FROM request_logs WHERE request_id=? ORDER BY created_at DESC')
          .all(id);
        parsed.logs = logs.map(parseLog);

        return sendJson(res, parsed, 201);
      } catch (err) {
        console.error('Create request error:', err);
        return sendError(res, err.message, 500);
      }
    }

    return sendError(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Requests handler error:', err);
    return sendError(res, err.message);
  }
}
