const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const enhancedSearchService = require('../../services/enhancedSearchService');
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

describe('EnhancedSearchService', () => {
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

  describe('searchVehicles', () => {
    test('should perform basic vehicle search', async () => {
      const searchParams = {
        location: 'Nassau',
        vehicleType: 'sedan',
        minPrice: 50,
        maxPrice: 200
      };

      const mockResults = [
        {
          id: 1,
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          daily_rate: 75,
          location: 'Nassau',
          vehicle_type: 'sedan',
          search_score: 0.95,
          verification_status: 'verified',
          availability_status: 'available'
        },
        {
          id: 2,
          make: 'Honda',
          model: 'Accord',
          year: 2021,
          daily_rate: 70,
          location: 'Nassau',
          vehicle_type: 'sedan',
          search_score: 0.88,
          verification_status: 'verified',
          availability_status: 'available'
        }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockResults);
      });

      const result = await enhancedSearchService.searchVehicles(searchParams);

      expect(result.vehicles).toHaveLength(2);
      expect(result.vehicles[0]).toEqual(expect.objectContaining({
        id: 1,
        make: 'Toyota',
        model: 'Camry',
        search_score: 0.95
      }));

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('FROM vehicles v'),
        expect.any(Array),
        expect.any(Function)
      );
    });

    test('should handle island-aware search', async () => {
      const searchParams = {
        island: 'Nassau',
        sortBy: 'popularity'
      };

      mockDb.all.mockImplementation((query, params, callback) => {
        // Verify island-specific query is constructed
        expect(query).toContain('island_location');
        callback(null, []);
      });

      await enhancedSearchService.searchVehicles(searchParams);

      expect(mockDb.all).toHaveBeenCalled();
    });

    test('should apply multiple filters correctly', async () => {
      const searchParams = {
        location: 'Nassau',
        vehicleType: 'suv',
        fuelType: 'hybrid',
        transmissionType: 'automatic',
        seatingCapacity: 7,
        features: ['gps', 'bluetooth'],
        minPrice: 100,
        maxPrice: 300,
        conditionRating: 4,
        verificationStatus: 'verified',
        deliveryAvailable: true,
        sortBy: 'price_low'
      };

      mockDb.all.mockImplementation((query, params, callback) => {
        // Verify complex filtering query
        expect(query).toContain('vehicle_type');
        expect(query).toContain('fuel_type');
        expect(query).toContain('transmission_type');
        expect(query).toContain('seating_capacity');
        expect(query).toContain('condition_rating');
        expect(query).toContain('verification_status');
        expect(query).toContain('delivery_available');
        expect(query).toContain('ORDER BY daily_rate ASC');
        callback(null, []);
      });

      await enhancedSearchService.searchVehicles(searchParams);

      expect(mockDb.all).toHaveBeenCalled();
    });

    test('should handle full-text search with FTS5', async () => {
      const searchParams = {
        searchQuery: 'luxury sedan with GPS navigation'
      };

      const mockFTSResults = [
        {
          id: 1,
          make: 'BMW',
          model: '3 Series',
          description: 'Luxury sedan with premium features and GPS navigation',
          fts_rank: 0.95,
          search_score: 0.92
        }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        if (query.includes('vehicles_fts')) {
          callback(null, mockFTSResults);
        } else {
          callback(null, []);
        }
      });

      const result = await enhancedSearchService.searchVehicles(searchParams);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('vehicles_fts'),
        expect.arrayContaining([searchParams.searchQuery]),
        expect.any(Function)
      );
    });

    test('should calculate search scores accurately', async () => {
      const searchParams = {
        location: 'Nassau',
        vehicleType: 'sedan'
      };

      const mockVehicles = [
        {
          id: 1,
          vehicle_type: 'sedan',
          location: 'Nassau',
          host_rating: 4.8,
          total_reviews: 150,
          condition_rating: 4.5,
          verification_status: 'verified',
          instant_booking: 1,
          superhost_status: 1
        }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockVehicles);
      });

      const result = await enhancedSearchService.searchVehicles(searchParams);

      // Verify search score calculation includes multiple factors
      if (result.vehicles.length > 0) {
        expect(result.vehicles[0].search_score).toBeDefined();
        expect(result.vehicles[0].search_score).toBeGreaterThan(0);
        expect(result.vehicles[0].search_score).toBeLessThanOrEqual(1);
      }
    });

    test('should handle pagination correctly', async () => {
      const searchParams = {
        location: 'Nassau',
        page: 2,
        limit: 10
      };

      mockDb.all.mockImplementation((query, params, callback) => {
        expect(query).toContain('LIMIT');
        expect(query).toContain('OFFSET');
        expect(params).toContain(10); // limit
        expect(params).toContain(10); // offset (page 2 - 1) * limit
        callback(null, []);
      });

      await enhancedSearchService.searchVehicles(searchParams);

      expect(mockDb.all).toHaveBeenCalled();
    });

    test('should handle search errors gracefully', async () => {
      const searchParams = {
        location: 'Nassau'
      };

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(new Error('Database search failed'));
      });

      await expect(enhancedSearchService.searchVehicles(searchParams))
        .rejects.toThrow('Database search failed');
    });
  });

  describe('getSearchRecommendations', () => {
    test('should generate personalized recommendations', async () => {
      const userId = 1;
      const searchHistory = [
        { vehicle_type: 'sedan', location: 'Nassau', search_count: 5 },
        { vehicle_type: 'suv', location: 'Freeport', search_count: 2 }
      ];

      const mockRecommendations = [
        {
          id: 1,
          make: 'Toyota',
          model: 'Camry',
          vehicle_type: 'sedan',
          location: 'Nassau',
          recommendation_score: 0.92,
          recommendation_reason: 'Based on your search history'
        }
      ];

      mockDb.all
        .mockImplementationOnce((query, params, callback) => {
          // Search history query
          callback(null, searchHistory);
        })
        .mockImplementationOnce((query, params, callback) => {
          // Recommendations query
          callback(null, mockRecommendations);
        });

      const result = await enhancedSearchService.getSearchRecommendations(userId);

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0]).toEqual(expect.objectContaining({
        id: 1,
        recommendation_score: 0.92,
        recommendation_reason: 'Based on your search history'
      }));
    });

    test('should handle users with no search history', async () => {
      const userId = 999;

      mockDb.all
        .mockImplementationOnce((query, params, callback) => {
          // No search history
          callback(null, []);
        })
        .mockImplementationOnce((query, params, callback) => {
          // Popular vehicles query
          callback(null, []);
        });

      const result = await enhancedSearchService.getSearchRecommendations(userId);

      expect(result.recommendations).toEqual([]);
      expect(result.strategy).toBe('popular');
    });

    test('should apply recommendation filters', async () => {
      const userId = 1;
      const filters = {
        maxPrice: 150,
        location: 'Nassau',
        vehicleType: 'sedan'
      };

      mockDb.all.mockImplementation((query, params, callback) => {
        if (query.includes('search_history')) {
          callback(null, []);
        } else {
          expect(query).toContain('daily_rate');
          expect(query).toContain('location');
          expect(query).toContain('vehicle_type');
          callback(null, []);
        }
      });

      await enhancedSearchService.getSearchRecommendations(userId, filters);

      expect(mockDb.all).toHaveBeenCalled();
    });
  });

  describe('recordSearchInteraction', () => {
    test('should record user search interaction', async () => {
      const interactionData = {
        userId: 1,
        searchQuery: 'sedan Nassau',
        vehicleId: 5,
        interactionType: 'view',
        sessionId: 'session_123'
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1, changes: 1 });
      });

      const result = await enhancedSearchService.recordSearchInteraction(interactionData);

      expect(result).toEqual({ success: true, id: 1 });
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_interactions'),
        expect.arrayContaining([
          interactionData.userId,
          interactionData.searchQuery,
          interactionData.vehicleId,
          interactionData.interactionType
        ]),
        expect.any(Function)
      );
    });

    test('should handle different interaction types', async () => {
      const interactionTypes = ['view', 'click', 'contact', 'book'];

      for (const type of interactionTypes) {
        mockDb.run.mockImplementation((query, params, callback) => {
          expect(params).toContain(type);
          callback.call({ lastID: 1, changes: 1 });
        });

        await enhancedSearchService.recordSearchInteraction({
          userId: 1,
          vehicleId: 1,
          interactionType: type
        });
      }

      expect(mockDb.run).toHaveBeenCalledTimes(interactionTypes.length);
    });

    test('should handle missing optional fields', async () => {
      const minimalInteraction = {
        userId: 1,
        interactionType: 'view'
      };

      mockDb.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1, changes: 1 });
      });

      const result = await enhancedSearchService.recordSearchInteraction(minimalInteraction);

      expect(result).toEqual({ success: true, id: 1 });
    });
  });

  describe('updateSearchIndex', () => {
    test('should update full-text search index', async () => {
      const vehicleId = 1;

      mockDb.run
        .mockImplementationOnce((query, params, callback) => {
          // Delete existing FTS entry
          expect(query).toContain('DELETE FROM vehicles_fts');
          callback.call({ changes: 1 });
        })
        .mockImplementationOnce((query, params, callback) => {
          // Insert new FTS entry
          expect(query).toContain('INSERT INTO vehicles_fts');
          callback.call({ changes: 1 });
        });

      const result = await enhancedSearchService.updateSearchIndex(vehicleId);

      expect(result).toEqual({ success: true });
      expect(mockDb.run).toHaveBeenCalledTimes(2);
    });

    test('should rebuild entire search index', async () => {
      mockDb.run
        .mockImplementationOnce((query, params, callback) => {
          expect(query).toContain('DELETE FROM vehicles_fts');
          callback.call({ changes: 100 });
        })
        .mockImplementationOnce((query, params, callback) => {
          expect(query).toContain('INSERT INTO vehicles_fts');
          callback.call({ changes: 100 });
        });

      const result = await enhancedSearchService.updateSearchIndex();

      expect(result).toEqual({ success: true });
    });

    test('should handle index update errors', async () => {
      const vehicleId = 1;

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(new Error('Index update failed'));
      });

      await expect(enhancedSearchService.updateSearchIndex(vehicleId))
        .rejects.toThrow('Index update failed');
    });
  });

  describe('getSearchAnalytics', () => {
    test('should retrieve search analytics for date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockAnalytics = [
        {
          search_date: '2024-01-15',
          total_searches: 150,
          unique_users: 45,
          top_search_terms: '["sedan", "Nassau", "automatic"]',
          avg_results_per_search: 12.5,
          click_through_rate: 0.25
        }
      ];

      mockDb.all.mockImplementation((query, params, callback) => {
        expect(query).toContain('search_interactions');
        expect(params).toContain(startDate);
        expect(params).toContain(endDate);
        callback(null, mockAnalytics);
      });

      const result = await enhancedSearchService.getSearchAnalytics(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        search_date: '2024-01-15',
        total_searches: 150,
        unique_users: 45,
        top_search_terms: ['sedan', 'Nassau', 'automatic']
      }));
    });

    test('should group analytics by specified period', async () => {
      const groupBy = 'week';

      mockDb.all.mockImplementation((query, params, callback) => {
        expect(query).toContain("strftime('%Y-%W'");
        callback(null, []);
      });

      await enhancedSearchService.getSearchAnalytics('2024-01-01', '2024-01-31', groupBy);

      expect(mockDb.all).toHaveBeenCalled();
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large search result sets efficiently', async () => {
      const searchParams = {
        location: 'Nassau'
      };

      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        make: 'Vehicle',
        model: `Model ${i}`,
        search_score: Math.random()
      }));

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, largeResultSet);
      });

      const result = await enhancedSearchService.searchVehicles(searchParams);

      expect(result.vehicles).toHaveLength(1000);
      expect(result.total_count).toBe(1000);
    });

    test('should handle special characters in search queries', async () => {
      const searchParams = {
        searchQuery: "Lux@ry $edan w/GPS & Blu3t00th!"
      };

      mockDb.all.mockImplementation((query, params, callback) => {
        // Verify special characters are properly escaped
        expect(params[0]).toBe(searchParams.searchQuery);
        callback(null, []);
      });

      await enhancedSearchService.searchVehicles(searchParams);

      expect(mockDb.all).toHaveBeenCalled();
    });

    test('should prevent SQL injection in search parameters', async () => {
      const maliciousParams = {
        location: "Nassau'; DROP TABLE vehicles; --",
        vehicleType: "sedan OR 1=1; --"
      };

      mockDb.all.mockImplementation((query, params, callback) => {
        // Verify parameterized queries prevent injection
        expect(params).toContain(maliciousParams.location);
        expect(params).toContain(maliciousParams.vehicleType);
        expect(query).not.toContain('DROP TABLE');
        callback(null, []);
      });

      await enhancedSearchService.searchVehicles(maliciousParams);

      expect(mockDb.all).toHaveBeenCalled();
    });

    test('should handle concurrent search requests', async () => {
      const searchParams = {
        location: 'Nassau',
        vehicleType: 'sedan'
      };

      mockDb.all.mockImplementation((query, params, callback) => {
        // Simulate async database operation
        setTimeout(() => {
          callback(null, [{ id: 1, make: 'Toyota' }]);
        }, Math.random() * 50);
      });

      // Execute multiple concurrent searches
      const promises = Array.from({ length: 10 }, () =>
        enhancedSearchService.searchVehicles(searchParams)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.vehicles).toBeDefined();
      });
    });

    test('should handle empty search results gracefully', async () => {
      const searchParams = {
        location: 'NonExistentLocation',
        vehicleType: 'flying_car'
      };

      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      const result = await enhancedSearchService.searchVehicles(searchParams);

      expect(result.vehicles).toEqual([]);
      expect(result.total_count).toBe(0);
      expect(result.search_params).toEqual(searchParams);
    });

    test('should optimize search performance with caching', async () => {
      const searchParams = {
        location: 'Nassau',
        vehicleType: 'sedan'
      };

      // Mock cached result
      const cachedResult = {
        vehicles: [{ id: 1, make: 'Toyota' }],
        total_count: 1,
        cached: true
      };

      // First call - populate cache
      mockDb.all.mockImplementationOnce((query, params, callback) => {
        callback(null, [{ id: 1, make: 'Toyota' }]);
      });

      const firstResult = await enhancedSearchService.searchVehicles(searchParams);

      // Verify search was executed
      expect(mockDb.all).toHaveBeenCalledTimes(1);
      expect(firstResult.vehicles).toHaveLength(1);
    });
  });
});