-- Migration 014: Vehicle Documents Management System
-- Adds comprehensive document management for vehicles and hosts

-- Create vehicle documents table
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Document Information
  document_type VARCHAR(50) NOT NULL, -- 'registration', 'insurance', 'inspection', 'license', 'permit', 'maintenance', 'warranty'
  document_name VARCHAR(255) NOT NULL,
  document_description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER, -- in bytes
  file_type VARCHAR(50), -- 'pdf', 'jpg', 'png', etc.
  
  -- Document Details
  document_number VARCHAR(100),
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  renewal_required BOOLEAN DEFAULT 0,
  renewal_reminder_sent BOOLEAN DEFAULT 0,
  
  -- Verification Status
  verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'expired'
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  rejection_reason TEXT,
  
  -- Document Categories and Tags
  category VARCHAR(50), -- 'legal', 'safety', 'maintenance', 'insurance', 'operational'
  tags TEXT, -- JSON array of tags
  is_required BOOLEAN DEFAULT 0,
  is_public BOOLEAN DEFAULT 0, -- Whether document info (not file) can be shown to renters
  
  -- Version Control
  version INTEGER DEFAULT 1,
  previous_document_id INTEGER REFERENCES vehicle_documents(id),
  is_current_version BOOLEAN DEFAULT 1,
  
  -- Compliance and Legal
  compliance_status VARCHAR(20) DEFAULT 'compliant', -- 'compliant', 'non_compliant', 'pending_review'
  legal_requirements_met BOOLEAN DEFAULT 1,
  regulatory_notes TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create host documents table (for host-level documents)
CREATE TABLE IF NOT EXISTS host_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Document Information
  document_type VARCHAR(50) NOT NULL, -- 'business_license', 'tax_certificate', 'insurance_policy', 'identity', 'address_proof', 'bank_statement'
  document_name VARCHAR(255) NOT NULL,
  document_description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  
  -- Document Details
  document_number VARCHAR(100),
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  renewal_required BOOLEAN DEFAULT 0,
  renewal_reminder_sent BOOLEAN DEFAULT 0,
  
  -- Verification Status
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  rejection_reason TEXT,
  
  -- Document Categories
  category VARCHAR(50), -- 'identity', 'business', 'financial', 'legal', 'insurance'
  is_required BOOLEAN DEFAULT 0,
  is_sensitive BOOLEAN DEFAULT 1, -- Contains sensitive personal/business information
  
  -- Version Control
  version INTEGER DEFAULT 1,
  previous_document_id INTEGER REFERENCES host_documents(id),
  is_current_version BOOLEAN DEFAULT 1,
  
  -- Compliance
  compliance_status VARCHAR(20) DEFAULT 'compliant',
  legal_requirements_met BOOLEAN DEFAULT 1,
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document verification workflow table
CREATE TABLE IF NOT EXISTS document_verification_workflow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Document Reference (polymorphic)
  document_type VARCHAR(20) NOT NULL, -- 'vehicle_document', 'host_document'
  document_id INTEGER NOT NULL,
  
  -- Workflow Information
  workflow_step VARCHAR(50) NOT NULL, -- 'uploaded', 'auto_scan', 'manual_review', 'approved', 'rejected'
  workflow_status VARCHAR(20) NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
  assigned_to INTEGER REFERENCES users(id), -- Admin/reviewer assigned
  
  -- Processing Details
  processing_method VARCHAR(30), -- 'automatic', 'manual', 'hybrid'
  ai_confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
  ai_extracted_data TEXT, -- JSON object with extracted information
  manual_review_required BOOLEAN DEFAULT 0,
  
  -- Review Information
  reviewer_notes TEXT,
  review_checklist TEXT, -- JSON object with checklist items
  quality_score INTEGER, -- 1-10 rating for document quality
  
  -- Processing Time Tracking
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  processing_duration_seconds INTEGER,
  
  -- Audit Trail
  previous_step_id INTEGER REFERENCES document_verification_workflow(id),
  next_step_id INTEGER REFERENCES document_verification_workflow(id),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document templates table (for required documents by region/vehicle type)
CREATE TABLE IF NOT EXISTS document_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Template Information
  template_name VARCHAR(255) NOT NULL,
  template_description TEXT,
  document_type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  
  -- Applicability Rules
  applies_to VARCHAR(20) NOT NULL, -- 'vehicle', 'host', 'both'
  vehicle_types TEXT, -- JSON array of applicable vehicle types
  regions TEXT, -- JSON array of applicable regions/islands
  business_types TEXT, -- JSON array of applicable business types
  
  -- Requirements
  is_required BOOLEAN DEFAULT 1,
  is_renewable BOOLEAN DEFAULT 1,
  renewal_period_days INTEGER, -- How often renewal is required
  reminder_days_before_expiry INTEGER DEFAULT 30,
  
  -- Validation Rules
  validation_rules TEXT, -- JSON object with validation criteria
  required_fields TEXT, -- JSON array of required document fields
  file_type_restrictions TEXT, -- JSON array of allowed file types
  max_file_size_mb INTEGER DEFAULT 10,
  
  -- Help and Guidance
  upload_instructions TEXT,
  example_document_url VARCHAR(500),
  help_text TEXT,
  common_rejection_reasons TEXT, -- JSON array
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  effective_date DATE,
  end_date DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document access log for audit purposes
CREATE TABLE IF NOT EXISTS document_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Document Reference
  document_type VARCHAR(20) NOT NULL, -- 'vehicle_document', 'host_document'
  document_id INTEGER NOT NULL,
  
  -- Access Information
  accessed_by INTEGER NOT NULL REFERENCES users(id),
  access_type VARCHAR(30) NOT NULL, -- 'view', 'download', 'update', 'delete', 'verify'
  access_reason VARCHAR(100), -- 'booking_verification', 'compliance_check', 'support_request'
  
  -- Technical Details
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(100),
  
  -- Audit Information
  success BOOLEAN DEFAULT 1,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle ON vehicle_documents(vehicle_id, document_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_host ON vehicle_documents(host_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_expiry ON vehicle_documents(expiry_date, renewal_required);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_verification ON vehicle_documents(verification_status, created_at);

CREATE INDEX IF NOT EXISTS idx_host_documents_host ON host_documents(host_id, document_type);
CREATE INDEX IF NOT EXISTS idx_host_documents_verification ON host_documents(verification_status, created_at);
CREATE INDEX IF NOT EXISTS idx_host_documents_expiry ON host_documents(expiry_date, renewal_required);

CREATE INDEX IF NOT EXISTS idx_document_verification_workflow_document ON document_verification_workflow(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_document_verification_workflow_status ON document_verification_workflow(workflow_status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_document_verification_workflow_step ON document_verification_workflow(workflow_step, created_at);

CREATE INDEX IF NOT EXISTS idx_document_templates_applies ON document_templates(applies_to, is_active);
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(document_type, category);

CREATE INDEX IF NOT EXISTS idx_document_access_log_document ON document_access_log(document_type, document_id, created_at);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user ON document_access_log(accessed_by, access_type, created_at);