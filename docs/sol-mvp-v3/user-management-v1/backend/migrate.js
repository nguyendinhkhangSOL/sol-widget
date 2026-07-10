#!/usr/bin/env node
/**
 * Migration script — chạy 1 lần trên VPS để tạo bảng leads + notifications
 *
 * Usage:
 *   cd /var/www/huongdi/backend
 *   node migrate.js
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3'); // npm install better-sqlite3

const DB_DIR = process.env.DB_DIR || '/var/www/huongdi/db';
const DB_PATH = path.join(DB_DIR, 'leads.db');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');

// Ensure db dir exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log(`[migrate] Created dir: ${DB_DIR}`);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

console.log(`[migrate] ✅ Schema applied at ${DB_PATH}`);

// Verify
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
console.log('[migrate] Tables:', tables.map(t => t.name).join(', '));

const summary = db.prepare(`SELECT payment_status, COUNT(*) as count FROM leads GROUP BY payment_status`).all();
console.log('[migrate] Current leads:', summary.length ? summary : '(empty — OK for first run)');

db.close();
console.log('[migrate] Done.');
