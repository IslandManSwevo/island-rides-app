const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

describe('Database Migrations', () => {
  let db;
  let testDbPath;

  beforeEach(() => {
    testDbPath = path.join(__dirname, 'test-migrations.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new Database(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('should apply host profile enhancements migration successfully', () => {
    const migration = fs.readFileSync(path.join(__dirname, '..', 'migrations', '013_host_profile_enhancements.sql'), 'utf8');
    db.exec(migration);
    // Verify tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    expect(tables.map(t => t.name)).toContain('host_profiles');
    expect(tables.map(t => t.name)).toContain('host_analytics');
    expect(tables.map(t => t.name)).toContain('host_notifications');
    // Verify columns in users table
    const usersColumns = db.prepare('PRAGMA table_info(users)').all();
    expect(usersColumns.map(c => c.name)).toContain('host_status');
    expect(usersColumns.map(c => c.name)).toContain('host_rating');
  });

  test('should apply vehicle documents management migration successfully', () => {
    const migration = fs.readFileSync(path.join(__dirname, '..', 'migrations', '014_vehicle_documents_management.sql'), 'utf8');
    db.exec(migration);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    expect(tables.map(t => t.name)).toContain('vehicle_documents');
    expect(tables.map(t => t.name)).toContain('host_documents');
  });

  test('should apply enhanced identity verification migration successfully', () => {
    const migration = fs.readFileSync(path.join(__dirname, '..', 'migrations', '015_enhanced_identity_verification.sql'), 'utf8');
    db.exec(migration);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    expect(tables.map(t => t.name)).toContain('identity_verification_sessions');
    expect(tables.map(t => t.name)).toContain('verification_documents');
  });

  test('should apply enhanced search discovery migration successfully', () => {
    const migration = fs.readFileSync(path.join(__dirname, '..', 'migrations', '016_enhanced_search_discovery.sql'), 'utf8');
    db.exec(migration);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    expect(tables.map(t => t.name)).toContain('vehicle_search_index');
    expect(tables.map(t => t.name)).toContain('search_filters');
  });

  test('should apply host storefront marketplace migration successfully', () => {
    const migration = fs.readFileSync(path.join(__dirname, '..', 'migrations', '017_host_storefront_marketplace.sql'), 'utf8');
    db.exec(migration);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    expect(tables.map(t => t.name)).toContain('host_storefronts');
    expect(tables.map(t => t.name)).toContain('storefront_analytics');
  });
});