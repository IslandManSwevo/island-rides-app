const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const useSQLite = process.env.DATABASE_TYPE === 'sqlite' || isTest;

// Determine database configuration based on environment
let dbConfig = {};

if (useSQLite) {
  // Use SQLite for testing or when DATABASE_TYPE=sqlite
  const sqlite3 = require('sqlite3').verbose();
  const dbFile = isTest ? ':memory:' : (process.env.DATABASE_URL || './island-rides.db');
  
  const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
      console.error('❌ SQLite connection error:', err.message);
    } else {
      console.log('✅ Connected to SQLite database:', dbFile);
    }
  });
  
  // Initialize database schema
  const initTestDb = () => {
    return new Promise((resolve, reject) => {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  };

  module.exports = {
    query: (text, params = []) => {
      const sql = text.replace(/\$\d+/g, '?');
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      });
    },
    db,
    initTestDb,
    pool: null
  };
} else {
  // Use PostgreSQL for production when DATABASE_TYPE is not sqlite
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'island_rides_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  const pool = new Pool(dbConfig);

  // Test connection
  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ Database connection error:', err.message);
    process.exit(-1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    pool.end(() => {
      console.log('📤 Database pool has ended');
    });
  });

  module.exports = {
    query: (text, params = []) => pool.query(text, params),
    db: null,
    pool,
    initTestDb: null
  };
}
