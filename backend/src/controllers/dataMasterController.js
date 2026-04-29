// src/controllers/dataMasterController.js
const { getDb } = require('../data/db');
const { FALLBACK_STATE_MACHINE, FALLBACK_ACTION_UI } = require('../services/workflowConfig');

const DEFAULT_SETTINGS = {
  requestTypes: [
    // Engineer Request Types
    {
      value: 'new_component',
      label: 'New Component',
      category: 'engineer',
    },
    {
      value: 'component_variant',
      label: 'Component Variant',
      category: 'engineer',
    },
    {
      value: 'component_enhancement',
      label: 'Component Enhancement',
      category: 'engineer',
    },
    {
      value: 'documentation_update',
      label: 'Documentation Update',
      category: 'engineer',
    },
    {
      value: 'research_prototyping_code',
      label: 'Prototyping with Code',
      category: 'engineer',
    },
    // Designer Request Types
    {
      value: 'research_strategic_design',
      label: 'Strategic Design Thinking',
      category: 'designer',
    },
    {
      value: 'research_rapid_sprint',
      label: 'Rapid Design Sprint',
      category: 'designer',
    },
    {
      value: 'research_ui_ux_enhancement',
      label: 'UI UX Enhancement (Rapid Prototyping)',
      category: 'designer',
    },
    {
      value: 'research_ui_ux_audit',
      label: 'UI UX Audit (Improvement & Evaluation)',
      category: 'designer',
    },
    // Illustrator Request Types
    {
      value: 'research_logo_illustration',
      label: 'Logo & Illustration Design',
      category: 'illustrator',
    },
    // Researcher Request Types
    {
      value: 'research_market_customer',
      label: 'Market / Customer Research',
      category: 'researcher',
    },
    {
      value: 'research_usability_testing',
      label: 'Usability Testing & Evaluation',
      category: 'researcher',
    },
  ],
  priorities: ['Critical', 'High', 'Medium', 'Low'],
  impactLevels: ['Critical Impact', 'High Impact', 'Moderate Impact', 'Low Impact'],
  stateRequirements: ['Default', 'Hover', 'Focus', 'Active', 'Disabled', 'Loading', 'Error', 'Empty'],
  responsiveBehaviours: ['Responsive', 'Desktop Only', 'Mobile Only', 'Fixed Width'],
  severityLevels: ['Minor', 'Medium', 'Major'],
  requestPipelines: {
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
  },
  requestActions: {
    transitions: FALLBACK_STATE_MACHINE,
    ui: FALLBACK_ACTION_UI,
  },
  requestPipelinesByType: {
    // Example structure for new_component
    new_component: [
      { status: 'backlog', label: 'Backlog', onFailStatus: '' },
      { status: 'in_design', label: 'In Design', onFailStatus: '' },
      { status: 'design_done', label: 'Design Done', onFailStatus: '' },
      { status: 'in_progress_code', label: 'In Progress Code', onFailStatus: 'need_revision' },
      { status: 'need_review_designer', label: 'Waiting Review', onFailStatus: 'need_revision' },
      { status: 'on_review_designer', label: 'On Review', onFailStatus: 'need_revision' },
      { status: 'done_review', label: 'Review Done', onFailStatus: '' },
      { status: 'need_publish', label: 'Need Publish', onFailStatus: '' },
      { status: 'done', label: 'Done', onFailStatus: '' },
    ],
  },
};

// Helper: Convert snake_case status to Title Case
function titleizeStatus(status) {
  return String(status || '')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Helper: Normalize pipeline stages to objects with status, label, onFailStatus
function normalizePipelineStages(stages) {
  if (!Array.isArray(stages)) return [];
  
  return stages
    .map(stage => {
      if (typeof stage === 'string') {
        const status = stage.trim();
        return { status, label: titleizeStatus(status), onFailStatus: '' };
      }
      if (!stage || typeof stage !== 'object' || !stage.status) return null;
      
      return {
        status: String(stage.status || '').trim(),
        label: String(stage.label || titleizeStatus(stage.status)).trim(),
        onFailStatus: String(stage.onFailStatus || '').trim(),
      };
    })
    .filter(s => s && s.status);
}

// Helper: Normalize all per-type pipelines
function normalizePipelinesByType(input, requestTypes = []) {
  const source = input && typeof input === 'object' ? input : DEFAULT_SETTINGS.requestPipelinesByType || {};
  const normalized = {};
  
  // First normalize all types that have input data
  for (const [typeKey, stages] of Object.entries(source)) {
    normalized[typeKey] = normalizePipelineStages(stages);
  }
  
  // Then fill in defaults for any requestTypes without pipeline config
  for (const type of requestTypes) {
    if (type.value && !normalized[type.value]) {
      // Use category default if available, otherwise empty
      const categoryDefault = DEFAULT_SETTINGS.requestPipelines[type.category] || [];
      normalized[type.value] = normalizePipelineStages(categoryDefault);
    }
  }
  
  return normalized;
}

function normalizePipelineMap(input) {
  const source = input && typeof input === 'object' ? input : DEFAULT_SETTINGS.requestPipelines;
  const normalized = {};

  for (const [role, stages] of Object.entries(source)) {
    if (!Array.isArray(stages)) continue;
    normalized[role] = [...new Set(stages.map(v => String(v || '').trim()).filter(Boolean))];
  }

  return {
    ...DEFAULT_SETTINGS.requestPipelines,
    ...normalized,
  };
}

function normalizeRequestActions(input) {
  const source = input && typeof input === 'object' ? input : {};
  const transitions = source.transitions && typeof source.transitions === 'object' ? source.transitions : {};
  const ui = source.ui && typeof source.ui === 'object' ? source.ui : {};

  return {
    transitions: {
      ...FALLBACK_STATE_MACHINE,
      ...transitions,
    },
    ui: {
      ...FALLBACK_ACTION_UI,
      ...ui,
    },
  };
}

/**
 * Get all master data settings
 */
async function getDataMaster(req, res) {
  try {
    const row = getDb()
      .prepare(`SELECT settings FROM data_master WHERE id='singleton'`)
      .get();

    const result = row ? JSON.parse(row.settings) : DEFAULT_SETTINGS;
    res.json(result);
  } catch (error) {
    console.error('Get data master error:', error);
    res.status(500).json({ error: 'Failed to fetch data master' });
  }
}

/**
 * Update master data settings (admin only)
 */
async function updateDataMaster(req, res) {
  try {
    const currentRow = getDb()
      .prepare(`SELECT settings FROM data_master WHERE id='singleton'`)
      .get();

    const currentSettings = currentRow?.settings ? JSON.parse(currentRow.settings) : DEFAULT_SETTINGS;

    const nextSettings = {
      ...DEFAULT_SETTINGS,
      ...currentSettings,
      ...req.body,
      requestPipelines: normalizePipelineMap(
        req.body.requestPipelines || currentSettings.requestPipelines || DEFAULT_SETTINGS.requestPipelines
      ),
      requestPipelinesByType: normalizePipelinesByType(
        req.body.requestPipelinesByType || currentSettings.requestPipelinesByType || DEFAULT_SETTINGS.requestPipelinesByType,
        req.body.requestTypes || currentSettings.requestTypes || DEFAULT_SETTINGS.requestTypes
      ),
      requestActions: normalizeRequestActions(
        req.body.requestActions || currentSettings.requestActions || DEFAULT_SETTINGS.requestActions
      ),
    };

    if (!Array.isArray(nextSettings.requestTypes) || !Array.isArray(nextSettings.priorities)) {
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    const settings = JSON.stringify(nextSettings);

    getDb()
      .prepare(
        `INSERT INTO data_master (id, settings) VALUES ('singleton', ?) ON CONFLICT(id) DO UPDATE SET settings=excluded.settings`
      )
      .run(settings);

    res.json(nextSettings);
  } catch (error) {
    console.error('Update data master error:', error);
    res.status(500).json({ error: 'Failed to update data master' });
  }
}

module.exports = {
  getDataMaster,
  updateDataMaster,
};
