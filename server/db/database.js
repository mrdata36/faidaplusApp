const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

let db;

function convertSql(sql) {
  let pgSql = sql;

  // Translate common SQLITE table/column definitions
  pgSql = pgSql.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
  pgSql = pgSql.replace(/DATETIME\s+DEFAULT\s+CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
  pgSql = pgSql.replace(/DATE\s+DEFAULT\s+\(\s*DATE\s*\(\s*['"]now['"]\s*\)\s*\)/gi, 'DATE DEFAULT CURRENT_DATE');
  pgSql = pgSql.replace(/DATE\s*\(\s*['"]now['"]\s*\)/gi, 'CURRENT_DATE');
  
  // Convert 'now' to CURRENT_TIMESTAMP
  pgSql = pgSql.replace(/'now'/g, 'CURRENT_DATE');

  // SQLite strftime('%Y-%m', date) -> TO_CHAR(date, 'YYYY-MM')
  pgSql = pgSql.replace(/strftime\(\s*['"]%Y-%m['"]\s*,\s*([^)]+)\)/gi, "TO_CHAR($1, 'YYYY-MM')");

  // Replace double-quoted literals with single-quoted ones for PostgreSQL compatibility
  // E.g., type = "income" -> type = 'income'
  pgSql = pgSql.replace(/"(income|expense|now)"/g, "'$1'");

  // Translate INSERT OR REPLACE ON SETTINGS
  if (pgSql.includes('INSERT OR REPLACE INTO settings')) {
    pgSql = pgSql.replace(
      /INSERT\s+OR\s+REPLACE\s+INTO\s+settings\s*\(\s*user_id\s*,\s*key\s*,\s*value\s*,\s*updated_at\s*\)\s*VALUES\s*\(\s*\?\s*,\s*\?\s*,\s*\?\s*,\s*datetime\(['"]now['"]\)\s*\)/i,
      'INSERT INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP'
    );
  }

  // Convert standard SQLite ? placeholders to PG $1, $2, etc.
  let index = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${index++}`);

  // If it's an INSERT statement, we should append RETURNING id to capture lastID
  if (/^\s*insert\s+into/i.test(pgSql) && !/returning/i.test(pgSql)) {
    pgSql += ' RETURNING id';
  }

  return pgSql;
}

// Detect if we should use Cloud SQL (PostgreSQL)
const useCloudSQL = !!(process.env.SQL_HOST || process.env.SQL_USER || process.env.SQL_PASSWORD);

if (useCloudSQL) {
  console.log('Using Cloud SQL (PostgreSQL) connection pool');
  
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL pool client:', err);
  });

  db = {
    run: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      params = params || [];

      if (sql.includes('PRAGMA foreign_keys')) {
        if (callback) callback(null);
        return;
      }

      const pgSql = convertSql(sql);
      pool.query(pgSql, params, (err, res) => {
        if (err) {
          console.error('Database run error:', err.message, 'SQL:', pgSql);
          if (callback) callback(err);
          return;
        }
        const lastID = (res.rows && res.rows[0] && res.rows[0].id) ? res.rows[0].id : null;
        if (callback) {
          callback.call({ lastID: lastID, changes: res.rowCount }, null);
        }
      });
    },

    get: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      params = params || [];

      const pgSql = convertSql(sql);
      pool.query(pgSql, params, (err, res) => {
        if (err) {
          console.error('Database get error:', err.message, 'SQL:', pgSql);
          if (callback) callback(err);
          return;
        }
        if (callback) {
          callback(null, res.rows[0] || null);
        }
      });
    },

    all: function(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      params = params || [];

      if (sql.includes('PRAGMA table_info')) {
        const tableNameMatch = sql.match(/table_info\(([^)]+)\)/i);
        const tableName = tableNameMatch ? tableNameMatch[1].trim() : 'products';
        const querySql = `
          SELECT column_name AS name 
          FROM information_schema.columns 
          WHERE table_name = $1
        `;
        pool.query(querySql, [tableName], (err, res) => {
          if (err) {
            if (callback) callback(err);
            return;
          }
          if (callback) {
            callback(null, res.rows || []);
          }
        });
        return;
      }

      const pgSql = convertSql(sql);
      pool.query(pgSql, params, (err, res) => {
        if (err) {
          console.error('Database all error:', err.message, 'SQL:', pgSql);
          if (callback) callback(err);
          return;
        }
        if (callback) {
          callback(null, res.rows || []);
        }
      });
    },

    serialize: function(callback) {
      callback();
    }
  };

  // Initialize PostgreSQL tables if they don't exist
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // We run schema initialization sequentially using a promise chain to handle constraints cleanly
  const runSchemaInit = async () => {
    console.log('Connecting as admin to initialize PostgreSQL schema...');
    const adminPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_ADMIN_USER,
      password: process.env.SQL_ADMIN_PASSWORD,
      database: process.env.SQL_DB_NAME,
      connectionTimeoutMillis: 15000,
    });

    const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const statement of statements) {
      const pgStatement = convertSql(statement);
      if (pgStatement.includes('PRAGMA')) continue;
      
      try {
        await adminPool.query(pgStatement, []);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.error('Error running schema statement:', err.message, 'SQL:', pgStatement);
        }
      }
    }

    // Grant standard app user read/write access to newly created tables and sequences
    try {
      if (process.env.SQL_USER) {
        console.log(`Granting permissions on schema public to ${process.env.SQL_USER}...`);
        await adminPool.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${process.env.SQL_USER}"`);
        await adminPool.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${process.env.SQL_USER}"`);
        console.log('Permissions granted successfully');
      }
    } catch (grantErr) {
      console.error('Error granting privileges to standard app user:', grantErr.message);
    }

    await adminPool.end();
    console.log('PostgreSQL database initialization executed successfully');
  };

  runSchemaInit().catch(err => {
    console.error('Failed to run PostgreSQL schema initialization:', err);
  });

} else {
  console.log('Using local SQLite3 database');
  
  // Ensure db directory exists
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'faidaplus.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create database connection
  const sqliteDb = new sqlite3.Database(dbPath);

  // Enable foreign keys
  sqliteDb.run('PRAGMA foreign_keys = ON');

  // Initialize database with schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Run schema initialization
  sqliteDb.serialize(() => {
    schema.split(';').forEach((statement) => {
      if (statement.trim()) {
        sqliteDb.run(statement.trim());
      }
    });

    // Check and add new inventory unit and tracking columns to products table if they don't exist
    sqliteDb.all("PRAGMA table_info(products)", (err, columns) => {
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
          sqliteDb.run(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`, (alterErr) => {
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

  db = sqliteDb;
  console.log('SQLite database initialized successfully');
}

module.exports = db;