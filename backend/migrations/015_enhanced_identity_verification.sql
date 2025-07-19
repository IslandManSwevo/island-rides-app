-- Migration 015: Enhanced User Identity Verification System
-- Extends the existing verification system with comprehensive identity verification

-- Extend user_verifications table with enhanced identity verification fields
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS government_id_type VARCHAR(50); -- 'passport', 'drivers_license', 'national_id', 'voter_id'
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS government_id_number VARCHAR(100);
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS government_id_expiry DATE;
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS government_id_country VARCHAR(3); -- ISO country code
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS government_id_verified BOOLEAN DEFAULT 0;
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS government_id_verified_at TIMESTAMP;

-- Add biometric verification fields
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS facial_verification_completed BOOLEAN DEFAULT 0;
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS facial_verification_at TIMESTAMP;
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS facial_match_confidence DECIMAL(5,4); -- 0.0000 to 1.0000
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS liveness_check_passed BOOLEAN DEFAULT 0;

-- Add address verification enhancements
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS address_verification_method VARCHAR(30); -- 'utility_bill', 'bank_statement', 'lease_agreement', 'government_mail'
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS address_verification_confidence DECIMAL(5,4);
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS address_country VARCHAR(3);
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS address_region VARCHAR(100);
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(20);

-- Add enhanced verification tracking
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS verification_provider VARCHAR(50); -- 'jumio', 'onfido', 'manual', 'internal'
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS verification_session_id VARCHAR(100);
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS verification_reference_number VARCHAR(100);
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS manual_review_required BOOLEAN DEFAULT 0;
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS manual_review_reason TEXT;
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);
ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Create identity verification sessions table
CREATE TABLE IF NOT EXISTS identity_verification_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session Information
  session_id VARCHAR(100) NOT NULL UNIQUE,
  verification_type VARCHAR(30) NOT NULL, -- 'identity', 'address', 'facial', 'document'
  provider VARCHAR(50) NOT NULL, -- 'jumio', 'onfido', 'manual'
  
  -- Session Status
  status VARCHAR(20) DEFAULT 'initiated', -- 'initiated', 'in_progress', 'completed', 'failed', 'expired'
  completion_percentage INTEGER DEFAULT 0,
  
  -- Verification Data
  submitted_documents TEXT, -- JSON array of document types submitted
  extracted_data TEXT, -- JSON object with extracted information
  verification_checks TEXT, -- JSON object with check results
  confidence_scores TEXT, -- JSON object with confidence scores for different checks
  
  -- Results
  overall_result VARCHAR(20), -- 'passed', 'failed', 'manual_review'
  failure_reasons TEXT, -- JSON array of failure reasons
  recommendations TEXT, -- JSON array of recommendations for improvement
  
  -- Technical Details
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  geolocation TEXT, -- JSON object with lat/lng
  
  -- Timestamps
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create verification documents table (separate from vehicle/host documents)
CREATE TABLE IF NOT EXISTS verification_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES identity_verification_sessions(id),
  
  -- Document Information
  document_type VARCHAR(50) NOT NULL, -- 'government_id_front', 'government_id_back', 'selfie', 'utility_bill', 'bank_statement'
  document_category VARCHAR(30) NOT NULL, -- 'identity', 'address', 'biometric'
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  
  -- Processing Status
  processing_status VARCHAR(20) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'processed', 'failed'
  processing_provider VARCHAR(50),
  processing_reference VARCHAR(100),
  
  -- Extracted Data
  extracted_text TEXT, -- OCR extracted text
  extracted_data TEXT, -- JSON object with structured data
  quality_score DECIMAL(5,4), -- Document quality score
  authenticity_score DECIMAL(5,4), -- Document authenticity score
  
  -- Verification Results
  verification_passed BOOLEAN DEFAULT 0,
  verification_confidence DECIMAL(5,4),
  verification_issues TEXT, -- JSON array of issues found
  
  -- Security and Compliance
  encrypted_at_rest BOOLEAN DEFAULT 1,
  retention_period_days INTEGER DEFAULT 2555, -- 7 years default
  deletion_scheduled_at TIMESTAMP,
  
  -- Audit Trail
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create verification audit log
CREATE TABLE IF NOT EXISTS verification_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Action Information
  action_type VARCHAR(50) NOT NULL, -- 'verification_started', 'document_uploaded', 'verification_completed', 'manual_review', 'status_changed'
  action_description TEXT NOT NULL,
  action_result VARCHAR(20), -- 'success', 'failure', 'pending'
  
  -- Context
  session_id INTEGER REFERENCES identity_verification_sessions(id),
  document_id INTEGER REFERENCES verification_documents(id),
  performed_by INTEGER REFERENCES users(id), -- Admin who performed action (if applicable)
  
  -- Technical Details
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Data Changes
  old_values TEXT, -- JSON object with previous values
  new_values TEXT, -- JSON object with new values
  
  -- Compliance
  compliance_notes TEXT,
  regulatory_requirement VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create verification requirements table (configurable requirements by region/user type)
CREATE TABLE IF NOT EXISTS verification_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Requirement Definition
  requirement_name VARCHAR(100) NOT NULL,
  requirement_description TEXT,
  requirement_type VARCHAR(30) NOT NULL, -- 'identity', 'address', 'financial', 'background'
  
  -- Applicability
  user_roles TEXT, -- JSON array of applicable user roles
  regions TEXT, -- JSON array of applicable regions
  business_types TEXT, -- JSON array of applicable business types
  
  -- Requirement Details
  is_mandatory BOOLEAN DEFAULT 1,
  verification_level VARCHAR(20) DEFAULT 'standard', -- 'basic', 'standard', 'enhanced'
  required_documents TEXT, -- JSON array of required document types
  alternative_documents TEXT, -- JSON array of alternative document types
  
  -- Validation Rules
  minimum_confidence_score DECIMAL(5,4) DEFAULT 0.8000,
  requires_manual_review BOOLEAN DEFAULT 0,
  expiry_period_days INTEGER, -- How long verification is valid
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  effective_date DATE,
  end_date DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_identity_verification_sessions_user ON identity_verification_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_identity_verification_sessions_session ON identity_verification_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_identity_verification_sessions_status ON identity_verification_sessions(status, created_at);

CREATE INDEX IF NOT EXISTS idx_verification_documents_user ON verification_documents(user_id, document_type);
CREATE INDEX IF NOT EXISTS idx_verification_documents_session ON verification_documents(session_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_verification_documents_processing ON verification_documents(processing_status, created_at);

CREATE INDEX IF NOT EXISTS idx_verification_audit_log_user ON verification_audit_log(user_id, action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_session ON verification_audit_log(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_action ON verification_audit_log(action_type, created_at);

CREATE INDEX IF NOT EXISTS idx_verification_requirements_active ON verification_requirements(is_active, requirement_type);
CREATE INDEX IF NOT EXISTS idx_verification_requirements_type ON verification_requirements(requirement_type, verification_level);

-- Add new indexes to existing user_verifications table
CREATE INDEX IF NOT EXISTS idx_user_verifications_government_id ON user_verifications(government_id_verified, government_id_expiry);
CREATE INDEX IF NOT EXISTS idx_user_verifications_facial ON user_verifications(facial_verification_completed, facial_match_confidence);
CREATE INDEX IF NOT EXISTS idx_user_verifications_provider ON user_verifications(verification_provider, overall_verification_status);