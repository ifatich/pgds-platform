#!/usr/bin/env node

/**
 * Export current database to seed.json for Railway deployment
 * Usage: node export-db.js
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'pgds.db'); // same path as db.js creates: backend/pgds.db

// Initialize database first if it doesn't exist
if (!fs.existsSync(dbPath)) {
  console.log('📝 Initializing database first...');
  require('./src/data/db').initDb();
}

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database could not be created at:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

// Export all tables
const tables = {
  users: db.prepare('SELECT * FROM users').all(),
  components: db.prepare('SELECT * FROM components').all(),
  requests: db.prepare('SELECT * FROM requests').all(),
  request_logs: db.prepare('SELECT * FROM request_logs').all(),
  activity_log: db.prepare('SELECT * FROM activity_log').all(),
  menu_settings: db.prepare('SELECT * FROM menu_settings').all(),
  data_master: db.prepare('SELECT * FROM data_master').all(),
};

const output = {
  exportedAt: new Date().toISOString(),
  tables,
};

const outputPath = path.join(__dirname, 'seed-data.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('✅ Exported', Object.keys(tables).length, 'tables');
console.log('📁 Saved to:', outputPath);
console.log('');
console.log('Summary:');
Object.entries(tables).forEach(([table, rows]) => {
  console.log(`  - ${table}: ${rows.length} rows`);
});

db.close();
