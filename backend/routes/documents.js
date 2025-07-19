const express = require('express');
const router = express.Router();
const documentService = require('../services/documentService');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

/**
 * @route   POST /api/documents/vehicle/:vehicleId
 * @desc    Upload vehicle document
 * @access  Private
 */
router.post('/vehicle/:vehicleId', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const vehicleId = req.params.vehicleId;
    const hostId = req.user.id;
    
    // TODO: Verify that the user owns this vehicle
    
    const documentData = {
      document_type: req.body.document_type,
      document_name: req.body.document_name || req.file.originalname,
      document_description: req.body.document_description,
      file_url: `/uploads/documents/${req.file.filename}`,
      file_name: req.file.originalname,
      file_size: req.file.size,
      file_type: path.extname(req.file.originalname).slice(1),
      document_number: req.body.document_number,
      issuing_authority: req.body.issuing_authority,
      issue_date: req.body.issue_date,
      expiry_date: req.body.expiry_date,
      renewal_required: req.body.renewal_required === 'true',
      category: req.body.category,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      is_required: req.body.is_required === 'true',
      is_public: req.body.is_public === 'true',
      regulatory_notes: req.body.regulatory_notes
    };

    const result = await documentService.uploadVehicleDocument(vehicleId, hostId, documentData);

    res.json({
      success: true,
      data: result,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading vehicle document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document'
    });
  }
});

/**
 * @route   POST /api/documents/host
 * @desc    Upload host document
 * @access  Private
 */
router.post('/host', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const hostId = req.user.id;
    
    const documentData = {
      document_type: req.body.document_type,
      document_name: req.body.document_name || req.file.originalname,
      document_description: req.body.document_description,
      file_url: `/uploads/documents/${req.file.filename}`,
      file_name: req.file.originalname,
      file_size: req.file.size,
      file_type: path.extname(req.file.originalname).slice(1),
      document_number: req.body.document_number,
      issuing_authority: req.body.issuing_authority,
      issue_date: req.body.issue_date,
      expiry_date: req.body.expiry_date,
      renewal_required: req.body.renewal_required === 'true',
      category: req.body.category,
      is_required: req.body.is_required === 'true',
      is_sensitive: req.body.is_sensitive !== 'false' // default to true
    };

    const result = await documentService.uploadHostDocument(hostId, documentData);

    res.json({
      success: true,
      data: result,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading host document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document'
    });
  }
});

/**
 * @route   GET /api/documents/vehicle/:vehicleId
 * @desc    Get vehicle documents
 * @access  Private
 */
router.get('/vehicle/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const documents = await documentService.getVehicleDocuments(vehicleId, req.user.id);

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching vehicle documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents'
    });
  }
});

/**
 * @route   GET /api/documents/host
 * @desc    Get host documents
 * @access  Private
 */
router.get('/host', authenticateToken, async (req, res) => {
  try {
    const { document_type } = req.query;
    const documents = await documentService.getHostDocuments(req.user.id, document_type);

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching host documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents'
    });
  }
});

/**
 * @route   PUT /api/documents/:documentType/:documentId/verify
 * @desc    Update document verification status
 * @access  Private (admin only)
 */
router.put('/:documentType/:documentId/verify', authenticateToken, async (req, res) => {
  try {
    // TODO: Add admin role check
    
    const { documentType, documentId } = req.params;
    const verificationData = {
      verification_status: req.body.verification_status,
      verified_by: req.user.id,
      verification_notes: req.body.verification_notes,
      rejection_reason: req.body.rejection_reason,
      quality_score: req.body.quality_score
    };

    await documentService.updateDocumentVerificationStatus(documentType, documentId, verificationData);

    res.json({
      success: true,
      message: 'Document verification status updated'
    });
  } catch (error) {
    console.error('Error updating document verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating verification status'
    });
  }
});

/**
 * @route   GET /api/documents/templates
 * @desc    Get document templates
 * @access  Private
 */
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const { applies_to, region, vehicle_type } = req.query;
    const templates = await documentService.getDocumentTemplates(applies_to, region, vehicle_type);

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching document templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates'
    });
  }
});

/**
 * @route   GET /api/documents/expiring
 * @desc    Get documents requiring renewal
 * @access  Private
 */
router.get('/expiring', authenticateToken, async (req, res) => {
  try {
    const { days_before_expiry = 30 } = req.query;
    const documents = await documentService.getDocumentsRequiringRenewal(parseInt(days_before_expiry));

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching expiring documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring documents'
    });
  }
});

/**
 * @route   GET /api/documents/:documentType/:documentId/workflow
 * @desc    Get document verification workflow
 * @access  Private
 */
router.get('/:documentType/:documentId/workflow', authenticateToken, async (req, res) => {
  try {
    const { documentType, documentId } = req.params;
    const workflow = await documentService.getDocumentVerificationWorkflow(documentType, documentId);

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error fetching verification workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflow'
    });
  }
});

/**
 * @route   POST /api/documents/:documentType/:documentId/access
 * @desc    Log document access
 * @access  Private
 */
router.post('/:documentType/:documentId/access', authenticateToken, async (req, res) => {
  try {
    const { documentType, documentId } = req.params;
    const { access_type, access_reason } = req.body;

    await documentService.logDocumentAccess(
      documentType,
      documentId,
      req.user.id,
      access_type,
      access_reason
    );

    res.json({
      success: true,
      message: 'Access logged successfully'
    });
  } catch (error) {
    console.error('Error logging document access:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging access'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
  }
  
  if (error.message === 'Only images and documents are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only images and documents are allowed.'
    });
  }
  
  next(error);
});

module.exports = router;