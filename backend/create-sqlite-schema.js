const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'island-rides.db');
const db = new Database(dbPath);

const baseSchema = `
-- Core Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    email_verified INTEGER DEFAULT 0,
    email_verification_token TEXT,
    email_verification_expires TEXT,
    password_reset_token TEXT,
    password_reset_expires TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table with Advanced Features
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    location TEXT NOT NULL,
    daily_rate REAL NOT NULL,
    weekly_rate REAL,
    monthly_rate REAL,
    security_deposit REAL,
    minimum_rental_days INTEGER DEFAULT 1,
    available INTEGER DEFAULT 1,
    drive_side TEXT DEFAULT 'LHD',
    
    -- Advanced vehicle specifications
    vehicle_type TEXT,
    engine_type TEXT,
    fuel_type TEXT,
    transmission_type TEXT,
    seating_capacity INTEGER,
    doors INTEGER,
    fuel_efficiency TEXT,
    color TEXT,
    license_plate TEXT,
    vin TEXT,
    mileage INTEGER,
    
    -- Condition and verification
    condition_rating INTEGER,
    verification_status TEXT DEFAULT 'pending',
    verification_notes TEXT,
    last_inspection_date TEXT,
    
    -- Service options
    delivery_available INTEGER DEFAULT 0,
    delivery_radius INTEGER DEFAULT 10,
    delivery_fee REAL DEFAULT 0,
    airport_pickup INTEGER DEFAULT 0,
    airport_pickup_fee REAL DEFAULT 0,
    
    -- Maintenance tracking
    last_maintenance_date TEXT,
    next_maintenance_date TEXT,
    maintenance_notes TEXT,
    
    -- Insurance and safety
    insurance_coverage TEXT,
    insurance_expiry TEXT,
    safety_features TEXT, -- JSON array
    
    -- Ratings and reviews
    average_rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    
    -- Additional info
    description TEXT,
    house_rules TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Photos
CREATE TABLE IF NOT EXISTS vehicle_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type TEXT DEFAULT 'exterior',
    is_primary INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    caption TEXT,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Feature Categories
CREATE TABLE IF NOT EXISTS vehicle_feature_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Features
CREATE TABLE IF NOT EXISTS vehicle_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES vehicle_feature_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    is_premium INTEGER DEFAULT 0,
    additional_cost REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Feature Assignments
CREATE TABLE IF NOT EXISTS vehicle_feature_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES vehicle_features(id),
    is_included INTEGER DEFAULT 1,
    additional_cost REAL DEFAULT 0,
    notes TEXT,
    assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, feature_id)
);

-- Vehicle Amenities
CREATE TABLE IF NOT EXISTS vehicle_amenities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    is_available INTEGER DEFAULT 1,
    additional_cost REAL DEFAULT 0,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Availability Windows
CREATE TABLE IF NOT EXISTS vehicle_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    available_from TEXT NOT NULL,
    available_to TEXT NOT NULL,
    is_blocked INTEGER DEFAULT 0,
    block_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Damage Reports
CREATE TABLE IF NOT EXISTS vehicle_damage_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER REFERENCES vehicles(id),
    reported_by INTEGER REFERENCES users(id),
    damage_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_urls TEXT, -- JSON array
    repair_cost REAL,
    repair_status TEXT DEFAULT 'pending',
    reported_at TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT
);

-- Vehicle Maintenance Records
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER REFERENCES vehicles(id),
    maintenance_type TEXT NOT NULL,
    description TEXT,
    cost REAL,
    performed_by TEXT,
    performed_at TEXT NOT NULL,
    next_due_date TEXT,
    mileage_at_service INTEGER,
    notes TEXT,
    receipts TEXT, -- JSON array of receipt URLs
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER REFERENCES vehicles(id),
    renter_id INTEGER REFERENCES users(id),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_cost REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    
    -- Payment information
    payment_intent_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_failure_reason TEXT,
    paid_at TEXT,
    
    -- Booking details
    pickup_location TEXT,
    dropoff_location TEXT,
    delivery_requested INTEGER DEFAULT 0,
    airport_pickup_requested INTEGER DEFAULT 0,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER REFERENCES bookings(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    reviewer_id INTEGER REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photos TEXT, -- JSON array
    is_verified INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    moderation_status TEXT DEFAULT 'pending',
    moderation_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Conversations and Messages
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant_1_id, participant_2_id),
    CHECK (participant_1_id != participant_2_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    read_at TEXT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(available);
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle ON vehicle_photos(vehicle_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_vehicle_features_category ON vehicle_features(category_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_feature_assignments_vehicle ON vehicle_feature_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vehicle ON reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

// Insert default feature categories and features
const defaultData = `
-- Insert default feature categories
INSERT OR IGNORE INTO vehicle_feature_categories (id, name, display_name, description, icon_name, sort_order) VALUES
(1, 'comfort', 'Comfort & Convenience', 'Features that enhance passenger comfort', 'car-seat', 1),
(2, 'technology', 'Technology', 'Modern tech features and connectivity', 'phone', 2),
(3, 'safety', 'Safety & Security', 'Safety and security features', 'shield', 3),
(4, 'performance', 'Performance', 'Engine and performance features', 'speedometer', 4),
(5, 'exterior', 'Exterior Features', 'External vehicle features', 'car', 5);

-- Insert default features
INSERT OR IGNORE INTO vehicle_features (category_id, name, description, icon_name, is_premium, additional_cost) VALUES
-- Comfort features
(1, 'Air Conditioning', 'Climate control for passenger comfort', 'snowflake', 0, 0),
(1, 'Heated Seats', 'Seat heating for cold weather', 'fire', 1, 5),
(1, 'Leather Seats', 'Premium leather upholstery', 'badge', 1, 10),
(1, 'Power Windows', 'Electric window controls', 'maximize', 0, 0),
(1, 'Sunroof', 'Panoramic or standard sunroof', 'sun', 1, 15),

-- Technology features
(2, 'Bluetooth', 'Wireless phone and audio connectivity', 'bluetooth', 0, 0),
(2, 'GPS Navigation', 'Built-in navigation system', 'navigation', 0, 0),
(2, 'USB Charging', 'USB ports for device charging', 'usb', 0, 0),
(2, 'Backup Camera', 'Rear-view camera for parking', 'camera', 0, 0),
(2, 'Apple CarPlay', 'Apple CarPlay integration', 'smartphone', 1, 5),
(2, 'Premium Audio', 'High-quality sound system', 'volume-2', 1, 8),

-- Safety features
(3, 'Anti-lock Brakes', 'ABS braking system', 'shield', 0, 0),
(3, 'Airbags', 'Full airbag system', 'shield', 0, 0),
(3, 'Stability Control', 'Electronic stability control', 'disc', 0, 0),
(3, 'Traction Control', 'Anti-slip traction system', 'settings', 0, 0),
(3, 'Blind Spot Monitor', 'Blind spot detection system', 'eye', 1, 10),
(3, 'Lane Departure Warning', 'Lane departure alert system', 'alert-triangle', 1, 10),

-- Performance features
(4, 'Turbo Engine', 'Turbocharged engine', 'zap', 1, 20),
(4, 'All-Wheel Drive', '4WD/AWD capability', 'truck', 1, 25),
(4, 'Sport Mode', 'Performance driving mode', 'gauge', 1, 15),
(4, 'Remote Start', 'Remote engine start', 'key', 1, 5),

-- Exterior features
(5, 'LED Headlights', 'Energy-efficient LED lighting', 'lightbulb', 1, 5),
(5, 'Fog Lights', 'Additional fog lighting', 'circle', 0, 0),
(5, 'Roof Rack', 'Cargo carrying capability', 'package', 0, 0),
(5, 'Tinted Windows', 'Privacy window tinting', 'square', 1, 8);

-- Insert sample users
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role) VALUES
('john@example.com', '$2a$10$example.hash.for.password123', 'John', 'Doe', 'customer'),
('jane@example.com', '$2a$10$example.hash.for.password456', 'Jane', 'Smith', 'owner');
`;

try {
  console.log('Creating SQLite database schema...');
  db.exec(baseSchema);
  console.log('✅ Base schema created');
  
  console.log('Inserting default data...');
  db.exec(defaultData);
  console.log('✅ Default data inserted');
  
  console.log('🎉 Database setup completed successfully!');
} catch (error) {
  console.error('❌ Database setup failed:', error);
} finally {
  db.close();
} 