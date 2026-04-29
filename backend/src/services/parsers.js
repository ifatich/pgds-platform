// src/services/parsers.js
// Shared data parsing utilities for consistent response formatting

/**
 * Parse request row from database to API response format
 */
function parseRequest(r) {
  return {
    id: r.id,
    title: r.title,
    requestType: r.request_type,
    requesterRole: r.requester_role,
    requesterName: r.requester_name,
    requesterTeam: r.requester_team,
    requesterId: r.requester_id,
    priority: r.priority,
    platform: r.platform,
    componentName: r.component_name,
    componentDescription: r.component_description,
    useCase: r.use_case,
    affectedProducts: JSON.parse(r.affected_products || '[]'),
    designReferenceLink: r.design_reference_link,
    referenceProduct: r.reference_product,
    interactionBehaviour: r.interaction_behaviour,
    responsiveBehaviour: r.responsive_behaviour,
    accessibilityRequirement: !!r.accessibility_requirement,
    stateRequirements: JSON.parse(r.state_requirements || '[]'),
    impactLevel: r.impact_level,
    deadline: r.deadline,
    businessGoal: r.business_goal,
    additionalNotes: r.additional_notes,
    productionLink: r.production_link,
    metadata: JSON.parse(r.metadata || '{}'),
    status: r.status,
    workflow: r.workflow,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    auditReason: r.audit_reason,
    logs: [],
  };
}

/**
 * Parse request log row to API response format
 */
function parseRequestLog(l) {
  return {
    id: l.id,
    requestId: l.request_id,
    actor: l.actor,
    actorId: l.actor_id,
    actorRole: l.actor_role,
    action: l.action,
    note: l.note,
    icon: l.icon,
    dotClass: l.dot_class,
    badge: { class: l.badge_class, text: l.badge_text },
    figmaLink: l.figma_link,
    previewLink: l.preview_link,
    screenshotName: l.screenshot_name,
    screenshotDataUrl: l.screenshot_data_url,
    docLink: l.doc_link,
    componentName: l.component_name,
    at: l.created_at,
  };
}

/**
 * Parse component row to API response format
 */
function parseComponent(c) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    atomicLevel: c.atomic_level,
    category: c.category,
    description: c.description,
    tags: JSON.parse(c.tags || '[]'),
    isActive: !!c.is_active,
    figmaUrl: c.figma_url,
    storybookUrl: c.storybook_url,
    codeOwner: c.code_owner,
    docLink: c.doc_link,
    status: c.status,
    version: c.version,
    library: c.library,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

/**
 * Parse research request row to API response format
 */
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

/**
 * Parse user row, removing sensitive data
 */
function parseUser(u, includeSensitive = false) {
  const { password_hash, ...safe } = u;
  if (includeSensitive) return u;
  return safe;
}

module.exports = {
  parseRequest,
  parseRequestLog,
  parseComponent,
  parseResearchRequest,
  parseUser,
};
