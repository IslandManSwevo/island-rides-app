ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS transfi_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS preferred_payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(10) DEFAULT 'USD';

CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);