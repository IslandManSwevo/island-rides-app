-- Migration 013: Host Profile Enhancements
-- Adds comprehensive host management features and profile enhancements

-- Extend users table with host-specific fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_status VARCHAR(20) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_since TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_verification_level VARCHAR(20) DEFAULT 'basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_host_reviews INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT 24;
ALTER TABLE users ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancellation_rate DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS superhost_status BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS superhost_since TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_languages TEXT; -- JSON array
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_specialties TEXT; -- JSON array
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_license_number VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_communication VARCHAR(20) DEFAULT 'app';
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_accept_bookings BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instant_book_enabled BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS minimum_advance_notice INTEGER DEFAULT 24; -- hours
ALTER TABLE users ADD COLUMN IF NOT EXISTS maximum_advance_notice INTEGER DEFAULT 365; -- days
ALTER TABLE users ADD COLUMN IF NOT EXISTS check_in_instructions TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS house_rules TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(20) DEFAULT 'moderate';

-- Create host profiles table for extended host information
CREATE TABLE IF NOT EXISTS host_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Business Information
  business_name VARCHAR(255),
  business_type VARCHAR(50), -- 'individual', 'company', 'partnership'
  business_address TEXT,
  business_phone VARCHAR(20),
  business_email VARCHAR(255),
  business_website VARCHAR(255),
  
  -- Host Preferences
  preferred_guest_type VARCHAR(50), -- 'any', 'business', 'leisure', 'local'
  minimum_trip_duration INTEGER DEFAULT 1, -- days
  maximum_trip_duration INTEGER DEFAULT 30, -- days
  preferred_booking_lead_time INTEGER DEFAULT 24, -- hours
  
  -- Pricing and Policies
  base_pricing_strategy VARCHAR(20) DEFAULT 'fixed', -- 'fixed', 'dynamic', 'seasonal'
  seasonal_pricing_enabled BOOLEAN DEFAULT 0,
  weekend_pricing_multiplier DECIMAL(3,2) DEFAULT 1.00,
  holiday_pricing_multiplier DECIMAL(3,2) DEFAULT 1.00,
  long_term_discount_enabled BOOLEAN DEFAULT 0,
  long_term_discount_threshold INTEGER DEFAULT 7, -- days
  long_term_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Insurance and Safety
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(100),
  insurance_coverage_amount DECIMAL(12,2),
  insurance_expiry_date DATE,
  safety_certification VARCHAR(100),
  safety_certification_expiry DATE,
  
  -- Performance Metrics
  total_earnings DECIMAL(12,2) DEFAULT 0.00,
  total_bookings INTEGER DEFAULT 0,
  total_guests_served INTEGER DEFAULT 0,
  average_booking_value DECIMAL(10,2) DEFAULT 0.00,
  repeat_guest_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Availability and Calendar
  calendar_sync_enabled BOOLEAN DEFAULT 0,
  external_calendar_url TEXT,
  default_availability_status VARCHAR(20) DEFAULT 'available',
  blocked_dates TEXT, -- JSON array of blocked date ranges
  
  -- Communication Preferences
  notification_preferences TEXT, -- JSON object
  marketing_opt_in BOOLEAN DEFAULT 1,
  review_reminder_enabled BOOLEAN DEFAULT 1,
  booking_confirmation_auto_send BOOLEAN DEFAULT 1,
  
  -- Profile Status
  profile_completion_percentage INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT 0,
  onboarding_step VARCHAR(50) DEFAULT 'welcome',
  profile_approved BOOLEAN DEFAULT 0,
  profile_approved_at TIMESTAMP,
  profile_approved_by INTEGER REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create host analytics table for performance tracking
CREATE TABLE IF NOT EXISTS host_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Time Period
  period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Booking Metrics
  total_bookings INTEGER DEFAULT 0,
  confirmed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  declined_bookings INTEGER DEFAULT 0,
  
  -- Financial Metrics
  gross_revenue DECIMAL(12,2) DEFAULT 0.00,
  net_revenue DECIMAL(12,2) DEFAULT 0.00,
  platform_fees DECIMAL(12,2) DEFAULT 0.00,
  average_booking_value DECIMAL(10,2) DEFAULT 0.00,
  
  -- Performance Metrics
  occupancy_rate DECIMAL(5,2) DEFAULT 0.00,
  response_rate DECIMAL(5,2) DEFAULT 0.00,
  acceptance_rate DECIMAL(5,2) DEFAULT 0.00,
  average_response_time_hours DECIMAL(8,2) DEFAULT 0.00,
  
  -- Guest Metrics
  total_guests INTEGER DEFAULT 0,
  new_guests INTEGER DEFAULT 0,
  repeat_guests INTEGER DEFAULT 0,
  guest_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
  
  -- Review Metrics
  reviews_received INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  five_star_reviews INTEGER DEFAULT 0,
  
  -- Vehicle Metrics
  total_vehicles_listed INTEGER DEFAULT 0,
  active_vehicles INTEGER DEFAULT 0,
  vehicle_utilization_rate DECIMAL(5,2) DEFAULT 0.00,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create host notifications table
CREATE TABLE IF NOT EXISTS host_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL, -- 'booking_request', 'payment_received', 'review_posted', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  action_text VARCHAR(100),
  
  -- Priority and Status
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'archived'
  category VARCHAR(50) DEFAULT 'general', -- 'booking', 'payment', 'review', 'system', 'marketing'
  
  -- Delivery Tracking
  delivered_via TEXT, -- JSON array: ['app', 'email', 'sms']
  email_sent BOOLEAN DEFAULT 0,
  email_opened BOOLEAN DEFAULT 0,
  sms_sent BOOLEAN DEFAULT 0,
  push_sent BOOLEAN DEFAULT 0,
  
  -- Metadata
  related_booking_id INTEGER REFERENCES bookings(id),
  related_vehicle_id INTEGER REFERENCES vehicles(id),
  metadata TEXT, -- JSON object for additional data
  
  -- Timestamps
  read_at TIMESTAMP,
  archived_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_host_profiles_user ON host_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_host_profiles_status ON host_profiles(profile_approved, onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_host_profiles_business ON host_profiles(business_type, profile_approved);

CREATE INDEX IF NOT EXISTS idx_host_analytics_host_period ON host_analytics(host_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_host_analytics_period ON host_analytics(period_type, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_host_notifications_host_status ON host_notifications(host_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_host_notifications_type ON host_notifications(notification_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_host_notifications_category ON host_notifications(category, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_host_status ON users(host_status, host_verification_level);
CREATE INDEX IF NOT EXISTS idx_users_superhost ON users(superhost_status, host_rating DESC);