-- Review Moderation System Database Schema

-- Add moderation status to existing reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderated_by VARCHAR(50);

-- Review moderation logs
CREATE TABLE IF NOT EXISTS review_moderation_logs (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
  moderation_data JSONB,
  risk_score INTEGER,
  status VARCHAR(20) NOT NULL,
  auto_action VARCHAR(50),
  moderated_by VARCHAR(50) NOT NULL,
  moderated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  admin_notes TEXT,
  rejection_reason VARCHAR(100)
);

-- Review reports from users
CREATE TABLE IF NOT EXISTS review_reports (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
  reported_by INTEGER REFERENCES users(id),
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT
);

-- Admin moderation actions log
CREATE TABLE IF NOT EXISTS admin_moderation_actions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id INTEGER NOT NULL,
  reason VARCHAR(100),
  notes TEXT,
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_moderated_at ON reviews(moderated_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_moderation_logs_review ON review_moderation_logs(review_id);
CREATE INDEX IF NOT EXISTS idx_review_moderation_logs_status ON review_moderation_logs(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_review ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reported_by ON review_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_admin_moderation_actions_admin ON admin_moderation_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_moderation_actions_date ON admin_moderation_actions(action_date DESC); 