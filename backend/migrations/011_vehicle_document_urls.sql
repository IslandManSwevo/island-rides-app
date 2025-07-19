-- Migration 011: Add document URL columns to vehicles table
-- Adds columns for storing vehicle title and insurance document URLs

-- Add document URL columns to vehicles table (SQLite compatible)
ALTER TABLE vehicles ADD COLUMN title_document_url TEXT;
ALTER TABLE vehicles ADD COLUMN insurance_document_url TEXT;

-- Add indexes for document URLs
CREATE INDEX IF NOT EXISTS idx_vehicles_title_document ON vehicles(title_document_url);
CREATE INDEX IF NOT EXISTS idx_vehicles_insurance_document ON vehicles(insurance_document_url);