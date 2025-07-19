const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const hostProfileService = require('../../services/hostProfileService');
const { Database } = require('sqlite3');

// Mock database
jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => ({
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn()
  }))
}));

describe('HostProfileService', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      close: jest.fn()
    };
    Database.mockImplementation(() => mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdateHostProfile', () => {
    test('should create a new host profile successfully', async () => {
      const userId = 1;
      const profileData = {
        business_name: 'KeyLo Rentals',
        business_type: 'company',
        business_phone: '+1-242-555-0123',
        business_email: 'contact@keylorentals.com',
        host_description: 'Premium car rental service in Nassau',
        preferred_guest_type: 'business',
        cancellation_policy: 'moderate',
        insurance_provider: 'Bahamas Insurance Co',
        insurance_policy_number: 'POL123456789'
      };

      // Mock successful database operations
      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1, changes: 1 });
      });

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, {
          user_id: userId,
          business_name: profileData.business_name,
          business_type: profileData.business_type,
          profile_completion_percentage: 100,
          ...profileData
        });
      });

      const result = await hostProfileService.createOrUpdateHostProfile(userId, profileData);

      expect(result).toEqual(expect.objectContaining({
        user_id: userId,
        business_name: profileData.business_name,
        business_type: profileData.business_type
      }));

      expect(mockDb.run).toHaveBeenCalledTimes(2); // User update + Profile upsert
    });

    test('should handle database errors gracefully', async () => {
      const userId = 1;
      const profileData = { business_name: 'Test Business' };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(new Error('Database connection failed'));
      });

      await expect(hostProfileService.createOrUpdateHostProfile(userId, profileData))
        .rejects.toThrow('Database connection failed');
    });

    test('should validate required fields', async () => {
      const userId = 1;
      const incompleteProfileData = {
        business_type: 'individual'
        // Missing business_name
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1, changes: 1 });
      });

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, {
          user_id: userId,
          ...incompleteProfileData,
          profile_completion_percentage: 50
        });
      });

      const result = await hostProfileService.createOrUpdateHostProfile(userId, incompleteProfileData);
      
      // Should still create profile but with lower completion percentage
      expect(result.profile_completion_percentage).toBeLessThan(100);
    });
  });

  describe('getHostProfile', () => {
    test('should retrieve host profile successfully', async () => {
      const userId = 1;
      const mockProfile = {
        user_id: userId,
        first_name: 'John',
        last_name: 'Doe',
        business_name: 'KeyLo Rentals',
        host_status: 'active',
        host_rating: 4.8,
        total_host_reviews: 150,
        superhost_status: true,
        host_languages: '["English", "Spanish"]',
        host_specialties: '["Luxury Cars", "Airport Transfers"]',
        blocked_dates: '[]',
        notification_preferences: '{}'
      };

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockProfile);
      });

      const result = await hostProfileService.getHostProfile(userId);

      expect(result).toEqual(expect.objectContaining({
        user_id: userId,
        business_name: 'KeyLo Rentals',
        host_status: 'active',
        host_rating: 4.8,
        host_languages: ['English', 'Spanish'],
        host_specialties: ['Luxury Cars', 'Airport Transfers'],
        blocked_dates: [],
        notification_preferences: {}
      }));
    });

    test('should return null for non-existent host', async () => {
      const userId = 999;

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      const result = await hostProfileService.getHostProfile(userId);
      expect(result).toBeNull();
    });

    test('should handle database errors', async () => {
      const userId = 1;

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(new Error('Database query failed'));
      });

      await expect(hostProfileService.getHostProfile(userId))
        .rejects.toThrow('Database query failed');
    });
  });

  describe('getHostAnalytics', () => {
    test('should retrieve analytics for specified period', async () => {
      const hostId = 1;
      const periodType = 'monthly';
      const mockAnalytics = [
        {
          id: 1,
          host_id: hostId,
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

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockAnalytics);
      });

      const result = await hostProfileService.getHostAnalytics(hostId, periodType);

      expect(result).toEqual(mockAnalytics);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('host_analytics'),
        expect.arrayContaining([hostId, periodType]),
        expect.any(Function)
      );
    });

    test('should filter by date range when provided', async () => {
      const hostId = 1;
      const periodType = 'daily';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await hostProfileService.getHostAnalytics(hostId, periodType, startDate, endDate);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('period_start >= ? AND period_end <= ?'),
        expect.arrayContaining([hostId, periodType, startDate, endDate]),
        expect.any(Function)
      );
    });
  });

  describe('createHostNotification', () => {
    test('should create notification successfully', async () => {
      const hostId = 1;
      const notificationData = {
        notification_type: 'booking_request',
        title: 'New Booking Request',
        message: 'You have received a new booking request',
        priority: 'high',
        category: 'booking',
        related_booking_id: 123,
        metadata: { guest_name: 'Jane Smith' }
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1 });
      });

      const result = await hostProfileService.createHostNotification(hostId, notificationData);

      expect(result).toEqual({ id: 1 });
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO host_notifications'),
        expect.arrayContaining([
          hostId,
          notificationData.notification_type,
          notificationData.title,
          notificationData.message
        ]),
        expect.any(Function)
      );
    });

    test('should handle missing optional fields', async () => {
      const hostId = 1;
      const minimalNotificationData = {
        notification_type: 'system',
        title: 'System Update',
        message: 'System maintenance scheduled'
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 2 });
      });

      const result = await hostProfileService.createHostNotification(hostId, minimalNotificationData);

      expect(result).toEqual({ id: 2 });
    });
  });

  describe('getHostNotifications', () => {
    test('should retrieve notifications with default parameters', async () => {
      const hostId = 1;
      const mockNotifications = [
        {
          id: 1,
          host_id: hostId,
          notification_type: 'booking_request',
          title: 'New Booking Request',
          message: 'You have a new booking request',
          status: 'unread',
          priority: 'high',
          metadata: '{"guest_name": "John Doe"}',
          created_at: '2024-01-15 10:30:00'
        }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockNotifications);
      });

      const result = await hostProfileService.getHostNotifications(hostId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 1,
        host_id: hostId,
        notification_type: 'booking_request',
        metadata: { guest_name: 'John Doe' }
      }));
    });

    test('should filter by status when provided', async () => {
      const hostId = 1;
      const status = 'unread';

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await hostProfileService.getHostNotifications(hostId, status);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('AND status = ?'),
        expect.arrayContaining([hostId, status, 50, 0]),
        expect.any(Function)
      );
    });

    test('should apply pagination correctly', async () => {
      const hostId = 1;
      const limit = 10;
      const offset = 20;

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await hostProfileService.getHostNotifications(hostId, null, limit, offset);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        expect.arrayContaining([hostId, limit, offset]),
        expect.any(Function)
      );
    });
  });

  describe('updateNotificationStatus', () => {
    test('should update notification status to read', async () => {
      const notificationId = 1;
      const status = 'read';

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 1 });
      });

      const result = await hostProfileService.updateNotificationStatus(notificationId, status);

      expect(result).toEqual({ success: true });
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE host_notifications'),
        expect.arrayContaining([status, status, status, notificationId]),
        expect.any(Function)
      );
    });

    test('should update notification status to archived', async () => {
      const notificationId = 1;
      const status = 'archived';

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ changes: 1 });
      });

      const result = await hostProfileService.updateNotificationStatus(notificationId, status);

      expect(result).toEqual({ success: true });
    });

    test('should handle database errors', async () => {
      const notificationId = 1;
      const status = 'read';

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(new Error('Update failed'));
      });

      await expect(hostProfileService.updateNotificationStatus(notificationId, status))
        .rejects.toThrow('Update failed');
    });
  });

  describe('calculateProfileCompletion', () => {
    test('should calculate 100% completion for complete profile', async () => {
      const completeProfile = {
        business_name: 'KeyLo Rentals',
        business_type: 'company',
        business_phone: '+1-242-555-0123',
        business_email: 'contact@keylorentals.com',
        host_description: 'Premium service provider',
        preferred_guest_type: 'business',
        cancellation_policy: 'moderate',
        insurance_provider: 'Bahamas Insurance',
        insurance_policy_number: 'POL123456'
      };

      const completion = hostProfileService.calculateProfileCompletion(completeProfile);
      expect(completion).toBe(100);
    });

    test('should calculate partial completion for incomplete profile', async () => {
      const incompleteProfile = {
        business_name: 'Test Business',
        business_type: 'individual',
        business_phone: '+1-242-555-0123',
        // Missing other required fields
      };

      const completion = hostProfileService.calculateProfileCompletion(incompleteProfile);
      expect(completion).toBeLessThan(100);
      expect(completion).toBeGreaterThan(0);
    });

    test('should return 0% for empty profile', async () => {
      const emptyProfile = {};
      const completion = hostProfileService.calculateProfileCompletion(emptyProfile);
      expect(completion).toBe(0);
    });

    test('should handle null profile', async () => {
      const completion = hostProfileService.calculateProfileCompletion(null);
      expect(completion).toBe(0);
    });
  });

  describe('Helper Methods', () => {
    test('runQuery should execute database run operation', async () => {
      const query = 'INSERT INTO test (name) VALUES (?)';
      const params = ['Test Name'];

      mockDb.run.mockImplementation((q, p, callback) => {
        callback.call({ lastID: 1, changes: 1 });
      });

      // Since we can't access helper methods directly, we test through public methods
      const userId = 1;
      const profileData = { business_name: 'Test' };

      await hostProfileService.createOrUpdateHostProfile(userId, profileData);

      expect(mockDb.run).toHaveBeenCalled();
    });

    test('should handle SQL injection attempts', async () => {
      const userId = 1;
      const maliciousData = {
        business_name: "'; DROP TABLE users; --",
        business_type: 'individual'
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        // Verify that parameters are passed separately (preventing SQL injection)
        expect(params).toContain("'; DROP TABLE users; --");
        callback.call({ lastID: 1, changes: 1 });
      });

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, { user_id: userId, business_name: maliciousData.business_name });
      });

      await hostProfileService.createOrUpdateHostProfile(userId, maliciousData);

      // Should use parameterized queries
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([maliciousData.business_name]),
        expect.any(Function)
      );
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large datasets efficiently', async () => {
      const hostId = 1;
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        host_id: hostId,
        notification_type: 'booking_request',
        title: `Notification ${i + 1}`,
        message: `Message ${i + 1}`,
        metadata: '{}'
      }));

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, largeDataset);
      });

      const result = await hostProfileService.getHostNotifications(hostId, null, 1000, 0);

      expect(result).toHaveLength(1000);
      expect(result[0].metadata).toEqual({});
    });

    test('should handle concurrent operations', async () => {
      const userId = 1;
      const profileData = { business_name: 'Concurrent Test' };

      mockDb.run.mockImplementation((query, params, callback) => {
        // Simulate async operation
        setTimeout(() => {
          callback.call({ lastID: 1, changes: 1 });
        }, 10);
      });

      mockDb.get.mockImplementation((query, params, callback) => {
        setTimeout(() => {
          callback(null, { user_id: userId, business_name: profileData.business_name });
        }, 5);
      });

      // Execute multiple operations concurrently
      const promises = Array.from({ length: 5 }, () =>
        hostProfileService.createOrUpdateHostProfile(userId, profileData)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.business_name).toBe(profileData.business_name);
      });
    });
  });
});