// src/data/db.js  –  SQLite init + seed
const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const { v4: uuid } = require('uuid');
const path     = require('path');

// Support Vercel ephemeral filesystem + local development
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../pgds.db');
let db;

function getDb() {
  if (!db) db = new Database(DB_PATH);
  return db;
}

function dAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function initDb() {
  const db = getDb();
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ── TABLES ────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin','designer','engineer','developer')),
      team TEXT,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','suspended')),
      bio TEXT,
      last_active TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS components (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      atomic_level TEXT NOT NULL CHECK(atomic_level IN ('atom','molecule','organism','template','page')),
      category TEXT,
      description TEXT,
      figma_url TEXT,
      storybook_url TEXT,
      code_owner TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      version TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      request_type TEXT NOT NULL,
      requester_role TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium',
      platform TEXT,
      component_name TEXT,
      component_description TEXT,
      use_case TEXT,
      affected_products TEXT DEFAULT '[]',
      design_reference_link TEXT,
      reference_product TEXT,
      interaction_behaviour TEXT,
      responsive_behaviour TEXT,
      accessibility_requirement INTEGER DEFAULT 0,
      state_requirements TEXT DEFAULT '[]',
      impact_level TEXT,
      deadline TEXT,
      business_goal TEXT,
      additional_notes TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      workflow TEXT NOT NULL DEFAULT 'developer',
      audit_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      actor TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      note TEXT,
      icon TEXT,
      dot_class TEXT DEFAULT 'info',
      badge_class TEXT,
      badge_text TEXT,
      score INTEGER,
      version TEXT,
      figma_link TEXT,
      preview_link TEXT,
      screenshot_name TEXT,
      screenshot_data_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      message TEXT NOT NULL,
      actor TEXT NOT NULL,
      icon TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_settings (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      settings TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS data_master (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      settings TEXT NOT NULL
    );
  `);

  // ── Seed data_master defaults (only if empty) ────────────────────────────
  const dmRow = db.prepare(`SELECT id FROM data_master WHERE id='singleton'`).get();
  if (!dmRow) {
    const dmDefaults = JSON.stringify({
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
    });
    db.prepare(`INSERT INTO data_master (id, settings) VALUES ('singleton', ?)`).run(dmDefaults);
  }

  // ── MIGRATIONS (run safely after table creation) ──────────────────────────
  // Add requester_name + requester_team to requests if not present
  try { db.exec(`ALTER TABLE requests ADD COLUMN requester_name TEXT`); } catch {}
  try { db.exec(`ALTER TABLE requests ADD COLUMN requester_team TEXT`); } catch {}
  // Add FK reference columns for proper ownership tracking
  try { db.exec(`ALTER TABLE requests ADD COLUMN requester_id TEXT`); } catch {}
  try { db.exec(`ALTER TABLE request_logs ADD COLUMN actor_id TEXT`); } catch {}
  // Add library field to request_logs and components
  try { db.exec(`ALTER TABLE request_logs ADD COLUMN library TEXT`); } catch {}
  try { db.exec(`ALTER TABLE components ADD COLUMN library TEXT`); } catch {}
  // Add documentation link field
  try { db.exec(`ALTER TABLE request_logs ADD COLUMN doc_link TEXT`); } catch {}
  try { db.exec(`ALTER TABLE components ADD COLUMN doc_link TEXT`); } catch {}
  // Add component_name snapshot to publish logs
  try { db.exec(`ALTER TABLE request_logs ADD COLUMN component_name TEXT`); } catch {}
  // Recreate components table to make atomic_level nullable (for variant components)
  try {
    const colInfo = db.pragma('table_info(components)');
    const col = colInfo.find(c => c.name === 'atomic_level');
    if (col && col.notnull === 1) {
      db.exec(`
        CREATE TABLE components_v2 (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          atomic_level TEXT,
          category TEXT,
          description TEXT,
          figma_url TEXT,
          storybook_url TEXT,
          code_owner TEXT,
          status TEXT NOT NULL DEFAULT 'backlog',
          version TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          tags TEXT DEFAULT '[]',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          library TEXT,
          doc_link TEXT
        );
        INSERT INTO components_v2 (id,name,slug,atomic_level,category,description,figma_url,storybook_url,code_owner,status,version,is_active,tags,created_at,updated_at,library,doc_link)
          SELECT id,name,slug,atomic_level,category,description,figma_url,storybook_url,code_owner,status,version,is_active,tags,created_at,updated_at,library,doc_link FROM components;
        DROP TABLE components;
        ALTER TABLE components_v2 RENAME TO components;
      `);
    }
  } catch(e) { console.warn('components_v2 migration:', e.message); }
  // Back-fill components from done requests that have no matching component entry
  try {
    const { v4: uuidM } = require('uuid');
    const doneRequests = db.prepare(`
      SELECT r.id, r.component_name, r.updated_at,
        (SELECT l.library FROM request_logs l WHERE l.request_id=r.id AND l.action='publish' ORDER BY l.created_at DESC LIMIT 1) as library,
        (SELECT l.version FROM request_logs l WHERE l.request_id=r.id AND l.action='publish' ORDER BY l.created_at DESC LIMIT 1) as version,
        (SELECT l.doc_link FROM request_logs l WHERE l.request_id=r.id AND l.action='publish' ORDER BY l.created_at DESC LIMIT 1) as doc_link,
        (SELECT l.component_name FROM request_logs l WHERE l.request_id=r.id AND l.action='publish' ORDER BY l.created_at DESC LIMIT 1) as final_name
      FROM requests r
      WHERE r.status='done'
        AND r.workflow != 'audit'
        AND r.component_name IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM components c WHERE c.name=r.component_name AND c.is_active=1)
    `).all();
    const insertComp = db.prepare(`INSERT OR IGNORE INTO components (id,name,slug,atomic_level,status,version,library,doc_link,is_active,tags,created_at,updated_at) VALUES (?,?,?,NULL,'done',?,?,?,1,'[]',?,?)`);
    for (const r of doneRequests) {
      const name = r.final_name || r.component_name;
      const baseSlug = name.replace(/([A-Z])/g,(m,l,i)=>i>0?'-'+l.toLowerCase():l.toLowerCase()).replace(/^-/,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      const existing = db.prepare('SELECT id FROM components WHERE slug=?').get(baseSlug);
      const slug = existing ? baseSlug+'-'+r.id.slice(0,6) : baseSlug;
      try { insertComp.run(uuidM(), name, slug, r.version||null, r.library||null, r.doc_link||null, r.updated_at, r.updated_at); } catch(e2) { /* skip duplicates */ }
    }
  } catch(e) { console.warn('backfill components:', e.message); }
  // Back-fill actor_id from user name lookup (for existing seed data)
  db.prepare(`UPDATE request_logs SET actor_id = (SELECT id FROM users WHERE name = request_logs.actor) WHERE actor_id IS NULL`).run()
  // Back-fill requester_id from requester_name (for requests created after name migration)
  db.prepare(`UPDATE requests SET requester_id = (SELECT id FROM users WHERE name = requests.requester_name) WHERE requester_id IS NULL AND requester_name IS NOT NULL`).run()

  // ── SEED (only if empty) ──────────────────────────────────────────────────
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) return; // already seeded

  console.log('🌱 Seeding database...');

  const hashPw = (pw) => bcrypt.hashSync(pw, 10);

  // Users
  const USERS = [
    { id: uuid(), name:'Super Admin', username:'superadmin', email:'admin@pegadaian.co.id', pw:'admin123', role:'super_admin', team:'Platform', phone:'', status:'active', bio:'System administrator.', dAgo:200 },
    { id: uuid(), name:'Andi Wijaya', username:'andi.wijaya', email:'andi.wijaya@pegadaian.co.id', pw:'password123', role:'designer', team:'Design System', phone:'+62 812-3456-7890', status:'active', bio:'Senior UI/UX Designer, 5 years in design systems.', dAgo:120 },
    { id: uuid(), name:'Sari Putri', username:'sari.putri', email:'sari.putri@pegadaian.co.id', pw:'password123', role:'designer', team:'Mobile', phone:'+62 813-2345-6789', status:'active', bio:'Product Designer specializing in mobile-first design.', dAgo:95 },
    { id: uuid(), name:'Dewi Rahayu', username:'dewi.rahayu', email:'dewi.rahayu@pegadaian.co.id', pw:'password123', role:'designer', team:'Web', phone:'+62 857-1234-5678', status:'inactive', bio:'Visual designer with focus on accessibility.', dAgo:60 },
    { id: uuid(), name:'Budi Santoso', username:'budi.santoso', email:'budi.santoso@pegadaian.co.id', pw:'password123', role:'engineer', team:'Design System', phone:'+62 811-9876-5432', status:'active', bio:'Frontend Engineer, Vue & React specialist.', dAgo:110 },
    { id: uuid(), name:'Rizky Pratama', username:'rizky.pratama', email:'rizky.pratama@pegadaian.co.id', pw:'password123', role:'engineer', team:'Web', phone:'+62 878-8765-4321', status:'active', bio:'Full-stack engineer focused on component architecture.', dAgo:80 },
    { id: uuid(), name:'Hendra Kusuma', username:'hendra.kusuma', email:'hendra.kusuma@pegadaian.co.id', pw:'password123', role:'engineer', team:'Mobile', phone:'', status:'suspended', bio:'', dAgo:45 },
    { id: uuid(), name:'Maya Sari', username:'maya.sari', email:'maya.sari@pegadaian.co.id', pw:'password123', role:'developer', team:'Mobile', phone:'+62 896-5432-1098', status:'active', bio:'Mobile developer, Flutter & React Native.', dAgo:70 },
    { id: uuid(), name:'Fajar Nugroho', username:'fajar.nugroho', email:'fajar.nugroho@pegadaian.co.id', pw:'password123', role:'developer', team:'Web', phone:'+62 812-6543-2109', status:'active', bio:'Frontend developer, React ecosystem.', dAgo:55 },
    { id: uuid(), name:'Indah Permata', username:'indah.permata', email:'indah.permata@pegadaian.co.id', pw:'password123', role:'developer', team:'Backend', phone:'+62 857-3456-7891', status:'active', bio:'Backend developer integrating DS components into APIs.', dAgo:40 },
  ];

  const insUser = db.prepare(`INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  USERS.forEach(u => insUser.run(u.id, u.name, u.username, u.email, hashPw(u.pw), u.role, u.team, u.phone, u.status, u.bio, dAgo(1), dAgo(u.dAgo), dAgo(u.dAgo)));

  // Components
  const COMPS = [
    { name:'PgdButton', slug:'pgd-button', level:'atom', cat:'form', desc:'Primary action button with variants: primary, secondary, ghost, danger.', figma:'https://figma.com/pgd-button', sb:'https://storybook.pegadaian.co.id/button', owner:'@budi', status:'done', version:'2.1.0', tags:['button','interactive','form'], dAgo:90 },
    { name:'PgdInput', slug:'pgd-input', level:'atom', cat:'form', desc:'Text input field with label, placeholder, validation states.', figma:'https://figma.com/pgd-input', sb:null, owner:'@andi', status:'done', version:'1.3.0', tags:['input','form'], dAgo:85 },
    { name:'PgdBadge', slug:'pgd-badge', level:'atom', cat:'feedback', desc:'Small status indicator badge with color variants.', figma:'https://figma.com/pgd-badge', sb:'https://storybook.pegadaian.co.id/badge', owner:'@sari', status:'done', version:'1.0.2', tags:['badge','status'], dAgo:80 },
    { name:'PgdAvatar', slug:'pgd-avatar', level:'atom', cat:'media', desc:'User avatar with image fallback to initials.', figma:'https://figma.com/pgd-avatar', sb:null, owner:'@budi', status:'need_publish', version:null, tags:['avatar','user'], dAgo:40 },
    { name:'PgdCheckbox', slug:'pgd-checkbox', level:'atom', cat:'form', desc:'Custom styled checkbox with indeterminate state.', figma:null, sb:null, owner:null, status:'in_progress_code', version:null, tags:['checkbox','form'], dAgo:30 },
    { name:'PgdSearchField', slug:'pgd-search-field', level:'molecule', cat:'form', desc:'Search input with debounced suggestions dropdown.', figma:'https://figma.com/pgd-search', sb:'https://storybook.pegadaian.co.id/search', owner:'@andi', status:'done', version:'1.1.0', tags:['search','form','autocomplete'], dAgo:70 },
    { name:'PgdCard', slug:'pgd-card', level:'molecule', cat:'layout', desc:'Content card with optional header, body, footer.', figma:'https://figma.com/pgd-card', sb:null, owner:'@sari', status:'need_review_designer', version:null, tags:['card','layout'], dAgo:50 },
    { name:'PgdAlert', slug:'pgd-alert', level:'molecule', cat:'feedback', desc:'Alert banner with success, error, warning, info variants.', figma:'https://figma.com/pgd-alert', sb:null, owner:'@budi', status:'on_review_designer', version:null, tags:['alert','feedback'], dAgo:35 },
    { name:'PgdModal', slug:'pgd-modal', level:'organism', cat:'overlay', desc:'Dialog modal with backdrop, header, body, footer slots.', figma:'https://figma.com/pgd-modal', sb:'https://storybook.pegadaian.co.id/modal', owner:'@andi', status:'done', version:'1.2.0', tags:['modal','overlay'], dAgo:60 },
    { name:'PgdDataTable', slug:'pgd-data-table', level:'organism', cat:'data', desc:'Feature-rich data table with sort, filter, pagination.', figma:'https://figma.com/pgd-table', sb:null, owner:'@budi', status:'need_revision', version:null, tags:['table','data'], dAgo:55 },
    { name:'PgdSidebar', slug:'pgd-sidebar', level:'organism', cat:'navigation', desc:'Collapsible side navigation with nested items and badges.', figma:'https://figma.com/pgd-sidebar', sb:null, owner:'@sari', status:'in_redesign', version:'1.0.0', tags:['sidebar','navigation'], dAgo:45 },
    { name:'TplDashboardLayout', slug:'tpl-dashboard-layout', level:'template', cat:'layout', desc:'Standard dashboard layout: sidebar + topbar + content.', figma:'https://figma.com/tpl-dashboard', sb:'https://storybook.pegadaian.co.id/tpl-dashboard', owner:'@andi', status:'done', version:'1.0.0', tags:['template','layout'], dAgo:75 },
    { name:'PgPageLogin', slug:'pg-page-login', level:'page', cat:'auth', desc:'Login page with email/phone + password, SSO options.', figma:'https://figma.com/pg-login', sb:null, owner:'@andi', status:'done', version:'2.0.0', tags:['page','auth'], dAgo:88 },
  ];

  const insComp = db.prepare(`INSERT INTO components VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  COMPS.forEach(c => insComp.run(uuid(), c.name, c.slug, c.level, c.cat, c.desc, c.figma, c.sb, c.owner, c.status, c.version, 1, JSON.stringify(c.tags), dAgo(c.dAgo), dAgo(Math.max(0, c.dAgo - 5))));

  // Requests + logs
  const insReq = db.prepare(`INSERT INTO requests (id,title,request_type,requester_role,priority,platform,component_name,component_description,use_case,affected_products,design_reference_link,state_requirements,responsive_behaviour,accessibility_requirement,impact_level,status,workflow,audit_reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insLog = db.prepare(`INSERT INTO request_logs (id,request_id,actor,actor_role,action,note,icon,dot_class,badge_class,badge_text,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);

  const REQS = [
    { title:'Add tertiary button variant', type:'component_variant', reqRole:'developer', prio:'Medium', platform:'Web', comp:'Button', desc:'Tertiary button for low emphasis actions inside dashboard and forms.', useCase:'Used for optional secondary actions where primary and secondary buttons already exist.', ref:'https://figma.com/file/button-spec', states:'["Default","Hover","Active","Disabled"]', resp:'Responsive', a11y:0, impact:'Moderate Impact', status:'backlog', wf:'developer', audit:null, dAgo:20 },
    { title:'New date range picker component', type:'new_component', reqRole:'designer', prio:'High', platform:'Web + Mobile', comp:'DateRangePicker', desc:'Calendar-based date range selector supporting single, range, and multi-select modes.', useCase:'Used in financial reports, transaction filters, and booking flows.', ref:'https://figma.com/file/datepicker', states:'["Default","Hover","Active","Disabled","Focus"]', resp:'Responsive', a11y:1, impact:'High Impact', status:'need_design_validation', wf:'designer', audit:null, dAgo:15 },
    { title:'Improve notification badge accessibility', type:'component_enhancement', reqRole:'developer', prio:'Critical', platform:'Web', comp:'PgdBadge', desc:'Add ARIA labels and role attributes to badge for screen reader support.', useCase:'Required for WCAG 2.1 AA compliance across all products.', ref:null, states:'["Default"]', resp:'Responsive', a11y:1, impact:'Critical Impact', status:'in_design', wf:'developer', audit:null, dAgo:10 },
    { title:'Redesign PgdSidebar for collapsible mini mode', type:'component_redesign', reqRole:'designer', prio:'High', platform:'Web', comp:'PgdSidebar', desc:'Add collapsible mini mode showing only icons. Include smooth transitions.', useCase:'Better space usage on smaller screens and for power users.', ref:'https://figma.com/sidebar-v2', states:'["Default","Hover","Active"]', resp:'Desktop Only', a11y:0, impact:'High Impact', status:'need_audit', wf:'audit', audit:'UI modernization', dAgo:8 },
    { title:'Fix button focus ring on Safari', type:'component_bug_fix', reqRole:'developer', prio:'High', platform:'Web', comp:'PgdButton', desc:'Focus ring not rendering correctly on Safari 16+.', useCase:'Accessibility issue for keyboard navigation users.', ref:null, states:'["Focus"]', resp:'Responsive', a11y:1, impact:'High Impact', status:'in_progress_code', wf:'developer', audit:null, dAgo:6 },
    { title:'Add PgdToast notification component', type:'new_component', reqRole:'designer', prio:'Medium', platform:'Web', comp:'PgdToast', desc:'Auto-dismiss toast notification with action button support.', useCase:'System feedback for async operations: save, delete, errors.', ref:'https://figma.com/toast', states:'["Default","Success","Error","Warning"]', resp:'Responsive', a11y:0, impact:'Moderate Impact', status:'design_done', wf:'designer', audit:null, dAgo:12 },
    { title:'Update PgdInput documentation', type:'documentation_update', reqRole:'developer', prio:'Low', platform:'Web + Mobile', comp:'PgdInput', desc:'Add missing props documentation and usage examples for Storybook.', useCase:'Developer onboarding and design handoff.', ref:null, states:'[]', resp:'Responsive', a11y:0, impact:'Low Impact', status:'need_review_designer', wf:'developer', audit:null, dAgo:4 },
    { title:'Audit PgdModal token usage', type:'component_enhancement', reqRole:'designer', prio:'Medium', platform:'Web', comp:'PgdModal', desc:'Check all color and spacing tokens are aligned with DS v3 token system.', useCase:'Token migration audit.', ref:null, states:'[]', resp:'Responsive', a11y:0, impact:'Moderate Impact', status:'on_audit', wf:'audit', audit:'Token update', dAgo:3 },
    { title:'PgdDataTable need revision', type:'component_enhancement', reqRole:'developer', prio:'High', platform:'Web', comp:'PgdDataTable', desc:'Table sort interaction needs rework. Loading state animation too slow.', useCase:'Core data display component.', ref:null, states:'["Default","Loading","Error"]', resp:'Responsive', a11y:0, impact:'High Impact', status:'need_revision', wf:'developer', audit:null, dAgo:2 },
    { title:'PgdCard design review', type:'component_variant', reqRole:'developer', prio:'Medium', platform:'Web', comp:'PgdCard', desc:'Card hover elevation and shadow tokens.', useCase:'Used in dashboard and listing pages.', ref:null, states:'[]', resp:'Responsive', a11y:0, impact:'Low Impact', status:'need_review_designer', wf:'developer', audit:null, dAgo:7 },
  ];

  const LOG_SEED = [
    { ri:0, actor:'Budi Santoso', role:'Developer', action:'created', note:'Submitted request for tertiary button variant.', icon:'📝', dot:'info', bc:'b-backlog', bt:'Backlog' },
    { ri:1, actor:'Andi Wijaya', role:'Designer', action:'created', note:'Proposed new DateRangePicker component. Awaiting validation.', icon:'📝', dot:'info', bc:'b-need_design_validation', bt:'Need Validation' },
    { ri:2, actor:'Sari Putri', role:'Designer', action:'start_design', note:'Started design for badge accessibility improvements.', icon:'🎨', dot:'info', bc:'b-in_design', bt:'In Design' },
    { ri:4, actor:'Budi Santoso', role:'Engineer', action:'start_development', note:'Started fixing Safari focus ring bug.', icon:'⚙️', dot:'info', bc:'b-in_progress_code', bt:'In Progress' },
  ];

  const reqIds = REQS.map(() => uuid());
  REQS.forEach((r, i) => {
    insReq.run(reqIds[i], r.title, r.type, r.reqRole, r.prio, r.platform, r.comp, r.desc, r.useCase, '[]', r.ref, r.states, r.resp, r.a11y, r.impact, r.status, r.wf, r.audit, dAgo(r.dAgo), dAgo(r.dAgo));
  });
  LOG_SEED.forEach(l => {
    insLog.run(uuid(), reqIds[l.ri], l.actor, l.role, l.action, l.note, l.icon, l.dot, l.bc, l.bt, dAgo(REQS[l.ri].dAgo));
  });

  // Default menu settings
  const DEFAULT_MENU = {
    designer: { dashboard:true, requests:true, my_tasks:true, components:true, audit:true },
    engineer:  { dashboard:true, requests:true, my_tasks:true, components:true, audit:true },
    developer: { dashboard:true, requests:true, my_tasks:false, components:true, audit:false },
  };
  db.prepare(`INSERT OR IGNORE INTO menu_settings VALUES ('singleton', ?)`).run(JSON.stringify(DEFAULT_MENU));

  console.log('✅ Database seeded.');
}

module.exports = { getDb, initDb };
