const { getDb } = require('../data/db');

const FALLBACK_REQUEST_TYPES = [
  { value: 'new_component', category: 'engineer' },
  { value: 'component_variant', category: 'engineer' },
  { value: 'component_enhancement', category: 'engineer' },
  { value: 'documentation_update', category: 'engineer' },
  { value: 'research_prototyping_code', category: 'engineer' },
  { value: 'research_strategic_design', category: 'designer' },
  { value: 'research_rapid_sprint', category: 'designer' },
  { value: 'research_ui_ux_enhancement', category: 'designer' },
  { value: 'research_ui_ux_audit', category: 'designer' },
  { value: 'research_logo_illustration', category: 'illustrator' },
  { value: 'research_market_customer', category: 'researcher' },
  { value: 'research_usability_testing', category: 'researcher' },
];

const FALLBACK_REQUEST_PIPELINES = {
  engineer: [
    'backlog',
    'in_design',
    'design_done',
    'in_progress_code',
    'need_review_designer',
    'on_review_designer',
    'done_review',
    'need_publish',
    'done',
  ],
  designer: [
    'backlog',
    'in_design',
    'need_review_designer',
    'on_review_designer',
    'done_review',
    'design_finish',
  ],
  illustrator: [
    'backlog',
    'in_design',
    'need_review_designer',
    'on_review_designer',
    'done_review',
    'design_finish',
  ],
  researcher: [
    'backlog',
    'in_progress_research',
    'need_review_designer',
    'on_review_designer',
    'done_review',
    'research_finish',
  ],
};

const CATEGORY_WORKFLOW_MAP = {
  engineer: 'developer',
  designer: 'designer',
  illustrator: 'designer',
  researcher: 'designer',
};

function normalizeStatus(status) {
  return String(status || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_');
}

function getDataMasterSettings() {
  try {
    const row = getDb().prepare("SELECT settings FROM data_master WHERE id='singleton'").get();
    if (row?.settings) {
      return JSON.parse(row.settings);
    }
  } catch (error) {
    console.warn('requestTypeHandlers: failed reading data master:', error.message);
  }
  return null;
}

function getRequestTypeDefinitions() {
  const settings = getDataMasterSettings();
  if (settings && Array.isArray(settings.requestTypes) && settings.requestTypes.length > 0) {
    return settings.requestTypes;
  }

  return FALLBACK_REQUEST_TYPES;
}

function getRequestPipelines() {
  const settings = getDataMasterSettings();
  if (settings?.requestPipelines && typeof settings.requestPipelines === 'object') {
    return {
      ...FALLBACK_REQUEST_PIPELINES,
      ...settings.requestPipelines,
    };
  }
  return FALLBACK_REQUEST_PIPELINES;
}

function getPipelineForCategory(category) {
  if (!category) return [];
  const pipelines = getRequestPipelines();
  const pipeline = pipelines[category];
  return Array.isArray(pipeline) ? pipeline.map(normalizeStatus).filter(Boolean) : [];
}

function getPipelineByRequestType(requestType) {
  const settings = getDataMasterSettings();
  const byType = settings?.requestPipelinesByType || {};
  const stages = byType?.[requestType];
  if (!Array.isArray(stages) || stages.length === 0) {
    return [];
  }

  return stages
    .map(stage => (typeof stage === 'string' ? stage : stage?.status))
    .map(normalizeStatus)
    .filter(Boolean);
}

function getAllPipelineStatuses() {
  const settings = getDataMasterSettings();
  const pipelines = getRequestPipelines();
  const categoryStatuses = Object.values(pipelines)
    .flat()
    .map(normalizeStatus)
    .filter(Boolean);

  const byType = settings?.requestPipelinesByType || {};
  const typeStatuses = Object.values(byType)
    .flatMap(stages => Array.isArray(stages) ? stages : [])
    .map(stage => (typeof stage === 'string' ? stage : stage?.status))
    .map(normalizeStatus)
    .filter(Boolean);

  return [...new Set([...categoryStatuses, ...typeStatuses])];
}

function getWorkflowByCategory(category) {
  return CATEGORY_WORKFLOW_MAP[category] || 'developer';
}

function getCategoryByRequestType(requestType) {
  const requestTypes = getRequestTypeDefinitions();
  const found = requestTypes.find(rt => rt.value === requestType);
  return found?.category || null;
}

function resolveCreatePolicyByRequestType(requestType) {
  const category = getCategoryByRequestType(requestType);
  if (!category) {
    return {
      valid: false,
      error: 'Invalid requestType',
    };
  }

  const pipeline = getPipelineByRequestType(requestType);
  const fallbackPipeline = getPipelineForCategory(category);
  const effectivePipeline = pipeline.length > 0 ? pipeline : fallbackPipeline;
  const initialStatus = effectivePipeline[0] || 'backlog';

  return {
    valid: true,
    category,
    workflow: getWorkflowByCategory(category),
    initialStatus,
  };
}

module.exports = {
  getRequestTypeDefinitions,
  getRequestPipelines,
  getPipelineForCategory,
  getPipelineByRequestType,
  getAllPipelineStatuses,
  getCategoryByRequestType,
  getWorkflowByCategory,
  resolveCreatePolicyByRequestType,
};