// src/routes/data-master.js
const router = require('express').Router();
const { getDb } = require('../data/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const DEFAULT_SETTINGS = {
  requestTypes: [
    // Engineer Request Types
    { value: 'new_component',          label: 'New Component',                                    category: 'engineer' },
    { value: 'component_variant',      label: 'Component Variant',                                category: 'engineer' },
    { value: 'component_enhancement',  label: 'Component Enhancement',                           category: 'engineer' },
    { value: 'documentation_update',   label: 'Documentation Update',                            category: 'engineer' },
    { value: 'research_prototyping_code', label: 'Prototyping with Code',                        category: 'engineer' },
    // Designer Request Types
    { value: 'research_strategic_design',      label: 'Strategic Design Thinking',               category: 'designer' },
    { value: 'research_rapid_sprint',           label: 'Rapid Design Sprint',                     category: 'designer' },
    { value: 'research_ui_ux_enhancement',      label: 'UI UX Enhancement (Rapid Prototyping)',  category: 'designer' },
    { value: 'research_ui_ux_audit',            label: 'UI UX Audit (Improvement & Evaluation)', category: 'designer' },
    // Illustrator Request Types
    { value: 'research_logo_illustration',      label: 'Logo & Illustration Design',             category: 'illustrator' },
    // Researcher Request Types
    { value: 'research_market_customer',        label: 'Market / Customer Research',             category: 'researcher' },
    { value: 'research_usability_testing',      label: 'Usability Testing & Evaluation',         category: 'researcher' },
  ],
  priorities:           ['Critical', 'High', 'Medium', 'Low'],
  impactLevels:         ['Critical Impact', 'High Impact', 'Moderate Impact', 'Low Impact'],
  stateRequirements:    ['Default', 'Hover', 'Focus', 'Active', 'Disabled', 'Loading', 'Error', 'Empty'],
  responsiveBehaviours: ['Responsive', 'Desktop Only', 'Mobile Only', 'Fixed Width'],
  severityLevels:       ['Minor', 'Medium', 'Major'],
};

// GET — accessible by all authenticated users (needed by RequestForm)
router.get('/', (req, res) => {
  const row = getDb().prepare(`SELECT settings FROM data_master WHERE id='singleton'`).get();
  res.json(row ? JSON.parse(row.settings) : DEFAULT_SETTINGS);
});

// PUT — super_admin only
router.put('/', authenticate, requireAdmin, (req, res) => {
  const { requestTypes, priorities, impactLevels, stateRequirements, responsiveBehaviours, severityLevels } = req.body;
  // Basic validation
  if (!Array.isArray(requestTypes) || !Array.isArray(priorities)) {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }
  const settings = JSON.stringify({ requestTypes, priorities, impactLevels, stateRequirements, responsiveBehaviours, severityLevels });
  getDb().prepare(`INSERT INTO data_master (id, settings) VALUES ('singleton', ?) ON CONFLICT(id) DO UPDATE SET settings=excluded.settings`).run(settings);
  res.json(req.body);
});

module.exports = router;
