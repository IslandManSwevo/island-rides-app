const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const documentService = require('../../services/documentService');
const { Database } = require('sqlite3');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => ({
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn()
  }))
}));

jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    unlink: jest.fn(),
    mkdir: jest.fn()
  }
}));

describe('DocumentService', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      close: jest.fn()
    };
    Database.mockImplementation(() => mockDb);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    test('should upload vehicle document successfully', async () => {
      const documentData = {
        vehicleId: 1,
        documentType: 'registration',
        fileName: 'vehicle_registration.pdf',
        filePath: '/uploads/documents/vehicle_registration.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        uploadedBy: 1
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1, changes: 1 });
      });

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, {
          id: 1,
          vehicle_id: documentData.vehicleId,
          document_type: documentData.documentType,
          file_name: documentData.fileName,
          file_path: documentData.filePath,
          verification_status: 'pending',
          uploaded_at: new Date().toISOString(),
          ...documentData
        });
      });

      const result = await documentService.uploadDocument(documentData);

      expect(result).toEqual(expect.objectContaining({
        id: 1,
        vehicle_id: documentData.vehicleId,
        document_type: documentData.documentType,
        verification_status: 'pending'
      }));

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vehicle_documents'),
        expect.arrayContaining([
          documentData.vehicleId,
          documentData.documentType,
          documentData.fileName
        ]),
        expect.any(Function)
      );
    });

    test('should upload host document successfully', async () => {
      const documentData = {
        hostId: 1,
        documentType: 'drivers_license',
        fileName: 'drivers_license.jpg',
        filePath: '/uploads/documents/drivers_license.jpg',
        fileSize: 512000,
        mimeType: 'image/jpeg',
        uploadedBy: 1
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 2, changes: 1 });
      });

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, {
          id: 2,
          host_id: documentData.hostId,
          document_type: documentData.documentType,
          file_name: documentData.fileName,
          verification_status: 'pending',
          ...documentData
        });
      });

      const result = await documentService.uploadDocument(documentData);

      expect(result.host_id).toBe(documentData.hostId);
      expect(result.document_type).toBe(documentData.documentType);
      expect(mockDb.run).toHaveBeenCalled();
    });

    test('should handle upload errors gracefully', async () => {
      const documentData = {
        vehicleId: 1,
        documentType: 'registration',
        fileName: 'test.pdf'
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(new Error('Database insert failed'));
      });

      await expect(documentService.uploadDocument(documentData))
        .rejects.toThrow('Database insert failed');
    });

    test('should validate required fields', async () => {
      const incompleteData = {
        vehicleId: 1
        // Missing required fields
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(new Error('NOT NULL constraint failed'));
      });

      await expect(documentService.uploadDocument(incompleteData))
        .rejects.toThrow('NOT NULL constraint failed');
    });
  });

  describe('getDocumentsByVehicle', () => {
    test('should retrieve all documents for a vehicle', async () => {
      const vehicleId = 1;
      const mockDocuments = [
        {
          id: 1,
          vehicle_id: vehicleId,
          document_type: 'registration',
          file_name: 'registration.pdf',
          verification_status: 'verified',
          uploaded_at: '2024-01-15 10:00:00'
        },
        {
          id: 2,
          vehicle_id: vehicleId,
          document_type: 'insurance',
          file_name: 'insurance.pdf',
          verification_status: 'pending',
          uploaded_at: '2024-01-15 11:00:00'
        }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockDocuments);
      });

      const result = await documentService.getDocumentsByVehicle(vehicleId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        vehicle_id: vehicleId,
        document_type: 'registration',
        verification_status: 'verified'
      }));

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE vehicle_id = ?'),
        [vehicleId],
        expect.any(Function)
      );
    });

    test('should return empty array for vehicle with no documents', async () => {
      const vehicleId = 999;

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      const result = await documentService.getDocumentsByVehicle(vehicleId);

      expect(result).toEqual([]);
    });

    test('should handle database errors', async () => {
      const vehicleId = 1;

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(new Error('Database query failed'));
      });

      await expect(documentService.getDocumentsByVehicle(vehicleId))
        .rejects.toThrow('Database query failed');
    });
  });

  describe('getDocumentsByHost', () => {
    test('should retrieve all documents for a host', async () => {
      const hostId = 1;
      const mockDocuments = [
        {
          id: 3,
          host_id: hostId,
          document_type: 'drivers_license',
          file_name: 'license.jpg',
          verification_status: 'verified',
          expiration_date: '2025-12-31'
        },
        {
          id: 4,
          host_id: hostId,
          document_type: 'business_license',
          file_name: 'business.pdf',
          verification_status: 'pending',
          expiration_date: null
        }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockDocuments);
      });

      const result = await documentService.getDocumentsByHost(hostId);

      expect(result).toHaveLength(2);
      expect(result[0].host_id).toBe(hostId);
      expect(result[0].document_type).toBe('drivers_license');
    });

    test('should filter by document type when specified', async () => {
      const hostId = 1;
      const documentType = 'drivers_license';

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await documentService.getDocumentsByHost(hostId, documentType);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('AND document_type = ?'),
        expect.arrayContaining([hostId, documentType]),
        expect.any(Function)
      );
    });
  });

  describe('updateVerificationStatus', () => {
    test('should update document verification status successfully', async () => {
      const documentId = 1;
      const status = 'verified';
      const reviewerId = 2;
      const notes = 'Document approved';

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 1 });
      });

      const result = await documentService.updateVerificationStatus(
        documentId, 
        status, 
        reviewerId, 
        notes
      );

      expect(result).toEqual({ success: true });
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vehicle_documents'),
        expect.arrayContaining([status, reviewerId, notes, documentId]),
        expect.any(Function)
      );
    });

    test('should update host document verification status', async () => {
      const documentId = 1;
      const status = 'rejected';
      const reviewerId = 2;
      const notes = 'Document unclear';

      mockDb.run
        .mockImplementationOnce((query, params, callback) => {
          // First query (vehicle_documents) returns 0 changes
          callback.call({ changes: 0 });
        })
        .mockImplementationOnce((query, params, callback) => {
          // Second query (host_documents) returns 1 change
          callback.call({ changes: 1 });
        });

      const result = await documentService.updateVerificationStatus(
        documentId, 
        status, 
        reviewerId, 
        notes
      );

      expect(result).toEqual({ success: true });
      expect(mockDb.run).toHaveBeenCalledTimes(2);
    });

    test('should handle document not found', async () => {
      const documentId = 999;
      const status = 'verified';

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 0 });
      });

      const result = await documentService.updateVerificationStatus(documentId, status);

      expect(result).toEqual({ success: false, error: 'Document not found' });
    });

    test('should handle database errors', async () => {
      const documentId = 1;
      const status = 'verified';

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(new Error('Update failed'));
      });

      await expect(documentService.updateVerificationStatus(documentId, status))
        .rejects.toThrow('Update failed');
    });
  });

  describe('deleteDocument', () => {
    test('should delete document and file successfully', async () => {
      const documentId = 1;
      const mockDocument = {
        id: documentId,
        file_path: '/uploads/documents/test.pdf',
        vehicle_id: 1,
        document_type: 'registration'
      };

      // Mock successful database operations
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockDocument);
      });

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 1 });
      });

      // Mock file system operations
      fs.access.mockResolvedValue(undefined); // File exists
      fs.unlink.mockResolvedValue(undefined); // File deleted

      const result = await documentService.deleteDocument(documentId);

      expect(result).toEqual({ success: true });
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM vehicle_documents'),
        [documentId],
        expect.any(Function)
      );
      expect(fs.unlink).toHaveBeenCalledWith(mockDocument.file_path);
    });

    test('should handle file deletion errors gracefully', async () => {
      const documentId = 1;
      const mockDocument = {
        id: documentId,
        file_path: '/uploads/documents/missing.pdf'
      };

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockDocument);
      });

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 1 });
      });

      // Mock file doesn't exist
      fs.access.mockRejectedValue(new Error('File not found'));

      const result = await documentService.deleteDocument(documentId);

      expect(result).toEqual({ success: true });
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    test('should handle document not found', async () => {
      const documentId = 999;

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      const result = await documentService.deleteDocument(documentId);

      expect(result).toEqual({ success: false, error: 'Document not found' });
    });
  });

  describe('getDocumentTemplates', () => {
    test('should retrieve document templates by type', async () => {
      const documentType = 'registration';
      const mockTemplates = [
        {
          id: 1,
          document_type: documentType,
          template_name: 'Vehicle Registration Template',
          required_fields: '["vehicle_make", "vehicle_model", "vin"]',
          validation_rules: '{"file_types": ["pdf", "jpg"], "max_size": 5242880}',
          is_active: 1
        }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockTemplates);
      });

      const result = await documentService.getDocumentTemplates(documentType);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        document_type: documentType,
        required_fields: ['vehicle_make', 'vehicle_model', 'vin'],
        validation_rules: { file_types: ['pdf', 'jpg'], max_size: 5242880 }
      }));
    });

    test('should return all templates when no type specified', async () => {
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await documentService.getDocumentTemplates();

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('FROM document_templates'),
        [],
        expect.any(Function)
      );
    });
  });

  describe('createDocumentTemplate', () => {
    test('should create document template successfully', async () => {
      const templateData = {
        documentType: 'insurance',
        templateName: 'Vehicle Insurance Template',
        requiredFields: ['policy_number', 'provider', 'expiration_date'],
        validationRules: {
          file_types: ['pdf', 'jpg', 'png'],
          max_size: 10485760,
          required_text: ['policy', 'coverage']
        },
        description: 'Template for vehicle insurance documents'
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 2, changes: 1 });
      });

      const result = await documentService.createDocumentTemplate(templateData);

      expect(result).toEqual({ id: 2 });
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO document_templates'),
        expect.arrayContaining([
          templateData.documentType,
          templateData.templateName,
          JSON.stringify(templateData.requiredFields),
          JSON.stringify(templateData.validationRules)
        ]),
        expect.any(Function)
      );
    });
  });

  describe('getDocumentAuditLog', () => {
    test('should retrieve audit log for document', async () => {
      const documentId = 1;
      const mockAuditLog = [
        {
          id: 1,
          document_id: documentId,
          action_type: 'uploaded',
          performed_by: 1,
          timestamp: '2024-01-15 10:00:00',
          details: '{"file_name": "test.pdf"}',
          ip_address: '192.168.1.1'
        },
        {
          id: 2,
          document_id: documentId,
          action_type: 'verified',
          performed_by: 2,
          timestamp: '2024-01-15 14:00:00',
          details: '{"status": "approved"}',
          ip_address: '192.168.1.2'
        }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockAuditLog);
      });

      const result = await documentService.getDocumentAuditLog(documentId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        document_id: documentId,
        action_type: 'uploaded',
        details: { file_name: 'test.pdf' }
      }));
    });

    test('should filter by action type when specified', async () => {
      const documentId = 1;
      const actionType = 'verified';

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await documentService.getDocumentAuditLog(documentId, actionType);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('AND action_type = ?'),
        expect.arrayContaining([documentId, actionType]),
        expect.any(Function)
      );
    });
  });

  describe('Performance and Security Tests', () => {
    test('should handle large file operations efficiently', async () => {
      const largeFileData = {
        vehicleId: 1,
        documentType: 'registration',
        fileName: 'large_document.pdf',
        fileSize: 52428800, // 50MB
        mimeType: 'application/pdf'
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        // Simulate processing time
        setTimeout(() => {
          callback.call({ lastID: 1, changes: 1 });
        }, 10);
      });

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, { id: 1, ...largeFileData });
      });

      const result = await documentService.uploadDocument(largeFileData);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    test('should prevent SQL injection in document queries', async () => {
      const maliciousVehicleId = "1; DROP TABLE vehicle_documents; --";
      
      mockDb.all.mockImplementation((query, params, callback) => {
        // Verify parameterized query is used
        expect(params).toContain(maliciousVehicleId);
        expect(query).not.toContain('DROP TABLE');
        callback(null, []);
      });

      await documentService.getDocumentsByVehicle(maliciousVehicleId);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([maliciousVehicleId]),
        expect.any(Function)
      );
    });

    test('should handle concurrent document uploads', async () => {
      const documentData = {
        vehicleId: 1,
        documentType: 'registration',
        fileName: 'concurrent_test.pdf'
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        setTimeout(() => {
          callback.call({ lastID: Math.floor(Math.random() * 1000), changes: 1 });
        }, Math.random() * 20);
      });

      mockDb.get.mockImplementation((query, params, callback) => {
        setTimeout(() => {
          callback(null, { id: 1, ...documentData });
        }, 5);
      });

      // Execute multiple concurrent uploads
      const promises = Array.from({ length: 5 }, (_, i) => 
        documentService.uploadDocument({
          ...documentData,
          fileName: `concurrent_test_${i}.pdf`
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      });
    });
  });
});