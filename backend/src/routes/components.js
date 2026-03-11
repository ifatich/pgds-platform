// src/routes/components.js
const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { getDb } = require('../data/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const parse = (c) => ({
  ...c,
  tags: JSON.parse(c.tags || '[]'),
  isActive: !!c.is_active,
  atomicLevel: c.atomic_level || null,
  figmaUrl: c.figma_url,
  storybookUrl: c.storybook_url,
  codeOwner: c.code_owner,
  docLink: c.doc_link || null,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

// GET all
router.get('/', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM components WHERE is_active=1 ORDER BY created_at DESC').all();
  res.json(rows.map(parse));
});

// GET single
router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM components WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(parse(row));
});

// POST create
router.post('/', (req, res) => {
  const { role } = req.user;
  if (!['engineer','super_admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, slug, atomicLevel, category, description, figmaUrl, storybookUrl, codeOwner, tags, library, version, docLink } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });

  const now = new Date().toISOString();
  const id  = uuid();
  try {
    getDb().prepare(`INSERT INTO components (id,name,slug,atomic_level,category,description,figma_url,storybook_url,code_owner,status,version,is_active,tags,created_at,updated_at,library,doc_link) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?)`)
      .run(id, name, slug, atomicLevel||null, category||null, description||null,
           figmaUrl||null, storybookUrl||null, codeOwner||null,
           'done', version||null, JSON.stringify(tags||[]), now, now, library||null, docLink||null);
    res.status(201).json(parse(getDb().prepare('SELECT * FROM components WHERE id=?').get(id)));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Slug already exists' });
    throw e;
  }
});

// PUT update
router.put('/:id', (req, res) => {
  const { role } = req.user;
  if (!['engineer','super_admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, slug, atomicLevel, category, description, figmaUrl, storybookUrl, codeOwner, tags, library, version, docLink } = req.body;
  const now = new Date().toISOString();
  getDb().prepare(`UPDATE components SET name=?,slug=?,atomic_level=?,category=?,description=?,figma_url=?,storybook_url=?,code_owner=?,tags=?,library=?,version=?,doc_link=?,updated_at=? WHERE id=?`)
    .run(name, slug, atomicLevel||null, category||null, description||null, figmaUrl||null, storybookUrl||null, codeOwner||null, JSON.stringify(tags||[]), library||null, version||null, docLink||null, now, req.params.id);
  const updated = getDb().prepare('SELECT * FROM components WHERE id=?').get(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(parse(updated));
});

// DELETE (soft)
router.delete('/:id', (req, res) => {
  if (!['engineer','super_admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  getDb().prepare('UPDATE components SET is_active=0, updated_at=? WHERE id=?').run(new Date().toISOString(), req.params.id);
  res.json({ ok: true });
});

module.exports = router;
