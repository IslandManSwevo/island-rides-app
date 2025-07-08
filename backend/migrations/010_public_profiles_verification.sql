-- Migration 010: Public User Profiles and Verification System
-- Adds public profile features, verification badges, and social elements

-- Extend users table with public profile fields (SQLite doesn't support IF NOT EXISTS with ALTER TABLE)
-- Use individual statements to avoid errors if columns already exist

-- Note: These will fail silently if columns already exist, which is expected behavior
ALTER TABLE users ADD COLUMN profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN phone_number TEXT;
ALTER TABLE users ADD COLUMN date_of_birth DATE;
ALTER TABLE users ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE users ADD COLUMN allow_messages BOOLEAN DEFAULT 1;
ALTER TABLE users ADD COLUMN show_email BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN show_phone BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN social_facebook TEXT;
ALTER TABLE users ADD COLUMN social_instagram TEXT;
ALTER TABLE users ADD COLUMN social_twitter TEXT;
ALTER TABLE users ADD COLUMN languages_spoken TEXT;
ALTER TABLE users ADD COLUMN interests TEXT;
ALTER TABLE users ADD COLUMN fun_fact TEXT;
ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN last_active TIMESTAMP;

-- Table for verification badges and achievements
CREATE TABLE IF NOT EXISTS user_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Verification types
  email_verified BOOLEAN DEFAULT 0,
  phone_verified BOOLEAN DEFAULT 0,
  identity_verified BOOLEAN DEFAULT 0,
  address_verified BOOLEAN DEFAULT 0,
  driving_license_verified BOOLEAN DEFAULT 0,
  background_check_verified BOOLEAN DEFAULT 0,
  
  -- Verification dates
  email_verified_at TIMESTAMP,
  phone_verified_at TIMESTAMP,
  identity_verified_at TIMESTAMP,
  address_verified_at TIMESTAMP,
  driving_license_verified_at TIMESTAMP,
  background_check_verified_at TIMESTAMP,
  
  -- Achievement badges
  superhost_badge BOOLEAN DEFAULT 0,
  frequent_traveler_badge BOOLEAN DEFAULT 0,
  early_adopter_badge BOOLEAN DEFAULT 0,
  top_reviewer_badge BOOLEAN DEFAULT 0,
  community_leader_badge BOOLEAN DEFAULT 0,
  
  -- Achievement dates
  superhost_since TIMESTAMP,
  frequent_traveler_since TIMESTAMP,
  early_adopter_since TIMESTAMP,
  top_reviewer_since TIMESTAMP,
  community_leader_since TIMESTAMP,
  
  -- Verification documents (stored file paths/URLs)
  identity_document_url TEXT,
  address_document_url TEXT,
  driving_license_url TEXT,
  
  -- Verification status tracking
  verification_score INTEGER DEFAULT 0, -- 0-100 based on completed verifications
  overall_verification_status VARCHAR(20) DEFAULT 'unverified',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for public trip history (privacy-controlled)
CREATE TABLE IF NOT EXISTS public_trip_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  
  -- Trip details
  destination TEXT NOT NULL,
  trip_start_date DATE NOT NULL,
  trip_end_date DATE NOT NULL,
  trip_duration_days INTEGER NOT NULL,
  
  -- Privacy settings
  is_public BOOLEAN DEFAULT 1,
  show_destination BOOLEAN DEFAULT 1,
  show_dates BOOLEAN DEFAULT 0,
  show_duration BOOLEAN DEFAULT 1,
  
  -- Trip story/review
  trip_story TEXT,
  trip_photos TEXT, -- JSON array of photo URLs
  trip_rating INTEGER CHECK (trip_rating >= 1 AND trip_rating <= 5),
  
  -- Social sharing
  shared_on_social BOOLEAN DEFAULT 0,
  social_platforms TEXT, -- JSON array of platforms shared on
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for user social connections and referrals
CREATE TABLE IF NOT EXISTS user_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  connected_user_id INTEGER NOT NULL REFERENCES users(id),
  
  connection_type VARCHAR(20) DEFAULT 'friend',
  connection_status VARCHAR(20) DEFAULT 'pending',
  
  -- Referral tracking
  referral_code VARCHAR(50),
  referral_bonus_earned DECIMAL(10,2) DEFAULT 0.00,
  referral_bonus_status VARCHAR(20) DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, connected_user_id)
);

-- Table for user reviews and testimonials
CREATE TABLE IF NOT EXISTS user_testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  reviewee_id INTEGER NOT NULL REFERENCES users(id),
  booking_id INTEGER REFERENCES bookings(id),
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_categories TEXT, -- JSON object with category ratings (cleanliness, communication, etc.)
  
  -- Review metadata
  is_public BOOLEAN DEFAULT 1,
  is_featured BOOLEAN DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  
  -- Moderation
  is_moderated BOOLEAN DEFAULT 0,
  moderation_status VARCHAR(20) DEFAULT 'pending',
  moderation_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for user activity feed and social updates
CREATE TABLE IF NOT EXISTS user_activity_feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL, -- 'trip_completed', 'review_posted', 'badge_earned', 'profile_updated', etc.
  activity_title VARCHAR(255) NOT NULL,
  activity_description TEXT,
  activity_data TEXT, -- JSON object with activity-specific data
  
  -- Privacy and visibility
  is_public BOOLEAN DEFAULT 1,
  visibility_level VARCHAR(20) DEFAULT 'public',
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for profile views and interactions
CREATE TABLE IF NOT EXISTS profile_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  viewer_id INTEGER REFERENCES users(id), -- NULL for anonymous views
  profile_owner_id INTEGER NOT NULL REFERENCES users(id),
  
  interaction_type VARCHAR(30) NOT NULL, -- 'view', 'like', 'message', 'favorite'
  interaction_data TEXT, -- JSON object with interaction-specific data
  
  -- Tracking
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer_url TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_verifications_user ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(overall_verification_status);

CREATE INDEX IF NOT EXISTS idx_public_trip_history_user ON public_trip_history(user_id, trip_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_public_trip_history_public ON public_trip_history(is_public, trip_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_connections_user ON user_connections(user_id, connection_status);
CREATE INDEX IF NOT EXISTS idx_user_connections_connected ON user_connections(connected_user_id, connection_status);
CREATE INDEX IF NOT EXISTS idx_user_connections_referral ON user_connections(referral_code);

CREATE INDEX IF NOT EXISTS idx_user_testimonials_reviewee ON user_testimonials(reviewee_id, is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_testimonials_reviewer ON user_testimonials(reviewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_testimonials_public ON user_testimonials(is_public, rating DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_feed_user ON user_activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_feed_public ON user_activity_feed(is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_interactions_owner ON profile_interactions(profile_owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_interactions_viewer ON profile_interactions(viewer_id, created_at DESC);

-- Views for common profile queries
CREATE VIEW IF NOT EXISTS public_user_profiles AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.profile_photo_url,
  u.bio,
  u.location,
  u.languages_spoken,
  u.interests,
  u.fun_fact,
  u.created_at as member_since,
  u.last_active,
  
  -- Verification info
  uv.verification_score,
  uv.overall_verification_status,
  uv.email_verified,
  uv.phone_verified,
  uv.identity_verified,
  uv.superhost_badge,
  uv.frequent_traveler_badge,
  uv.early_adopter_badge,
  uv.top_reviewer_badge,
  uv.community_leader_badge,
  
  -- Stats
  COUNT(DISTINCT CASE WHEN pth.is_public = 1 THEN pth.id END) as public_trips_count,
  COUNT(DISTINCT CASE WHEN ut.is_public = 1 THEN ut.id END) as public_reviews_count,
  AVG(CASE WHEN ut.is_public = 1 THEN ut.rating END) as average_rating_received,
  COUNT(DISTINCT v.id) as vehicles_owned,
  
  -- Privacy settings
  u.profile_visibility,
  u.allow_messages,
  u.show_email,
  u.show_phone

FROM users u
LEFT JOIN user_verifications uv ON u.id = uv.user_id
LEFT JOIN public_trip_history pth ON u.id = pth.user_id
LEFT JOIN user_testimonials ut ON u.id = ut.reviewee_id
LEFT JOIN vehicles v ON u.id = v.owner_id
WHERE u.profile_visibility IN ('public', 'friends')
GROUP BY u.id;

-- View for user verification summary
CREATE VIEW IF NOT EXISTS user_verification_summary AS
SELECT 
  uv.user_id,
  uv.verification_score,
  uv.overall_verification_status,
  
  -- Count of verifications
  (CASE WHEN uv.email_verified = 1 THEN 1 ELSE 0 END +
   CASE WHEN uv.phone_verified = 1 THEN 1 ELSE 0 END +
   CASE WHEN uv.identity_verified = 1 THEN 1 ELSE 0 END +
   CASE WHEN uv.address_verified = 1 THEN 1 ELSE 0 END +
   CASE WHEN uv.driving_license_verified = 1 THEN 1 ELSE 0 END +
   CASE WHEN uv.background_check_verified = 1 THEN 1 ELSE 0 END) as verifications_completed,
   
  -- Count of badges
  (CASE WHEN uv.superhost_badge = 1 THEN 1 ELSE 0 END +
   CASE WHEN uv.frequent_traveler_badge = 1 THEN 1 ELSE 0 END +
   CASE WHEN uv.early_adopter_badge = 1 THEN 1 ELSE 0 END +
   CASE WHEN uv.top_reviewer_badge = 1 THEN 1 ELSE 0 END +
   CASE WHEN uv.community_leader_badge = 1 THEN 1 ELSE 0 END) as badges_earned,
   
  -- Individual verification flags for easy access
  uv.email_verified,
  uv.phone_verified,
  uv.identity_verified,
  uv.address_verified,
  uv.driving_license_verified,
  uv.background_check_verified,
  
  -- Individual badges for easy access
  uv.superhost_badge,
  uv.frequent_traveler_badge,
  uv.early_adopter_badge,
  uv.top_reviewer_badge,
  uv.community_leader_badge

FROM user_verifications uv;

-- Insert default verification records for existing users
INSERT OR IGNORE INTO user_verifications (user_id, email_verified, email_verified_at)
SELECT id, CASE WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END, created_at
FROM users;

-- Update verification scores based on existing data
UPDATE user_verifications 
SET verification_score = (
  (CASE WHEN email_verified = 1 THEN 20 ELSE 0 END) +
  (CASE WHEN phone_verified = 1 THEN 15 ELSE 0 END) +
  (CASE WHEN identity_verified = 1 THEN 25 ELSE 0 END) +
  (CASE WHEN address_verified = 1 THEN 15 ELSE 0 END) +
  (CASE WHEN driving_license_verified = 1 THEN 15 ELSE 0 END) +
  (CASE WHEN background_check_verified = 1 THEN 10 ELSE 0 END)
);

-- Update overall verification status based on score
UPDATE user_verifications 
SET overall_verification_status = CASE 
  WHEN verification_score >= 80 THEN 'premium'
  WHEN verification_score >= 60 THEN 'verified' 
  WHEN verification_score >= 20 THEN 'partial'
  ELSE 'unverified'
END; 