const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const path = require('path');

// In Vercel, use /tmp (ephemeral) or provide persistent storage via environment variable
const DB_PATH = process.env.DB_PATH || path.join('/tmp', 'pgds.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
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

  // ── TABLES (from backend/src/data/db.js) ────────────────────────────────────
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
      status TEXT DEFAULT 'done',
      version TEXT,
      is_active INTEGER DEFAULT 1,
      library TEXT,
      tags TEXT,
      doc_link TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      request_type TEXT NOT NULL,
      requester_role TEXT,
      requester_name TEXT,
      requester_team TEXT,
      requester_id TEXT,
      priority TEXT DEFAULT 'Medium',
      platform TEXT DEFAULT 'Web',
      component_name TEXT,
      component_description TEXT,
      use_case TEXT,
      affected_products TEXT,
      design_reference_link TEXT,
      reference_product TEXT,
      interaction_behaviour TEXT,
      responsive_behaviour TEXT,
      accessibility_requirement INTEGER DEFAULT 0,
      state_requirements TEXT,
      impact_level TEXT,
      deadline TEXT,
      business_goal TEXT,
      additional_notes TEXT,
      status TEXT DEFAULT 'backlog',
      workflow TEXT DEFAULT 'developer',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      actor TEXT,
      actor_id TEXT,
      actor_role TEXT,
      action TEXT,
      note TEXT,
      icon TEXT,
      dot_class TEXT,
      badge_class TEXT,
      badge_text TEXT,
      score TEXT,
      version TEXT,
      library TEXT,
      doc_link TEXT,
      component_name TEXT,
      figma_link TEXT,
      preview_link TEXT,
      screenshot_name TEXT,
      screenshot_data_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(request_id) REFERENCES requests(id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      actor_id TEXT,
      actor_name TEXT,
      entity_id TEXT,
      entity_type TEXT,
      action TEXT,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_settings (
      id TEXT PRIMARY KEY,
      settings TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS data_master (
      id TEXT PRIMARY KEY,
      settings TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON request_logs(request_id);
    CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_log(actor_id);
  `);

  // Seed initial data if needed
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount === 0) {
    const now = new Date().toISOString();
    const adminId = uuid();
    db.prepare(`INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      adminId, 'Admin User', 'admin', 'admin@pgds.local',
      bcrypt.hashSync('password123', 10),
      'super_admin', null, null, 'active', null, now, now, now
    );
    console.log('✅ Seeded admin user (email: admin@pgds.local, password: password123)');
  }
}

module.exports = { getDb, closeDb, initDb, dAgo };
