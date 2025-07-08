-- Owner Dashboard Analytics and Financial Tracking Migration

-- Table for tracking revenue and booking analytics
CREATE TABLE IF NOT EXISTS owner_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  date DATE NOT NULL,
  
  -- Booking metrics
  total_bookings INTEGER DEFAULT 0,
  confirmed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  
  -- Revenue metrics
  gross_revenue DECIMAL(10,2) DEFAULT 0.00,
  net_revenue DECIMAL(10,2) DEFAULT 0.00,
  platform_fees DECIMAL(10,2) DEFAULT 0.00,
  
  -- Occupancy metrics
  available_days INTEGER DEFAULT 0,
  booked_days INTEGER DEFAULT 0,
  occupancy_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Performance metrics
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0.00,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for financial payouts and earnings
CREATE TABLE IF NOT EXISTS owner_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Payout details
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  gross_earnings DECIMAL(10,2) NOT NULL,
  platform_fees DECIMAL(10,2) NOT NULL,
  net_payout DECIMAL(10,2) NOT NULL,
  
  -- Transaction details
  transaction_id VARCHAR(255),
  payment_method VARCHAR(100),
  payout_date DATE,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  
  -- Breakdown
  booking_count INTEGER DEFAULT 0,
  total_days_rented INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for detailed booking earnings
CREATE TABLE IF NOT EXISTS booking_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  owner_id INTEGER NOT NULL REFERENCES users(id),
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  
  -- Earnings breakdown
  subtotal DECIMAL(10,2) NOT NULL,
  taxes DECIMAL(10,2) DEFAULT 0.00,
  platform_fee DECIMAL(10,2) NOT NULL,
  processing_fee DECIMAL(10,2) DEFAULT 0.00,
  owner_earnings DECIMAL(10,2) NOT NULL,
  
  -- Dates
  booking_start_date DATE NOT NULL,
  booking_end_date DATE NOT NULL,
  payout_id INTEGER REFERENCES owner_payouts(id),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for expense tracking
CREATE TABLE IF NOT EXISTS vehicle_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  owner_id INTEGER NOT NULL REFERENCES users(id),
  
  expense_type ENUM('maintenance', 'insurance', 'fuel', 'cleaning', 'repairs', 'registration', 'other') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  
  -- Receipt/documentation
  receipt_url VARCHAR(500),
  tax_deductible BOOLEAN DEFAULT FALSE,
  
  -- Categorization
  category VARCHAR(100),
  subcategory VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for owner goals and targets
CREATE TABLE IF NOT EXISTS owner_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  
  goal_type ENUM('monthly_revenue', 'occupancy_rate', 'rating_target', 'booking_count') NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0.00,
  target_period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  target_date DATE,
  
  status ENUM('active', 'achieved', 'missed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_owner_analytics_owner_date ON owner_analytics(owner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_owner_analytics_vehicle_date ON owner_analytics(vehicle_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_owner_payouts_owner ON owner_payouts(owner_id, payout_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_status ON owner_payouts(status, payout_date);

CREATE INDEX IF NOT EXISTS idx_booking_earnings_owner ON booking_earnings(owner_id, booking_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_booking_earnings_booking ON booking_earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_earnings_payout ON booking_earnings(payout_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_vehicle ON vehicle_expenses(vehicle_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_owner ON vehicle_expenses(owner_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_type ON vehicle_expenses(expense_type);

CREATE INDEX IF NOT EXISTS idx_owner_goals_owner ON owner_goals(owner_id, status);

-- Views for quick analytics
CREATE VIEW IF NOT EXISTS owner_dashboard_summary AS
SELECT 
  u.id as owner_id,
  u.first_name,
  u.last_name,
  COUNT(DISTINCT v.id) as total_vehicles,
  COUNT(DISTINCT CASE WHEN v.available = 1 THEN v.id END) as active_vehicles,
  COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.start_date >= date('now', '-30 days') THEN b.total_amount END), 0) as monthly_revenue,
  COALESCE(AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating END), 0) as average_rating,
  COUNT(DISTINCT CASE WHEN b.status = 'confirmed' AND b.start_date >= date('now', '-30 days') THEN b.id END) as monthly_bookings
FROM users u
LEFT JOIN vehicles v ON u.id = v.owner_id
LEFT JOIN bookings b ON v.id = b.vehicle_id
LEFT JOIN reviews r ON b.id = r.booking_id
WHERE u.role = 'host' OR u.role = 'owner'
GROUP BY u.id, u.first_name, u.last_name; 