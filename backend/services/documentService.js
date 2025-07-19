const { Database } = require('sqlite3');
const path = require('path');
const fs = require('fs');
const db = new Database(path.join(__dirname, '..', 'island-rides.db'));

class DocumentService {
  /**
   * Upload vehicle document
   */
  async uploadVehicleDocument(vehicleId, hostId, documentData) {
    try {
      const query = `
        INSERT INTO vehicle_documents (
          vehicle_id, host_id, document_type, document_name, document_description,
          file_url, file_name, file_size, file_type, document_number, issuing_authority,
          issue_date, expiry_date, renewal_required, category, tags, is_required,
          is_public, version, is_current_version, compliance_status,
          legal_requirements_met, regulatory_notes, uploaded_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const result = await this.runQuery(query, [
        vehicleId,
        hostId,
        documentData.document_type,
        documentData.document_name,
        documentData.document_description,
        documentData.file_url,
        documentData.file_name,
        documentData.file_size,
        documentData.file_type,
        documentData.document_number,
        documentData.issuing_authority,
        documentData.issue_date,
        documentData.expiry_date,
        documentData.renewal_required || 0,
        documentData.category || 'legal',
        JSON.stringify(documentData.tags || []),
        documentData.is_required || 0,
        documentData.is_public || 0,
        documentData.version || 1,
        documentData.is_current_version !== undefined ? documentData.is_current_version : 1,
        documentData.compliance_status || 'compliant',
        documentData.legal_requirements_met !== undefined ? documentData.legal_requirements_met : 1,
        documentData.regulatory_notes
      ]);

      // Create initial verification workflow entry
      await this.createVerificationWorkflow('vehicle_document', result.lastID);

      return { id: result.lastID };
    } catch (error) {
      console.error('Error uploading vehicle document:', error);
      throw error;
    }
  }

  /**
   * Upload host document
   */
  async uploadHostDocument(hostId, documentData) {
    try {
      const query = `
        INSERT INTO host_documents (
          host_id, document_type, document_name, document_description,
          file_url, file_name, file_size, file_type, document_number, issuing_authority,
          issue_date, expiry_date, renewal_required, category, is_required,
          is_sensitive, version, is_current_version, compliance_status,
          legal_requirements_met, uploaded_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const result = await this.runQuery(query, [
        hostId,
        documentData.document_type,
        documentData.document_name,
        documentData.document_description,
        documentData.file_url,
        documentData.file_name,
        documentData.file_size,
        documentData.file_type,
        documentData.document_number,
        documentData.issuing_authority,
        documentData.issue_date,
        documentData.expiry_date,
        documentData.renewal_required || 0,
        documentData.category || 'identity',
        documentData.is_required || 0,
        documentData.is_sensitive !== undefined ? documentData.is_sensitive : 1,
        documentData.version || 1,
        documentData.is_current_version !== undefined ? documentData.is_current_version : 1,
        documentData.compliance_status || 'compliant',
        documentData.legal_requirements_met !== undefined ? documentData.legal_requirements_met : 1
      ]);

      // Create initial verification workflow entry
      await this.createVerificationWorkflow('host_document', result.lastID);

      return { id: result.lastID };
    } catch (error) {
      console.error('Error uploading host document:', error);
      throw error;
    }
  }

  /**
   * Get vehicle documents
   */
  async getVehicleDocuments(vehicleId, hostId = null) {
    try {
      let query = `
        SELECT * FROM vehicle_documents 
        WHERE vehicle_id = ? AND is_current_version = 1
      `;
      const params = [vehicleId];

      if (hostId) {
        query += ` AND host_id = ?`;
        params.push(hostId);
      }

      query += ` ORDER BY document_type, created_at DESC`;

      const results = await this.allQuery(query, params);
      return results.map(doc => ({
        ...doc,
        tags: doc.tags ? JSON.parse(doc.tags) : []
      }));
    } catch (error) {
      console.error('Error fetching vehicle documents:', error);
      throw error;
    }
  }

  /**
   * Get host documents
   */
  async getHostDocuments(hostId, documentType = null) {
    try {
      let query = `
        SELECT * FROM host_documents 
        WHERE host_id = ? AND is_current_version = 1
      `;
      const params = [hostId];

      if (documentType) {
        query += ` AND document_type = ?`;
        params.push(documentType);
      }

      query += ` ORDER BY document_type, created_at DESC`;

      const results = await this.allQuery(query, params);
      return results;
    } catch (error) {
      console.error('Error fetching host documents:', error);
      throw error;
    }
  }

  /**
   * Update document verification status
   */
  async updateDocumentVerificationStatus(documentType, documentId, verificationData) {
    try {
      const tableName = documentType === 'vehicle_document' ? 'vehicle_documents' : 'host_documents';
      
      const query = `
        UPDATE ${tableName} 
        SET verification_status = ?, 
            verified_by = ?, 
            verified_at = CURRENT_TIMESTAMP,
            verification_notes = ?,
            rejection_reason = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await this.runQuery(query, [
        verificationData.verification_status,
        verificationData.verified_by,
        verificationData.verification_notes,
        verificationData.rejection_reason,
        documentId
      ]);

      // Update verification workflow
      await this.updateVerificationWorkflow(documentType, documentId, verificationData);

      return { success: true };
    } catch (error) {
      console.error('Error updating document verification:', error);
      throw error;
    }
  }

  /**
   * Create verification workflow entry
   */
  async createVerificationWorkflow(documentType, documentId) {
    try {
      const query = `
        INSERT INTO document_verification_workflow (
          document_type, document_id, workflow_step, workflow_status,
          processing_method, started_at, created_at
        ) VALUES (?, ?, 'uploaded', 'pending', 'automatic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      await this.runQuery(query, [documentType, documentId]);
    } catch (error) {
      console.error('Error creating verification workflow:', error);
      throw error;
    }
  }

  /**
   * Update verification workflow
   */
  async updateVerificationWorkflow(documentType, documentId, verificationData) {
    try {
      const workflowStep = verificationData.verification_status === 'verified' ? 'approved' : 'rejected';
      
      const query = `
        INSERT INTO document_verification_workflow (
          document_type, document_id, workflow_step, workflow_status,
          assigned_to, processing_method, reviewer_notes, quality_score,
          started_at, completed_at, created_at
        ) VALUES (?, ?, ?, 'completed', ?, 'manual', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      await this.runQuery(query, [
        documentType,
        documentId,
        workflowStep,
        verificationData.verified_by,
        verificationData.verification_notes,
        verificationData.quality_score || null
      ]);
    } catch (error) {
      console.error('Error updating verification workflow:', error);
      throw error;
    }
  }

  /**
   * Get document templates
   */
  async getDocumentTemplates(appliesTo = null, region = null, vehicleType = null) {
    try {
      let query = `
        SELECT * FROM document_templates 
        WHERE is_active = 1
      `;
      const params = [];

      if (appliesTo) {
        query += ` AND applies_to IN (?, 'both')`;
        params.push(appliesTo);
      }

      if (region) {
        query += ` AND (regions IS NULL OR JSON_EXTRACT(regions, '$') LIKE ?)`;
        params.push(`%${region}%`);
      }

      if (vehicleType) {
        query += ` AND (vehicle_types IS NULL OR JSON_EXTRACT(vehicle_types, '$') LIKE ?)`;
        params.push(`%${vehicleType}%`);
      }

      query += ` ORDER BY category, template_name`;

      const results = await this.allQuery(query, params);
      return results.map(template => ({
        ...template,
        vehicle_types: template.vehicle_types ? JSON.parse(template.vehicle_types) : [],
        regions: template.regions ? JSON.parse(template.regions) : [],
        business_types: template.business_types ? JSON.parse(template.business_types) : [],
        validation_rules: template.validation_rules ? JSON.parse(template.validation_rules) : {},
        required_fields: template.required_fields ? JSON.parse(template.required_fields) : [],
        file_type_restrictions: template.file_type_restrictions ? JSON.parse(template.file_type_restrictions) : [],
        common_rejection_reasons: template.common_rejection_reasons ? JSON.parse(template.common_rejection_reasons) : []
      }));
    } catch (error) {
      console.error('Error fetching document templates:', error);
      throw error;
    }
  }

  /**
   * Get documents requiring renewal
   */
  async getDocumentsRequiringRenewal(daysBeforeExpiry = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysBeforeExpiry);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      const vehicleDocsQuery = `
        SELECT 'vehicle_document' as document_type, id, vehicle_id as entity_id, 
               host_id, document_name, document_type as doc_type, expiry_date
        FROM vehicle_documents 
        WHERE expiry_date <= ? AND renewal_required = 1 AND is_current_version = 1
      `;

      const hostDocsQuery = `
        SELECT 'host_document' as document_type, id, host_id as entity_id, 
               host_id, document_name, document_type as doc_type, expiry_date
        FROM host_documents 
        WHERE expiry_date <= ? AND renewal_required = 1 AND is_current_version = 1
      `;

      const [vehicleDocs, hostDocs] = await Promise.all([
        this.allQuery(vehicleDocsQuery, [cutoffDateStr]),
        this.allQuery(hostDocsQuery, [cutoffDateStr])
      ]);

      return [...vehicleDocs, ...hostDocs];
    } catch (error) {
      console.error('Error fetching documents requiring renewal:', error);
      throw error;
    }
  }

  /**
   * Log document access
   */
  async logDocumentAccess(documentType, documentId, accessedBy, accessType, accessReason = null) {
    try {
      const query = `
        INSERT INTO document_access_log (
          document_type, document_id, accessed_by, access_type, access_reason,
          ip_address, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      await this.runQuery(query, [
        documentType,
        documentId,
        accessedBy,
        accessType,
        accessReason,
        null // IP address would be filled in the route handler
      ]);
    } catch (error) {
      console.error('Error logging document access:', error);
      throw error;
    }
  }

  /**
   * Get document verification workflow
   */
  async getDocumentVerificationWorkflow(documentType, documentId) {
    try {
      const query = `
        SELECT * FROM document_verification_workflow 
        WHERE document_type = ? AND document_id = ?
        ORDER BY created_at DESC
      `;

      const results = await this.allQuery(query, [documentType, documentId]);
      return results;
    } catch (error) {
      console.error('Error fetching verification workflow:', error);
      throw error;
    }
  }

  // Helper methods
  runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  allQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = new DocumentService();