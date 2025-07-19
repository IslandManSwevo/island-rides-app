-- Migration: Add PayPal integration support
-- Add payment_provider column to track which payment service was used

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) DEFAULT 'transfi';

-- Update existing bookings to have transfi as provider
UPDATE bookings SET payment_provider = 'transfi' WHERE payment_provider IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_provider ON bookings(payment_provider);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Add PayPal-specific payment tracking table
CREATE TABLE IF NOT EXISTS paypal_transactions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  paypal_order_id VARCHAR(100) UNIQUE NOT NULL,
  paypal_capture_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for PayPal transactions
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_booking_id ON paypal_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_order_id ON paypal_transactions(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_status ON paypal_transactions(status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_paypal_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_paypal_transactions_updated_at ON paypal_transactions;
CREATE TRIGGER trigger_update_paypal_transactions_updated_at
  BEFORE UPDATE ON paypal_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_paypal_transactions_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN bookings.payment_provider IS 'Payment service provider: transfi, paypal';
COMMENT ON TABLE paypal_transactions IS 'Tracks PayPal-specific transaction details';
COMMENT ON COLUMN paypal_transactions.paypal_order_id IS 'PayPal order ID from PayPal API';
COMMENT ON COLUMN paypal_transactions.paypal_capture_id IS 'PayPal capture ID after successful payment';