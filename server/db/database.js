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
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Run schema initialization
db.serialize(() => {
  schema.split(';').forEach((statement) => {
    if (statement.trim()) {
      db.run(statement.trim());
    }
  });

  // Check and add new inventory unit and tracking columns to products table if they don't exist
  db.all("PRAGMA table_info(products)", (err, columns) => {
    if (err) {
      console.error("Error reading table info for products", err);
      return;
    }
    const colsToAdd = [
      { name: 'unit', type: "TEXT DEFAULT 'pcs'" },
      { name: 'purchase_unit', type: "TEXT DEFAULT 'pcs'" },
      { name: 'selling_unit', type: "TEXT DEFAULT 'pcs'" },
      { name: 'purchase_to_base_rate', type: "REAL DEFAULT 1.0" },
      { name: 'selling_to_base_rate', type: "REAL DEFAULT 1.0" },
      { name: 'expiry_date', type: "TEXT" },
      { name: 'batch_number', type: "TEXT" }
    ];

    colsToAdd.forEach(col => {
      const exists = columns && columns.some(c => c.name === col.name);
      if (!exists) {
        db.run(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`, (alterErr) => {
          if (alterErr) {
            console.error(`Error adding ${col.name} column to products table`, alterErr);
          } else {
            console.log(`Successfully added ${col.name} column to products table`);
          }
        });
      }
    });
  });
});

console.log('Database initialized successfully');

module.exports = db;