const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const documentsRoutes = require('../../routes/documents');
const documentService = require('../../services/documentService');
const authMiddleware = require('../../middleware/authMiddleware');

// Mock dependencies
jest.mock('../../services/documentService');
jest.mock('../../middleware/authMiddleware');
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn()
  }
}));

describe('Documents API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    authMiddleware.authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 1, email: 'test@example.com', role: 'host' };
      next();
    });

    authMiddleware.requireRole.mockImplementation((roles) => (req, res, next) => {
      next();
    });

    app.use('/api/documents', documentsRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/documents/upload', () => {
    test('should upload vehicle document successfully', async () => {
      const mockUploadedDoc = {
        id: 1,
        vehicle_id: 1,
        document_type: 'registration',
        file_name: 'registration.pdf',
        file_path: '/uploads/documents/registration.pdf',
        verification_status: 'pending',
        uploaded_at: new Date().toISOString()
      };

      documentService.uploadDocument.mockResolvedValue(mockUploadedDoc);

      // Mock file upload
      const response = await request(app)
        .post('/api/documents/upload')
        .field('vehicleId', '1')
        .field('documentType', 'registration')
        .attach('document', Buffer.from('mock pdf content'), 'registration.pdf')
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockUploadedDoc,
        message: 'Document uploaded successfully'
      });

      expect(documentService.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 1,
          documentType: 'registration',
          fileName: 'registration.pdf',
          uploadedBy: 1
        })
      );
    });

    test('should upload host document successfully', async () => {
      const mockUploadedDoc = {
        id: 2,
        host_id: 1,
        document_type: 'drivers_license',
        file_name: 'license.jpg',
        file_path: '/uploads/documents/license.jpg',
        verification_status: 'pending'
      };

      documentService.uploadDocument.mockResolvedValue(mockUploadedDoc);

      const response = await request(app)
        .post('/api/documents/upload')
        .field('hostId', '1')
        .field('documentType', 'drivers_license')
        .attach('document', Buffer.from('mock image content'), 'license.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(documentService.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: 1,
          documentType: 'drivers_license',
          fileName: 'license.jpg'
        })
      );
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('content'), 'test.pdf')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Either vehicleId or hostId must be provided'
      });
    });

    test('should validate document type', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .field('vehicleId', '1')
        .field('documentType', 'invalid_type')
        .attach('document', Buffer.from('content'), 'test.pdf')
        .expect(400);

      expect(response.body.error).toContain('Invalid document type');
    });

    test('should validate file upload', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .field('vehicleId', '1')
        .field('documentType', 'registration')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'No file uploaded'
      });
    });

    test('should validate file type', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .field('vehicleId', '1')
        .field('documentType', 'registration')
        .attach('document', Buffer.from('content'), 'test.exe')
        .expect(400);

      expect(response.body.error).toContain('Invalid file type');
    });

    test('should validate file size', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/api/documents/upload')
        .field('vehicleId', '1')
        .field('documentType', 'registration')
        .attach('document', largeBuffer, 'large.pdf')
        .expect(400);

      expect(response.body.error).toContain('File too large');
    });

    test('should handle upload service errors', async () => {
      documentService.uploadDocument.mockRejectedValue(new Error('Storage error'));

      const response = await request(app)
        .post('/api/documents/upload')
        .field('vehicleId', '1')
        .field('documentType', 'registration')
        .attach('document', Buffer.from('content'), 'test.pdf')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to upload document'
      });
    });

    test('should require authentication', async () => {
      authMiddleware.authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      await request(app)
        .post('/api/documents/upload')
        .field('vehicleId', '1')
        .field('documentType', 'registration')
        .attach('document', Buffer.from('content'), 'test.pdf')
        .expect(401);
    });
  });

  describe('GET /api/documents/vehicle/:vehicleId', () => {
    test('should retrieve vehicle documents successfully', async () => {
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

      documentService.getDocumentsByVehicle.mockResolvedValue(mockDocuments);

      const response = await request(app)
        .get(`/api/documents/vehicle/${vehicleId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockDocuments
      });

      expect(documentService.getDocumentsByVehicle).toHaveBeenCalledWith(vehicleId);
    });

    test('should validate vehicle ID', async () => {
      const response = await request(app)
        .get('/api/documents/vehicle/invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid vehicle ID'
      });
    });

    test('should handle empty results', async () => {
      documentService.getDocumentsByVehicle.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/documents/vehicle/999')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: []
      });
    });

    test('should handle service errors', async () => {
      documentService.getDocumentsByVehicle.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/documents/vehicle/1')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to retrieve vehicle documents'
      });
    });
  });

  describe('GET /api/documents/host/:hostId', () => {
    test('should retrieve host documents successfully', async () => {
      const hostId = 1;
      const mockDocuments = [
        {
          id: 3,
          host_id: hostId,
          document_type: 'drivers_license',
          file_name: 'license.jpg',
          verification_status: 'verified',
          expiration_date: '2025-12-31'
        }
      ];

      documentService.getDocumentsByHost.mockResolvedValue(mockDocuments);

      const response = await request(app)
        .get(`/api/documents/host/${hostId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockDocuments
      });

      expect(documentService.getDocumentsByHost).toHaveBeenCalledWith(hostId, undefined);
    });

    test('should filter by document type', async () => {
      const hostId = 1;
      const documentType = 'drivers_license';

      documentService.getDocumentsByHost.mockResolvedValue([]);

      await request(app)
        .get(`/api/documents/host/${hostId}?type=${documentType}`)
        .expect(200);

      expect(documentService.getDocumentsByHost).toHaveBeenCalledWith(hostId, documentType);
    });

    test('should validate host ID', async () => {
      const response = await request(app)
        .get('/api/documents/host/invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid host ID'
      });
    });

    test('should require host role or admin', async () => {
      authMiddleware.requireRole.mockImplementation((roles) => (req, res, next) => {
        res.status(403).json({ error: 'Insufficient permissions' });
      });

      await request(app)
        .get('/api/documents/host/1')
        .expect(403);
    });
  });

  describe('PUT /api/documents/:id/verify', () => {
    test('should update verification status successfully', async () => {
      const documentId = 1;
      const verificationData = {
        status: 'verified',
        notes: 'Document approved'
      };

      documentService.updateVerificationStatus.mockResolvedValue({ success: true });

      const response = await request(app)
        .put(`/api/documents/${documentId}/verify`)
        .send(verificationData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Document verification status updated successfully'
      });

      expect(documentService.updateVerificationStatus).toHaveBeenCalledWith(
        documentId,
        'verified',
        1, // reviewer ID from auth
        'Document approved'
      );
    });

    test('should validate document ID', async () => {
      const response = await request(app)
        .put('/api/documents/invalid/verify')
        .send({ status: 'verified' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid document ID'
      });
    });

    test('should validate verification status', async () => {
      const response = await request(app)
        .put('/api/documents/1/verify')
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid verification status. Must be one of: pending, verified, rejected, expired'
      });
    });

    test('should require admin role', async () => {
      authMiddleware.requireRole.mockImplementation((roles) => (req, res, next) => {
        if (!roles.includes('admin')) {
          res.status(403).json({ error: 'Admin access required' });
        } else {
          next();
        }
      });

      await request(app)
        .put('/api/documents/1/verify')
        .send({ status: 'verified' })
        .expect(403);
    });

    test('should handle document not found', async () => {
      documentService.updateVerificationStatus.mockResolvedValue({ 
        success: false, 
        error: 'Document not found' 
      });

      const response = await request(app)
        .put('/api/documents/999/verify')
        .send({ status: 'verified' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Document not found'
      });
    });
  });

  describe('DELETE /api/documents/:id', () => {
    test('should delete document successfully', async () => {
      const documentId = 1;

      documentService.deleteDocument.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete(`/api/documents/${documentId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Document deleted successfully'
      });

      expect(documentService.deleteDocument).toHaveBeenCalledWith(documentId);
    });

    test('should validate document ID', async () => {
      const response = await request(app)
        .delete('/api/documents/invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid document ID'
      });
    });

    test('should handle document not found', async () => {
      documentService.deleteDocument.mockResolvedValue({ 
        success: false, 
        error: 'Document not found' 
      });

      const response = await request(app)
        .delete('/api/documents/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Document not found'
      });
    });

    test('should require ownership or admin role', async () => {
      authMiddleware.authenticate.mockImplementation((req, res, next) => {
        req.user = { id: 2, role: 'user' }; // Different user
        next();
      });

      // This would typically check document ownership
      documentService.deleteDocument.mockResolvedValue({ 
        success: false, 
        error: 'Unauthorized' 
      });

      const response = await request(app)
        .delete('/api/documents/1')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should handle service errors', async () => {
      documentService.deleteDocument.mockRejectedValue(new Error('Deletion failed'));

      const response = await request(app)
        .delete('/api/documents/1')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to delete document'
      });
    });
  });

  describe('GET /api/documents/templates', () => {
    test('should retrieve document templates successfully', async () => {
      const mockTemplates = [
        {
          id: 1,
          document_type: 'registration',
          template_name: 'Vehicle Registration Template',
          required_fields: ['vehicle_make', 'vehicle_model', 'vin'],
          validation_rules: { file_types: ['pdf', 'jpg'], max_size: 5242880 },
          is_active: true
        }
      ];

      documentService.getDocumentTemplates.mockResolvedValue(mockTemplates);

      const response = await request(app)
        .get('/api/documents/templates')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockTemplates
      });

      expect(documentService.getDocumentTemplates).toHaveBeenCalledWith(undefined);
    });

    test('should filter templates by type', async () => {
      const documentType = 'registration';

      documentService.getDocumentTemplates.mockResolvedValue([]);

      await request(app)
        .get(`/api/documents/templates?type=${documentType}`)
        .expect(200);

      expect(documentService.getDocumentTemplates).toHaveBeenCalledWith(documentType);
    });

    test('should handle service errors', async () => {
      documentService.getDocumentTemplates.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/documents/templates')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to retrieve document templates'
      });
    });
  });

  describe('POST /api/documents/templates', () => {
    test('should create document template successfully', async () => {
      const templateData = {
        documentType: 'insurance',
        templateName: 'Vehicle Insurance Template',
        requiredFields: ['policy_number', 'provider', 'expiration_date'],
        validationRules: {
          file_types: ['pdf', 'jpg', 'png'],
          max_size: 10485760
        },
        description: 'Template for vehicle insurance documents'
      };

      documentService.createDocumentTemplate.mockResolvedValue({ id: 2 });

      const response = await request(app)
        .post('/api/documents/templates')
        .send(templateData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: { id: 2 },
        message: 'Document template created successfully'
      });

      expect(documentService.createDocumentTemplate).toHaveBeenCalledWith(templateData);
    });

    test('should validate required template fields', async () => {
      const invalidData = {
        templateName: 'Test Template'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/documents/templates')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Document type and template name are required'
      });
    });

    test('should require admin role', async () => {
      authMiddleware.requireRole.mockImplementation((roles) => (req, res, next) => {
        res.status(403).json({ error: 'Admin access required' });
      });

      await request(app)
        .post('/api/documents/templates')
        .send({ documentType: 'test', templateName: 'Test' })
        .expect(403);
    });

    test('should handle service errors', async () => {
      documentService.createDocumentTemplate.mockRejectedValue(new Error('Creation failed'));

      const response = await request(app)
        .post('/api/documents/templates')
        .send({ documentType: 'test', templateName: 'Test' })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to create document template'
      });
    });
  });

  describe('GET /api/documents/:id/audit', () => {
    test('should retrieve document audit log successfully', async () => {
      const documentId = 1;
      const mockAuditLog = [
        {
          id: 1,
          document_id: documentId,
          action_type: 'uploaded',
          performed_by: 1,
          timestamp: '2024-01-15 10:00:00',
          details: { file_name: 'test.pdf' },
          ip_address: '192.168.1.1'
        },
        {
          id: 2,
          document_id: documentId,
          action_type: 'verified',
          performed_by: 2,
          timestamp: '2024-01-15 14:00:00',
          details: { status: 'approved' },
          ip_address: '192.168.1.2'
        }
      ];

      documentService.getDocumentAuditLog.mockResolvedValue(mockAuditLog);

      const response = await request(app)
        .get(`/api/documents/${documentId}/audit`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAuditLog
      });

      expect(documentService.getDocumentAuditLog).toHaveBeenCalledWith(documentId, undefined);
    });

    test('should filter audit log by action type', async () => {
      const documentId = 1;
      const actionType = 'verified';

      documentService.getDocumentAuditLog.mockResolvedValue([]);

      await request(app)
        .get(`/api/documents/${documentId}/audit?action=${actionType}`)
        .expect(200);

      expect(documentService.getDocumentAuditLog).toHaveBeenCalledWith(documentId, actionType);
    });

    test('should validate document ID', async () => {
      const response = await request(app)
        .get('/api/documents/invalid/audit')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid document ID'
      });
    });

    test('should require admin role', async () => {
      authMiddleware.requireRole.mockImplementation((roles) => (req, res, next) => {
        res.status(403).json({ error: 'Admin access required' });
      });

      await request(app)
        .get('/api/documents/1/audit')
        .expect(403);
    });
  });

  describe('Security and Performance Tests', () => {
    test('should handle file upload with malicious filename', async () => {
      const maliciousFilename = '../../../etc/passwd';

      documentService.uploadDocument.mockResolvedValue({
        id: 1,
        file_name: 'sanitized_filename.pdf'
      });

      const response = await request(app)
        .post('/api/documents/upload')
        .field('vehicleId', '1')
        .field('documentType', 'registration')
        .attach('document', Buffer.from('content'), maliciousFilename)
        .expect(201);

      // Verify filename was sanitized
      expect(documentService.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: expect.not.stringContaining('../')
        })
      );
    });

    test('should prevent directory traversal in file paths', async () => {
      const response = await request(app)
        .get('/api/documents/../../../etc/passwd')
        .expect(404);

      // Should not reach any handlers due to path validation
    });

    test('should handle concurrent file uploads', async () => {
      documentService.uploadDocument.mockImplementation(async (data) => ({
        id: Math.floor(Math.random() * 1000),
        ...data
      }));

      const uploads = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/documents/upload')
          .field('vehicleId', '1')
          .field('documentType', 'registration')
          .attach('document', Buffer.from(`content ${i}`), `file${i}.pdf`)
      );

      const responses = await Promise.all(uploads);

      responses.forEach(response => {
        expect([201, 400, 500]).toContain(response.status);
      });
    });

    test('should validate file content type', async () => {
      // Mock a file with PDF extension but different content type
      const response = await request(app)
        .post('/api/documents/upload')
        .field('vehicleId', '1')
        .field('documentType', 'registration')
        .attach('document', Buffer.from('not a pdf'), 'fake.pdf')
        .set('Content-Type', 'text/plain')
        .expect(400);

      expect(response.body.error).toContain('Invalid file type');
    });

    test('should handle database timeout gracefully', async () => {
      documentService.getDocumentsByVehicle.mockImplementation(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Database timeout')), 100);
        })
      );

      const response = await request(app)
        .get('/api/documents/vehicle/1')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});