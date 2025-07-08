const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'island-rides.db');
const db = new Database(dbPath);

// Owner Dashboard Migration
const ownerDashboardMigration = fs.readFileSync(path.join(__dirname, 'migrations', '009_owner_dashboard.sql'), 'utf8');

try {
  console.log('Running owner dashboard migration...');
  db.exec(ownerDashboardMigration);
  console.log('✅ Owner dashboard migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
} finally {
  db.close();
} 