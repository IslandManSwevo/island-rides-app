const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
require('dotenv').config();

const dbFile = process.env.DB_PATH || process.env.DATABASE_URL || './island-rides.db';
const dbExists = fs.existsSync(dbFile);

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log(`Connected to the SQLite database at ${dbFile}`);
    if (!dbExists) {
      console.log('Database file not found, initializing schema...');
      try {
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        db.exec(schema, (err) => {
          if (err) {
            console.error('Error initializing database schema', err.message);
          } else {
            console.log('Database schema initialized successfully.');
          }
        });
      } catch (schemaErr) {
        console.error('Error reading schema.sql file:', schemaErr.message);
      }
    }
  }
});

const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    const sql = text.replace(/\$\d+/g, '?');
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Database query error:', err.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
};

module.exports = {
  query,
  db,
};
