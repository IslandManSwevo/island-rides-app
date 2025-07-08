-- Phase 2: Advanced Vehicle Features Migration
-- Adds comprehensive vehicle specifications, amenities, and media support

-- Add advanced vehicle specification columns
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50) DEFAULT 'gasoline';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission_type VARCHAR(50) DEFAULT 'automatic';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seating_capacity INTEGER DEFAULT 5;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS doors INTEGER DEFAULT 4;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_efficiency VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'sedan';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vin VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mileage INTEGER DEFAULT 0;

-- Add pricing and availability enhancements
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS weekly_rate DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10,2) DEFAULT 200.00;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS minimum_rental_days INTEGER DEFAULT 1;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS maximum_rental_days INTEGER DEFAULT 30;

-- Add vehicle condition and verification
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS condition_rating INTEGER DEFAULT 5 CHECK (condition_rating >= 1 AND condition_rating <= 5);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_inspection_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS next_service_due DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_expires DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add location and delivery options
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS delivery_radius INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS airport_pickup BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS airport_pickup_fee DECIMAL(10,2) DEFAULT 0.00;

-- Create vehicle amenities table
CREATE TABLE IF NOT EXISTS vehicle_amenities (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    amenity_type VARCHAR(50) NOT NULL,
    amenity_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_standard BOOLEAN DEFAULT false,
    additional_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicle photos table for enhanced media support
CREATE TABLE IF NOT EXISTS vehicle_photos (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50) DEFAULT 'exterior', -- exterior, interior, engine, dashboard, etc.
    display_order INTEGER DEFAULT 0,
    caption TEXT,
    is_primary BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicle availability calendar
CREATE TABLE IF NOT EXISTS vehicle_availability (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    price_override DECIMAL(10,2), -- Special pricing for specific dates
    reason VARCHAR(255), -- maintenance, booked, holiday_pricing, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, date)
);

-- Create vehicle maintenance records
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT,
    cost DECIMAL(10,2),
    service_provider VARCHAR(255),
    scheduled_date DATE,
    completed_date DATE,
    mileage_at_service INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicle damage reports
CREATE TABLE IF NOT EXISTS vehicle_damage_reports (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id),
    reported_by INTEGER REFERENCES users(id),
    damage_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'minor', -- minor, moderate, major
    repair_cost DECIMAL(10,2),
    photos JSONB, -- Array of photo URLs
    insurance_claim_number VARCHAR(100),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicle feature categories for standardized amenities
CREATE TABLE IF NOT EXISTS vehicle_feature_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50), -- For UI icons
    display_order INTEGER DEFAULT 0
);

-- Create standardized vehicle features
CREATE TABLE IF NOT EXISTS vehicle_features (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES vehicle_feature_categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    is_premium BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0
);

-- Junction table for vehicle-feature relationships
CREATE TABLE IF NOT EXISTS vehicle_feature_assignments (
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES vehicle_features(id) ON DELETE CASCADE,
    is_included BOOLEAN DEFAULT true,
    additional_cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    PRIMARY KEY (vehicle_id, feature_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_price_range ON vehicles(daily_rate);
CREATE INDEX IF NOT EXISTS idx_vehicles_seating ON vehicles(seating_capacity);
CREATE INDEX IF NOT EXISTS idx_vehicles_verification ON vehicles(verification_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_coordinates ON vehicles(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_vehicle_amenities_vehicle ON vehicle_amenities(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_amenities_type ON vehicle_amenities(amenity_type);

CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle ON vehicle_photos(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_primary ON vehicle_photos(is_primary);

CREATE INDEX IF NOT EXISTS idx_vehicle_availability_vehicle_date ON vehicle_availability(vehicle_id, date);
CREATE INDEX IF NOT EXISTS idx_vehicle_availability_date ON vehicle_availability(date);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_date ON vehicle_maintenance(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_damage_vehicle ON vehicle_damage_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_damage_booking ON vehicle_damage_reports(booking_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_feature_assignments_vehicle ON vehicle_feature_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_feature_assignments_feature ON vehicle_feature_assignments(feature_id);

-- Insert standard feature categories
INSERT INTO vehicle_feature_categories (name, description, icon_name, display_order) VALUES
('Comfort', 'Interior comfort and convenience features', 'armchair', 1),
('Technology', 'Entertainment and connectivity features', 'smartphone', 2),
('Safety', 'Safety and security features', 'shield-check', 3),
('Performance', 'Engine and driving performance features', 'gauge', 4),
('Convenience', 'Practical convenience features', 'tools', 5),
('Exterior', 'Exterior and styling features', 'car', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert standard vehicle features
INSERT INTO vehicle_features (category_id, name, description, icon_name, is_premium, display_order) VALUES
-- Comfort features
((SELECT id FROM vehicle_feature_categories WHERE name = 'Comfort'), 'Air Conditioning', 'Climate control system', 'snowflake', false, 1),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Comfort'), 'Heated Seats', 'Front seat heating', 'fire', true, 2),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Comfort'), 'Leather Seats', 'Premium leather seating', 'badge', true, 3),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Comfort'), 'Power Seats', 'Electrically adjustable seats', 'maximize', true, 4),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Comfort'), 'Sunroof', 'Panoramic or standard sunroof', 'sun', true, 5),

-- Technology features
((SELECT id FROM vehicle_feature_categories WHERE name = 'Technology'), 'Bluetooth', 'Wireless device connectivity', 'bluetooth', false, 1),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Technology'), 'GPS Navigation', 'Built-in navigation system', 'navigation', false, 2),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Technology'), 'USB Charging', 'USB ports for device charging', 'usb', false, 3),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Technology'), 'Backup Camera', 'Rear-view camera system', 'camera', false, 4),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Technology'), 'Apple CarPlay', 'Apple CarPlay integration', 'smartphone', true, 5),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Technology'), 'Android Auto', 'Android Auto integration', 'smartphone', true, 6),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Technology'), 'Premium Sound', 'High-quality audio system', 'volume-2', true, 7),

-- Safety features
((SELECT id FROM vehicle_feature_categories WHERE name = 'Safety'), 'Airbags', 'Multiple safety airbags', 'shield', false, 1),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Safety'), 'Anti-lock Brakes', 'ABS braking system', 'disc', false, 2),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Safety'), 'Traction Control', 'Electronic stability control', 'settings', false, 3),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Safety'), 'Blind Spot Monitor', 'Blind spot detection system', 'eye', true, 4),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Safety'), 'Lane Departure', 'Lane departure warning', 'alert-triangle', true, 5),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Safety'), 'Automatic Emergency Braking', 'Collision avoidance system', 'zap', true, 6),

-- Performance features
((SELECT id FROM vehicle_feature_categories WHERE name = 'Performance'), 'All-Wheel Drive', 'AWD or 4WD capability', 'truck', true, 1),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Performance'), 'Turbo Engine', 'Turbocharged engine', 'zap', true, 2),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Performance'), 'Sport Mode', 'Performance driving mode', 'gauge', true, 3),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Performance'), 'Manual Transmission', 'Manual gear transmission', 'settings', false, 4),

-- Convenience features
((SELECT id FROM vehicle_feature_categories WHERE name = 'Convenience'), 'Keyless Entry', 'Push-button start and keyless entry', 'key', false, 1),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Convenience'), 'Remote Start', 'Remote engine start capability', 'power', true, 2),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Convenience'), 'Cruise Control', 'Speed control system', 'gauge', false, 3),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Convenience'), 'Power Windows', 'Electric window controls', 'maximize', false, 4),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Convenience'), 'Automatic Lights', 'Automatic headlight control', 'lightbulb', false, 5),

-- Exterior features
((SELECT id FROM vehicle_feature_categories WHERE name = 'Exterior'), 'Alloy Wheels', 'Premium alloy wheel rims', 'circle', true, 1),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Exterior'), 'Roof Rack', 'Cargo carrying roof rack', 'package', false, 2),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Exterior'), 'Tinted Windows', 'Privacy window tinting', 'square', false, 3),
((SELECT id FROM vehicle_feature_categories WHERE name = 'Exterior'), 'LED Headlights', 'LED lighting system', 'lightbulb', true, 4)
ON CONFLICT DO NOTHING; 