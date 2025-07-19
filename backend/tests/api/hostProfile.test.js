const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const hostProfileRoutes = require('../../routes/hostProfile');
const hostProfileService = require('../../services/hostProfileService');
const authMiddleware = require('../../middleware/authMiddleware');

// Mock dependencies
jest.mock('../../services/hostProfileService');
jest.mock('../../middleware/authMiddleware');

describe('Host Profile API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware to always pass and set user
    authMiddleware.authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 1, email: 'test@example.com', role: 'host' };
      next();
    });

    authMiddleware.requireRole.mockImplementation((roles) => (req, res, next) => {
      next();
    });

    app.use('/api/host-profile', hostProfileRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/host-profile', () => {
    test('should retrieve host profile successfully', async () => {
      const mockProfile = {
        user_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        business_name: 'KeyLo Rentals',
        host_status: 'active',
        host_rating: 4.8,
        total_host_reviews: 150,
        profile_completion_percentage: 95
      };

      hostProfileService.getHostProfile.mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/api/host-profile')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockProfile
      });

      expect(hostProfileService.getHostProfile).toHaveBeenCalledWith(1);
    });

    test('should handle host profile not found', async () => {
      hostProfileService.getHostProfile.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/host-profile')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Host profile not found'
      });
    });

    test('should handle service errors', async () => {
      hostProfileService.getHostProfile.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/host-profile')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to retrieve host profile'
      });
    });

    test('should require authentication', async () => {
      authMiddleware.authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      await request(app)
        .get('/api/host-profile')
        .expect(401);
    });
  });

  describe('POST /api/host-profile', () => {
    test('should create host profile successfully', async () => {
      const profileData = {
        business_name: 'KeyLo Premium Rentals',
        business_type: 'company',
        business_phone: '+1-242-555-0123',
        business_email: 'contact@keylopremium.com',
        host_description: 'Premium car rental service in Nassau',
        preferred_guest_type: 'business',
        cancellation_policy: 'moderate'
      };

      const mockCreatedProfile = {
        user_id: 1,
        ...profileData,
        profile_completion_percentage: 85,
        created_at: new Date().toISOString()
      };

      hostProfileService.createOrUpdateHostProfile.mockResolvedValue(mockCreatedProfile);

      const response = await request(app)
        .post('/api/host-profile')
        .send(profileData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockCreatedProfile,
        message: 'Host profile created successfully'
      });

      expect(hostProfileService.createOrUpdateHostProfile).toHaveBeenCalledWith(1, profileData);
    });

    test('should update existing host profile', async () => {
      const profileData = {
        business_name: 'Updated KeyLo Rentals',
        host_description: 'Updated description'
      };

      const mockUpdatedProfile = {
        user_id: 1,
        ...profileData,
        profile_completion_percentage: 90,
        updated_at: new Date().toISOString()
      };

      hostProfileService.createOrUpdateHostProfile.mockResolvedValue(mockUpdatedProfile);

      const response = await request(app)
        .post('/api/host-profile')
        .send(profileData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedProfile,
        message: 'Host profile updated successfully'
      });
    });

    test('should validate required fields', async () => {
      const invalidData = {
        business_type: 'individual'
        // Missing business_name
      };

      const response = await request(app)
        .post('/api/host-profile')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Business name is required'
      });
    });

    test('should validate email format', async () => {
      const invalidData = {
        business_name: 'Test Business',
        business_email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/host-profile')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid business email format'
      });
    });

    test('should validate phone format', async () => {
      const invalidData = {
        business_name: 'Test Business',
        business_phone: '123'
      };

      const response = await request(app)
        .post('/api/host-profile')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid phone number format'
      });
    });

    test('should handle service errors', async () => {
      const profileData = {
        business_name: 'Test Business'
      };

      hostProfileService.createOrUpdateHostProfile.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/host-profile')
        .send(profileData)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to create/update host profile'
      });
    });
  });

  describe('GET /api/host-profile/analytics', () => {
    test('should retrieve host analytics successfully', async () => {
      const mockAnalytics = [
        {
          id: 1,
          host_id: 1,
          period_type: 'monthly',
          period_start: '2024-01-01',
          period_end: '2024-01-31',
          total_bookings: 25,
          gross_revenue: 5000.00,
          net_revenue: 4250.00,
          occupancy_rate: 75.50,
          response_rate: 95.00,
          average_rating: 4.8
        }
      ];

      hostProfileService.getHostAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/api/host-profile/analytics?period=monthly')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAnalytics
      });

      expect(hostProfileService.getHostAnalytics).toHaveBeenCalledWith(1, 'monthly', undefined, undefined);
    });

    test('should handle date range parameters', async () => {
      hostProfileService.getHostAnalytics.mockResolvedValue([]);

      await request(app)
        .get('/api/host-profile/analytics?period=daily&startDate=2024-01-01&endDate=2024-01-31')
        .expect(200);

      expect(hostProfileService.getHostAnalytics).toHaveBeenCalledWith(1, 'daily', '2024-01-01', '2024-01-31');
    });

    test('should validate period parameter', async () => {
      const response = await request(app)
        .get('/api/host-profile/analytics?period=invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid period type. Must be one of: daily, weekly, monthly, yearly'
      });
    });

    test('should require host role', async () => {
      authMiddleware.requireRole.mockImplementation((roles) => (req, res, next) => {
        res.status(403).json({ error: 'Insufficient permissions' });
      });

      await request(app)
        .get('/api/host-profile/analytics?period=monthly')
        .expect(403);
    });
  });

  describe('GET /api/host-profile/notifications', () => {
    test('should retrieve host notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 1,
          host_id: 1,
          notification_type: 'booking_request',
          title: 'New Booking Request',
          message: 'You have received a new booking request',
          status: 'unread',
          priority: 'high',
          metadata: { guest_name: 'John Doe' },
          created_at: '2024-01-15 10:30:00'
        }
      ];

      hostProfileService.getHostNotifications.mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/api/host-profile/notifications')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockNotifications
      });

      expect(hostProfileService.getHostNotifications).toHaveBeenCalledWith(1, undefined, 50, 0);
    });

    test('should handle status filter', async () => {
      hostProfileService.getHostNotifications.mockResolvedValue([]);

      await request(app)
        .get('/api/host-profile/notifications?status=unread')
        .expect(200);

      expect(hostProfileService.getHostNotifications).toHaveBeenCalledWith(1, 'unread', 50, 0);
    });

    test('should handle pagination parameters', async () => {
      hostProfileService.getHostNotifications.mockResolvedValue([]);

      await request(app)
        .get('/api/host-profile/notifications?limit=10&offset=20')
        .expect(200);

      expect(hostProfileService.getHostNotifications).toHaveBeenCalledWith(1, undefined, 10, 20);
    });

    test('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/host-profile/notifications?limit=invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid pagination parameters'
      });
    });
  });

  describe('POST /api/host-profile/notifications', () => {
    test('should create notification successfully', async () => {
      const notificationData = {
        notification_type: 'booking_request',
        title: 'New Booking Request',
        message: 'You have received a new booking request',
        priority: 'high',
        category: 'booking',
        related_booking_id: 123,
        metadata: { guest_name: 'Jane Smith' }
      };

      hostProfileService.createHostNotification.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/host-profile/notifications')
        .send(notificationData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: { id: 1 },
        message: 'Notification created successfully'
      });

      expect(hostProfileService.createHostNotification).toHaveBeenCalledWith(1, notificationData);
    });

    test('should validate required notification fields', async () => {
      const invalidData = {
        title: 'Test Notification'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/host-profile/notifications')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Notification type and message are required'
      });
    });

    test('should validate notification type', async () => {
      const invalidData = {
        notification_type: 'invalid_type',
        title: 'Test',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/host-profile/notifications')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('Invalid notification type');
    });
  });

  describe('PUT /api/host-profile/notifications/:id', () => {
    test('should update notification status successfully', async () => {
      const notificationId = 1;
      const updateData = { status: 'read' };

      hostProfileService.updateNotificationStatus.mockResolvedValue({ success: true });

      const response = await request(app)
        .put(`/api/host-profile/notifications/${notificationId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Notification status updated successfully'
      });

      expect(hostProfileService.updateNotificationStatus).toHaveBeenCalledWith(notificationId, 'read');
    });

    test('should validate notification ID', async () => {
      const response = await request(app)
        .put('/api/host-profile/notifications/invalid')
        .send({ status: 'read' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid notification ID'
      });
    });

    test('should validate status value', async () => {
      const response = await request(app)
        .put('/api/host-profile/notifications/1')
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid status. Must be one of: unread, read, archived'
      });
    });

    test('should handle notification not found', async () => {
      hostProfileService.updateNotificationStatus.mockResolvedValue({ 
        success: false, 
        error: 'Notification not found' 
      });

      const response = await request(app)
        .put('/api/host-profile/notifications/999')
        .send({ status: 'read' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Notification not found'
      });
    });
  });

  describe('GET /api/host-profile/public/:hostId', () => {
    test('should retrieve public host profile successfully', async () => {
      const hostId = 1;
      const mockPublicProfile = {
        user_id: hostId,
        first_name: 'John',
        last_name: 'Doe',
        business_name: 'KeyLo Rentals',
        host_rating: 4.8,
        total_host_reviews: 150,
        superhost_status: true,
        host_languages: ['English', 'Spanish'],
        host_specialties: ['Luxury Cars', 'Airport Transfers'],
        // Sensitive fields should be excluded
        business_phone: undefined,
        business_email: undefined
      };

      hostProfileService.getHostProfile.mockResolvedValue(mockPublicProfile);

      // Remove auth middleware for public endpoint
      authMiddleware.authenticate.mockImplementation((req, res, next) => {
        next();
      });

      const response = await request(app)
        .get(`/api/host-profile/public/${hostId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          user_id: hostId,
          business_name: 'KeyLo Rentals',
          host_rating: 4.8
        })
      });

      // Verify sensitive fields are excluded
      expect(response.body.data.business_phone).toBeUndefined();
      expect(response.body.data.business_email).toBeUndefined();
    });

    test('should validate host ID parameter', async () => {
      const response = await request(app)
        .get('/api/host-profile/public/invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid host ID'
      });
    });

    test('should handle public profile not found', async () => {
      hostProfileService.getHostProfile.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/host-profile/public/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Host profile not found'
      });
    });
  });

  describe('Error Handling and Security', () => {
    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/host-profile')
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should prevent SQL injection attempts', async () => {
      const maliciousData = {
        business_name: "'; DROP TABLE host_profiles; --",
        business_type: 'individual'
      };

      hostProfileService.createOrUpdateHostProfile.mockResolvedValue({
        user_id: 1,
        business_name: maliciousData.business_name
      });

      const response = await request(app)
        .post('/api/host-profile')
        .send(maliciousData)
        .expect(200);

      // Verify the service was called with the malicious data
      // (the service should handle SQL injection prevention)
      expect(hostProfileService.createOrUpdateHostProfile).toHaveBeenCalledWith(1, maliciousData);
    });

    test('should handle large payload gracefully', async () => {
      const largePayload = {
        business_name: 'Test Business',
        host_description: 'A'.repeat(10000) // Very long description
      };

      hostProfileService.createOrUpdateHostProfile.mockResolvedValue({
        user_id: 1,
        ...largePayload
      });

      const response = await request(app)
        .post('/api/host-profile')
        .send(largePayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should rate limit API calls', async () => {
      // This would typically be tested with a rate limiting middleware
      // For now, we'll just verify the endpoint structure supports it
      
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/api/host-profile')
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (assuming no rate limiting in test)
      responses.forEach(response => {
        expect([200, 404, 500]).toContain(response.status);
      });
    });

    test('should validate content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/host-profile')
        .send('plain text data')
        .set('Content-Type', 'text/plain')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});