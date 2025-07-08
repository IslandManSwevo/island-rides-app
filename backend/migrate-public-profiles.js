const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'island-rides.db');
const db = new Database(dbPath);

// Public Profiles Migration
const publicProfilesMigration = fs.readFileSync(path.join(__dirname, 'migrations', '010_public_profiles_verification.sql'), 'utf8');

try {
  console.log('Running public profiles and verification migration...');
  db.exec(publicProfilesMigration);
  console.log('✅ Public profiles migration completed');

  console.log('🎉 Public profiles migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  console.error('Error details:', error.message);
} finally {
  db.close();
} 