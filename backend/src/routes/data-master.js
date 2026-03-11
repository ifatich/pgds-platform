// src/routes/data-master.js
const router = require('express').Router();
const { getDb } = require('../data/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

const DEFAULT_SETTINGS = {
  requestTypes: [
    { value: 'new_component',          label: 'New Component' },
    { value: 'component_variant',      label: 'Component Variant' },
    { value: 'component_enhancement',  label: 'Enhancement' },
    { value: 'component_redesign',     label: 'Redesign' },
    { value: 'component_bug_fix',      label: 'Bug Fix' },
    { value: 'documentation_update',   label: 'Documentation Update' },
  ],
  platforms:            ['Web', 'Mobile', 'Web + Mobile', 'Desktop', 'All'],
  priorities:           ['Critical', 'High', 'Medium', 'Low'],
  impactLevels:         ['Critical Impact', 'High Impact', 'Moderate Impact', 'Low Impact'],
  stateRequirements:    ['Default', 'Hover', 'Focus', 'Active', 'Disabled', 'Loading', 'Error', 'Empty'],
  responsiveBehaviours: ['Responsive', 'Desktop Only', 'Mobile Only', 'Fixed Width'],
};

// GET — accessible by all authenticated users (needed by RequestForm)
router.get('/', (req, res) => {
  const row = getDb().prepare(`SELECT settings FROM data_master WHERE id='singleton'`).get();
  res.json(row ? JSON.parse(row.settings) : DEFAULT_SETTINGS);
});

// PUT — super_admin only
router.put('/', requireAdmin, (req, res) => {
  const { requestTypes, platforms, priorities, impactLevels, stateRequirements, responsiveBehaviours } = req.body;
  // Basic validation
  if (!Array.isArray(requestTypes) || !Array.isArray(platforms) || !Array.isArray(priorities)) {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }
  const settings = JSON.stringify({ requestTypes, platforms, priorities, impactLevels, stateRequirements, responsiveBehaviours });
  getDb().prepare(`INSERT INTO data_master (id, settings) VALUES ('singleton', ?) ON CONFLICT(id) DO UPDATE SET settings=excluded.settings`).run(settings);
  res.json(req.body);
});

module.exports = router;
