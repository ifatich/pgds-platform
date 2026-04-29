// src/controllers/componentsController.js
const { v4: uuid } = require('uuid');
const { getDb } = require('../data/db');
const { parseComponent } = require('../services/parsers');

/**
 * Get all active components
 */
async function getAllComponents(req, res) {
  try {
    const rows = getDb()
      .prepare('SELECT * FROM components WHERE is_active=1 ORDER BY created_at DESC')
      .all();
    res.json(rows.map(parseComponent));
  } catch (error) {
    console.error('Get all components error:', error);
    res.status(500).json({ error: 'Failed to fetch components' });
  }
}

/**
 * Get single component by ID
 */
async function getComponentById(req, res) {
  try {
    const row = getDb()
      .prepare('SELECT * FROM components WHERE id=?')
      .get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json(parseComponent(row));
  } catch (error) {
    console.error('Get component error:', error);
    res.status(500).json({ error: 'Failed to fetch component' });
  }
}

/**
 * Create new component (engineer/admin only)
 */
async function createComponent(req, res) {
  const {
    name,
    slug,
    atomicLevel,
    category,
    description,
    figmaUrl,
    storybookUrl,
    codeOwner,
    tags,
    library,
    version,
    docLink,
  } = req.body;

  // Validation
  if (!name || !slug) {
    return res.status(400).json({ error: 'name and slug required' });
  }

  try {
    const now = new Date().toISOString();
    const id = uuid();

    getDb()
      .prepare(
        `INSERT INTO components (id,name,slug,atomic_level,category,description,figma_url,storybook_url,code_owner,status,version,is_active,tags,created_at,updated_at,library,doc_link) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?)`
      )
      .run(
        id,
        name,
        slug,
        atomicLevel || null,
        category || null,
        description || null,
        figmaUrl || null,
        storybookUrl || null,
        codeOwner || null,
        'done',
        version || null,
        JSON.stringify(tags || []),
        now,
        now,
        library || null,
        docLink || null
      );

    const created = getDb().prepare('SELECT * FROM components WHERE id=?').get(id);
    res.status(201).json(parseComponent(created));
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error('Create component error:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
}

/**
 * Update component (engineer/admin only)
 */
async function updateComponent(req, res) {
  const {
    name,
    slug,
    atomicLevel,
    category,
    description,
    figmaUrl,
    storybookUrl,
    codeOwner,
    tags,
    library,
    version,
    docLink,
  } = req.body;

  try {
    const now = new Date().toISOString();

    getDb()
      .prepare(
        `UPDATE components SET name=?,slug=?,atomic_level=?,category=?,description=?,figma_url=?,storybook_url=?,code_owner=?,tags=?,library=?,version=?,doc_link=?,updated_at=? WHERE id=?`
      )
      .run(
        name,
        slug,
        atomicLevel || null,
        category || null,
        description || null,
        figmaUrl || null,
        storybookUrl || null,
        codeOwner || null,
        JSON.stringify(tags || []),
        library || null,
        version || null,
        docLink || null,
        now,
        req.params.id
      );

    const updated = getDb().prepare('SELECT * FROM components WHERE id=?').get(req.params.id);

    if (!updated) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json(parseComponent(updated));
  } catch (error) {
    console.error('Update component error:', error);
    res.status(500).json({ error: 'Failed to update component' });
  }
}

/**
 * Soft delete component (engineer/admin only)
 */
async function deleteComponent(req, res) {
  try {
    getDb()
      .prepare('UPDATE components SET is_active=0, updated_at=? WHERE id=?')
      .run(new Date().toISOString(), req.params.id);

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete component error:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
}

module.exports = {
  getAllComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent,
};
