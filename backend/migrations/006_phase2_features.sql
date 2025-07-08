-- Phase 2 Features Database Schema
-- Push Notifications, Favorites, Price Monitoring

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  push_enabled BOOLEAN DEFAULT TRUE,
  booking_confirmations BOOLEAN DEFAULT TRUE,
  booking_reminders BOOLEAN DEFAULT TRUE,
  review_requests BOOLEAN DEFAULT TRUE,
  price_alerts BOOLEAN DEFAULT TRUE,
  new_messages BOOLEAN DEFAULT TRUE,
  promotional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push tokens storage
CREATE TABLE IF NOT EXISTS push_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token VARCHAR(255) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  device_id VARCHAR(255),
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, token)
);

-- Notification history
CREATE TABLE IF NOT EXISTS notification_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  clicked_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent'
);

-- User favorites
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  notify_price_drop BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, vehicle_id)
);

-- Favorite collections (for organizing favorites)
CREATE TABLE IF NOT EXISTS favorite_collections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection items
CREATE TABLE IF NOT EXISTS collection_items (
  collection_id INTEGER REFERENCES favorite_collections(id) ON DELETE CASCADE,
  favorite_id INTEGER REFERENCES favorites(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, favorite_id)
);

-- Price history for price drop notifications
CREATE TABLE IF NOT EXISTS vehicle_price_history (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  daily_rate DECIMAL(10, 2) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user_vehicle ON favorites(user_id, vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_price_history ON vehicle_price_history(vehicle_id, changed_at DESC); 