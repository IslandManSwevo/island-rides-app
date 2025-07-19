-- Migration 016: Enhanced Search and Discovery System
-- Adds comprehensive search capabilities with island-aware features

-- Create search index table for vehicles
CREATE TABLE IF NOT EXISTS vehicle_search_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Basic Vehicle Information (denormalized for search performance)
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  vehicle_type VARCHAR(50),
  category VARCHAR(50),
  
  -- Location and Availability
  island VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  pickup_locations TEXT, -- JSON array of pickup locations
  delivery_available BOOLEAN DEFAULT 0,
  delivery_radius_km INTEGER DEFAULT 0,
  
  -- Pricing Information
  base_price_per_day DECIMAL(10,2),
  weekly_discount_percentage DECIMAL(5,2) DEFAULT 0,
  monthly_discount_percentage DECIMAL(5,2) DEFAULT 0,
  seasonal_pricing_active BOOLEAN DEFAULT 0,
  
  -- Features and Amenities (searchable)
  features TEXT, -- JSON array of feature names
  amenities TEXT, -- JSON array of amenity names
  fuel_type VARCHAR(30),
  transmission VARCHAR(20),
  seating_capacity INTEGER,
  
  -- Host Information
  host_id INTEGER REFERENCES users(id),
  host_rating DECIMAL(3,2),
  host_response_rate DECIMAL(5,2),
  superhost_status BOOLEAN DEFAULT 0,
  instant_book_available BOOLEAN DEFAULT 0,
  
  -- Performance Metrics
  total_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  booking_success_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Availability Status
  is_active BOOLEAN DEFAULT 1,
  is_available BOOLEAN DEFAULT 1,
  next_available_date DATE,
  availability_calendar TEXT, -- JSON object with availability data
  
  -- Search Optimization
  search_keywords TEXT, -- Space-separated keywords for full-text search
  popularity_score DECIMAL(8,4) DEFAULT 0, -- Calculated popularity score
  search_rank INTEGER DEFAULT 0, -- Manual search ranking
  
  -- Timestamps
  last_booked_at TIMESTAMP,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search filters table for dynamic filter options
CREATE TABLE IF NOT EXISTS search_filters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Filter Information
  filter_category VARCHAR(50) NOT NULL, -- 'location', 'vehicle_type', 'features', 'price_range', 'host_type'
  filter_name VARCHAR(100) NOT NULL,
  filter_value VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  
  -- Filter Configuration
  filter_type VARCHAR(30) NOT NULL, -- 'checkbox', 'radio', 'range', 'dropdown', 'multi_select'
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  
  -- Applicability
  applicable_islands TEXT, -- JSON array of islands where this filter applies
  applicable_categories TEXT, -- JSON array of vehicle categories
  
  -- Usage Statistics
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search sessions table for analytics and personalization
CREATE TABLE IF NOT EXISTS search_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id), -- NULL for anonymous users
  session_id VARCHAR(100) NOT NULL,
  
  -- Search Context
  search_type VARCHAR(30) DEFAULT 'browse', -- 'browse', 'specific', 'map_based', 'recommendation'
  search_intent VARCHAR(50), -- 'vacation', 'business', 'local_transport', 'adventure'
  
  -- Location Context
  search_island VARCHAR(100),
  search_region VARCHAR(100),
  user_location TEXT, -- JSON object with lat/lng
  pickup_location TEXT, -- JSON object with location details
  
  -- Search Parameters
  date_from DATE,
  date_to DATE,
  trip_duration_days INTEGER,
  guest_count INTEGER DEFAULT 1,
  
  -- Applied Filters
  filters_applied TEXT, -- JSON object with applied filters
  sort_criteria VARCHAR(50) DEFAULT 'relevance', -- 'relevance', 'price_low', 'price_high', 'rating', 'distance'
  
  -- Results and Interaction
  total_results INTEGER DEFAULT 0,
  results_viewed INTEGER DEFAULT 0,
  vehicles_clicked TEXT, -- JSON array of vehicle IDs clicked
  booking_initiated BOOLEAN DEFAULT 0,
  booking_completed BOOLEAN DEFAULT 0,
  
  -- Technical Details
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(30), -- 'mobile', 'tablet', 'desktop'
  referrer_url TEXT,
  
  -- Session Tracking
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_duration_seconds INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search recommendations table
CREATE TABLE IF NOT EXISTS search_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  
  -- Recommendation Context
  recommendation_type VARCHAR(30) NOT NULL, -- 'similar_vehicles', 'popular_in_area', 'price_alternative', 'feature_match'
  source_vehicle_id INTEGER REFERENCES vehicles(id),
  recommended_vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  
  -- Recommendation Scoring
  relevance_score DECIMAL(6,4) NOT NULL, -- 0.0000 to 1.0000
  confidence_score DECIMAL(6,4) NOT NULL,
  recommendation_reason TEXT,
  
  -- Recommendation Factors
  factors TEXT, -- JSON object with factors that influenced recommendation
  user_preferences TEXT, -- JSON object with user preferences considered
  
  -- Performance Tracking
  times_shown INTEGER DEFAULT 0,
  times_clicked INTEGER DEFAULT 0,
  click_through_rate DECIMAL(6,4) DEFAULT 0,
  conversion_rate DECIMAL(6,4) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create popular searches table for trending and suggestions
CREATE TABLE IF NOT EXISTS popular_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Search Information
  search_query VARCHAR(255) NOT NULL,
  search_filters TEXT, -- JSON object with common filter combinations
  search_location VARCHAR(100),
  
  -- Popularity Metrics
  search_count INTEGER DEFAULT 1,
  unique_users_count INTEGER DEFAULT 1,
  conversion_rate DECIMAL(6,4) DEFAULT 0,
  
  -- Time Period
  period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Trending Information
  is_trending BOOLEAN DEFAULT 0,
  trend_direction VARCHAR(10), -- 'up', 'down', 'stable'
  trend_percentage DECIMAL(6,2) DEFAULT 0,
  
  -- Geographic Distribution
  island_distribution TEXT, -- JSON object with search distribution by island
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create saved searches table for user convenience
CREATE TABLE IF NOT EXISTS saved_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Search Information
  search_name VARCHAR(100) NOT NULL,
  search_description TEXT,
  search_criteria TEXT NOT NULL, -- JSON object with search parameters
  
  -- Notification Settings
  email_alerts_enabled BOOLEAN DEFAULT 1,
  push_alerts_enabled BOOLEAN DEFAULT 1,
  alert_frequency VARCHAR(20) DEFAULT 'daily', -- 'immediate', 'daily', 'weekly'
  
  -- Alert Triggers
  new_vehicles_alert BOOLEAN DEFAULT 1,
  price_drop_alert BOOLEAN DEFAULT 1,
  availability_alert BOOLEAN DEFAULT 1,
  price_drop_threshold_percentage DECIMAL(5,2) DEFAULT 10.00,
  
  -- Performance
  last_executed_at TIMESTAMP,
  last_results_count INTEGER DEFAULT 0,
  total_executions INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search analytics summary table
CREATE TABLE IF NOT EXISTS search_analytics_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Time Period
  date DATE NOT NULL,
  hour INTEGER, -- NULL for daily summaries, 0-23 for hourly
  
  -- Search Volume
  total_searches INTEGER DEFAULT 0,
  unique_searchers INTEGER DEFAULT 0,
  anonymous_searches INTEGER DEFAULT 0,
  registered_user_searches INTEGER DEFAULT 0,
  
  -- Popular Filters
  top_islands TEXT, -- JSON array of most searched islands
  top_vehicle_types TEXT, -- JSON array of most searched vehicle types
  top_price_ranges TEXT, -- JSON array of most searched price ranges
  
  -- Conversion Metrics
  searches_with_results INTEGER DEFAULT 0,
  searches_with_clicks INTEGER DEFAULT 0,
  searches_with_bookings INTEGER DEFAULT 0,
  average_results_per_search DECIMAL(8,2) DEFAULT 0,
  
  -- Performance Metrics
  average_search_duration_seconds DECIMAL(8,2) DEFAULT 0,
  bounce_rate DECIMAL(6,4) DEFAULT 0, -- Searches with no interaction
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_search_index_location ON vehicle_search_index(island, region, city);
CREATE INDEX IF NOT EXISTS idx_vehicle_search_index_type ON vehicle_search_index(vehicle_type, category);
CREATE INDEX IF NOT EXISTS idx_vehicle_search_index_price ON vehicle_search_index(base_price_per_day, is_available);
CREATE INDEX IF NOT EXISTS idx_vehicle_search_index_host ON vehicle_search_index(host_id, host_rating);
CREATE INDEX IF NOT EXISTS idx_vehicle_search_index_popularity ON vehicle_search_index(popularity_score DESC, search_rank);
CREATE INDEX IF NOT EXISTS idx_vehicle_search_index_availability ON vehicle_search_index(is_available, next_available_date);

CREATE INDEX IF NOT EXISTS idx_search_filters_category ON search_filters(filter_category, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_search_filters_usage ON search_filters(usage_count DESC, last_used_at);

CREATE INDEX IF NOT EXISTS idx_search_sessions_user ON search_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_sessions_location ON search_sessions(search_island, search_region);
CREATE INDEX IF NOT EXISTS idx_search_sessions_dates ON search_sessions(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_search_sessions_conversion ON search_sessions(booking_completed, started_at);

CREATE INDEX IF NOT EXISTS idx_search_recommendations_user ON search_recommendations(user_id, recommendation_type);
CREATE INDEX IF NOT EXISTS idx_search_recommendations_vehicle ON search_recommendations(recommended_vehicle_id, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_recommendations_performance ON search_recommendations(click_through_rate DESC, conversion_rate DESC);

CREATE INDEX IF NOT EXISTS idx_popular_searches_period ON popular_searches(period_type, period_start, search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popular_searches_trending ON popular_searches(is_trending, trend_direction);
CREATE INDEX IF NOT EXISTS idx_popular_searches_location ON popular_searches(search_location, search_count DESC);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts ON saved_searches(email_alerts_enabled, last_executed_at);

CREATE INDEX IF NOT EXISTS idx_search_analytics_summary_date ON search_analytics_summary(date, hour);

-- Create full-text search index for vehicle search
CREATE VIRTUAL TABLE IF NOT EXISTS vehicle_search_fts USING fts5(
  vehicle_id,
  make,
  model,
  vehicle_type,
  features,
  amenities,
  search_keywords,
  island,
  region,
  city,
  content='vehicle_search_index',
  content_rowid='vehicle_id'
);