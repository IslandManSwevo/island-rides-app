-- Migration 017: Host Storefront and Marketplace Features
-- Adds host storefront capabilities and marketplace enhancements

-- Create host storefronts table
CREATE TABLE IF NOT EXISTS host_storefronts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Storefront Information
  storefront_name VARCHAR(255) NOT NULL,
  storefront_slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
  storefront_description TEXT,
  tagline VARCHAR(255),
  
  -- Branding and Design
  logo_url VARCHAR(500),
  banner_image_url VARCHAR(500),
  brand_colors TEXT, -- JSON object with primary, secondary, accent colors
  custom_css TEXT, -- Custom styling for advanced hosts
  
  -- Contact Information
  business_phone VARCHAR(20),
  business_email VARCHAR(255),
  business_address TEXT,
  website_url VARCHAR(500),
  social_media_links TEXT, -- JSON object with social media URLs
  
  -- Storefront Settings
  is_public BOOLEAN DEFAULT 1,
  is_featured BOOLEAN DEFAULT 0,
  custom_domain VARCHAR(255), -- For premium hosts
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  
  -- Business Information
  business_hours TEXT, -- JSON object with operating hours
  languages_supported TEXT, -- JSON array of supported languages
  service_areas TEXT, -- JSON array of service areas/islands
  specializations TEXT, -- JSON array of specializations
  
  -- Policies and Terms
  rental_policies TEXT,
  cancellation_policy TEXT,
  damage_policy TEXT,
  late_return_policy TEXT,
  fuel_policy TEXT,
  cleaning_policy TEXT,
  
  -- Performance Metrics
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  conversion_rate DECIMAL(6,4) DEFAULT 0,
  average_session_duration INTEGER DEFAULT 0, -- seconds
  
  -- SEO and Analytics
  google_analytics_id VARCHAR(50),
  facebook_pixel_id VARCHAR(50),
  meta_tags TEXT, -- JSON object with additional meta tags
  
  -- Status and Moderation
  approval_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'suspended'
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create storefront sections table for customizable content sections
CREATE TABLE IF NOT EXISTS storefront_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  storefront_id INTEGER NOT NULL REFERENCES host_storefronts(id) ON DELETE CASCADE,
  
  -- Section Information
  section_type VARCHAR(50) NOT NULL, -- 'hero', 'about', 'vehicles', 'testimonials', 'gallery', 'contact', 'custom'
  section_name VARCHAR(100) NOT NULL,
  section_title VARCHAR(255),
  section_content TEXT,
  
  -- Layout and Design
  layout_type VARCHAR(30) DEFAULT 'default', -- 'default', 'grid', 'carousel', 'list', 'custom'
  background_image_url VARCHAR(500),
  background_color VARCHAR(7), -- Hex color code
  text_color VARCHAR(7),
  
  -- Content Configuration
  content_data TEXT, -- JSON object with section-specific data
  media_urls TEXT, -- JSON array of image/video URLs
  call_to_action TEXT, -- JSON object with CTA button configuration
  
  -- Display Settings
  is_visible BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  responsive_settings TEXT, -- JSON object with responsive display settings
  
  -- Animation and Effects
  animation_type VARCHAR(30), -- 'fade', 'slide', 'zoom', 'none'
  animation_duration INTEGER DEFAULT 300, -- milliseconds
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create storefront analytics table
CREATE TABLE IF NOT EXISTS storefront_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  storefront_id INTEGER NOT NULL REFERENCES host_storefronts(id) ON DELETE CASCADE,
  
  -- Time Period
  date DATE NOT NULL,
  hour INTEGER, -- NULL for daily summaries
  
  -- Traffic Metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  bounce_rate DECIMAL(6,4) DEFAULT 0,
  average_session_duration INTEGER DEFAULT 0, -- seconds
  
  -- Source Analytics
  direct_traffic INTEGER DEFAULT 0,
  search_engine_traffic INTEGER DEFAULT 0,
  social_media_traffic INTEGER DEFAULT 0,
  referral_traffic INTEGER DEFAULT 0,
  
  -- Device Analytics
  mobile_visitors INTEGER DEFAULT 0,
  tablet_visitors INTEGER DEFAULT 0,
  desktop_visitors INTEGER DEFAULT 0,
  
  -- Geographic Analytics
  visitor_countries TEXT, -- JSON object with country visitor counts
  visitor_islands TEXT, -- JSON object with island visitor counts
  
  -- Conversion Metrics
  vehicle_views INTEGER DEFAULT 0,
  contact_form_submissions INTEGER DEFAULT 0,
  phone_calls INTEGER DEFAULT 0,
  booking_inquiries INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  
  -- Revenue Metrics
  total_revenue DECIMAL(12,2) DEFAULT 0,
  average_booking_value DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create marketplace categories table
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Category Information
  category_name VARCHAR(100) NOT NULL,
  category_slug VARCHAR(100) UNIQUE NOT NULL,
  category_description TEXT,
  parent_category_id INTEGER REFERENCES marketplace_categories(id),
  
  -- Display Settings
  icon_url VARCHAR(500),
  banner_image_url VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  
  -- SEO
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  
  -- Category Rules
  commission_rate DECIMAL(5,4) DEFAULT 0.1500, -- 15% default
  minimum_price DECIMAL(10,2),
  maximum_price DECIMAL(10,2),
  allowed_features TEXT, -- JSON array of allowed features
  required_documents TEXT, -- JSON array of required documents
  
  -- Performance Metrics
  total_vehicles INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create featured listings table
CREATE TABLE IF NOT EXISTS featured_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Listing Information
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Feature Settings
  feature_type VARCHAR(30) NOT NULL, -- 'homepage', 'category', 'search_results', 'island_spotlight'
  feature_position INTEGER DEFAULT 1, -- Position in featured list
  feature_duration_days INTEGER DEFAULT 7,
  
  -- Targeting
  target_islands TEXT, -- JSON array of islands where featured
  target_categories TEXT, -- JSON array of categories where featured
  target_audience VARCHAR(50), -- 'all', 'new_users', 'returning_users', 'premium_users'
  
  -- Pricing
  feature_price DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  payment_reference VARCHAR(100),
  
  -- Performance Tracking
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  click_through_rate DECIMAL(6,4) DEFAULT 0,
  conversion_rate DECIMAL(6,4) DEFAULT 0,
  
  -- Status and Scheduling
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'expired', 'cancelled'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create marketplace promotions table
CREATE TABLE IF NOT EXISTS marketplace_promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Promotion Information
  promotion_name VARCHAR(255) NOT NULL,
  promotion_code VARCHAR(50) UNIQUE,
  promotion_description TEXT,
  promotion_type VARCHAR(30) NOT NULL, -- 'discount', 'free_feature', 'cashback', 'upgrade'
  
  -- Discount Configuration
  discount_type VARCHAR(20), -- 'percentage', 'fixed_amount', 'free_days'
  discount_value DECIMAL(10,2),
  minimum_booking_value DECIMAL(10,2),
  maximum_discount_amount DECIMAL(10,2),
  
  -- Applicability
  applicable_to VARCHAR(30) DEFAULT 'all', -- 'all', 'new_hosts', 'existing_hosts', 'specific_hosts'
  applicable_hosts TEXT, -- JSON array of specific host IDs
  applicable_categories TEXT, -- JSON array of applicable categories
  applicable_islands TEXT, -- JSON array of applicable islands
  
  -- Usage Limits
  usage_limit_total INTEGER, -- Total usage limit
  usage_limit_per_host INTEGER, -- Per-host usage limit
  current_usage_count INTEGER DEFAULT 0,
  
  -- Timing
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  
  -- Conditions
  requires_minimum_rating DECIMAL(3,2),
  requires_verification_level VARCHAR(20),
  requires_superhost_status BOOLEAN DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create promotion usage tracking table
CREATE TABLE IF NOT EXISTS promotion_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  promotion_id INTEGER NOT NULL REFERENCES marketplace_promotions(id) ON DELETE CASCADE,
  host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Usage Information
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  booking_id INTEGER REFERENCES bookings(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  
  -- Discount Applied
  original_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'applied', -- 'applied', 'refunded', 'cancelled'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_host_storefronts_slug ON host_storefronts(storefront_slug);
CREATE INDEX IF NOT EXISTS idx_host_storefronts_host ON host_storefronts(host_id, is_public);
CREATE INDEX IF NOT EXISTS idx_host_storefronts_featured ON host_storefronts(is_featured, approval_status);
CREATE INDEX IF NOT EXISTS idx_host_storefronts_approval ON host_storefronts(approval_status, created_at);

CREATE INDEX IF NOT EXISTS idx_storefront_sections_storefront ON storefront_sections(storefront_id, display_order);
CREATE INDEX IF NOT EXISTS idx_storefront_sections_type ON storefront_sections(section_type, is_visible);

CREATE INDEX IF NOT EXISTS idx_storefront_analytics_storefront_date ON storefront_analytics(storefront_id, date, hour);
CREATE INDEX IF NOT EXISTS idx_storefront_analytics_date ON storefront_analytics(date, hour);

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_parent ON marketplace_categories(parent_category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_slug ON marketplace_categories(category_slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_featured ON marketplace_categories(is_featured, is_active);

CREATE INDEX IF NOT EXISTS idx_featured_listings_vehicle ON featured_listings(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_featured_listings_host ON featured_listings(host_id, status);
CREATE INDEX IF NOT EXISTS idx_featured_listings_type ON featured_listings(feature_type, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_featured_listings_dates ON featured_listings(start_date, end_date, status);

CREATE INDEX IF NOT EXISTS idx_marketplace_promotions_code ON marketplace_promotions(promotion_code);
CREATE INDEX IF NOT EXISTS idx_marketplace_promotions_dates ON marketplace_promotions(start_date, end_date, is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_promotions_type ON marketplace_promotions(promotion_type, is_active);

CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON promotion_usage(promotion_id, used_at);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_host ON promotion_usage(host_id, used_at);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_booking ON promotion_usage(booking_id);