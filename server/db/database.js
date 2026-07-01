const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure db directory exists
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'faidaplus.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database with schema
const schemaPath = path.join(dbDir, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Run schema initialization
db.serialize(() => {
  schema.split(';').forEach((statement) => {
    if (statement.trim()) {
      db.run(statement.trim());
    }
  });
});

console.log('Database initialized successfully');

module.exports = db;