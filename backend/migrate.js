const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'island-rides.db');
const db = new Database(dbPath);

// Payment Schema Migration
const paymentMigration = `
-- Add payment columns to bookings table
ALTER TABLE bookings ADD COLUMN payment_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN payment_method TEXT;
ALTER TABLE bookings ADD COLUMN payment_failure_reason TEXT;
ALTER TABLE bookings ADD COLUMN paid_at TEXT;

-- Add payment columns to users table
ALTER TABLE users ADD COLUMN transfi_customer_id TEXT;
ALTER TABLE users ADD COLUMN preferred_payment_method TEXT;
ALTER TABLE users ADD COLUMN preferred_currency TEXT DEFAULT 'USD';

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id),
  transaction_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
`;

// Phase 2 Schema Migration
const phase2Migration = `
-- Push Notifications Schema
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  push_enabled INTEGER DEFAULT 1,
  booking_confirmations INTEGER DEFAULT 1,
  booking_reminders INTEGER DEFAULT 1,
  review_requests INTEGER DEFAULT 1,
  price_alerts INTEGER DEFAULT 1,
  new_messages INTEGER DEFAULT 1,
  promotional INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_id TEXT,
  last_used TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, token)
);

CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data TEXT,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT,
  clicked_at TEXT,
  status TEXT DEFAULT 'sent'
);

-- Favorites Schema
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  notify_price_drop INTEGER DEFAULT 1,
  UNIQUE(user_id, vehicle_id)
);

CREATE TABLE IF NOT EXISTS favorite_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id INTEGER REFERENCES favorite_collections(id) ON DELETE CASCADE,
  favorite_id INTEGER REFERENCES favorites(id) ON DELETE CASCADE,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, favorite_id)
);

CREATE TABLE IF NOT EXISTS vehicle_price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER REFERENCES vehicles(id),
  daily_rate REAL NOT NULL,
  changed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user_vehicle ON favorites(user_id, vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_price_history ON vehicle_price_history(vehicle_id, changed_at DESC);
`;

// Owner Dashboard Migration
const ownerDashboardMigration = fs.readFileSync(path.join(__dirname, 'migrations', '009_owner_dashboard.sql'), 'utf8');

try {
  console.log('Running payment migration...');
  db.exec(paymentMigration);
  console.log('✅ Payment migration completed');

  console.log('Running phase 2 migration...');
  db.exec(phase2Migration);
  console.log('✅ Phase 2 migration completed');

  console.log('Running owner dashboard migration...');
  db.exec(ownerDashboardMigration);
  console.log('✅ Owner dashboard migration completed');

  console.log('🎉 All migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
} finally {
  db.close();
}