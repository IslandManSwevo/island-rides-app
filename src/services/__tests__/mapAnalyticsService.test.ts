import { mapAnalyticsService } from '../mapAnalyticsService';
import { VehicleRecommendation } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockVehicleRecommendation: VehicleRecommendation = {
  id: '1',
  recommendationScore: 0.9,
  type: 'sedan',
  island: 'Nassau',
  pricePerDay: 65,
  scoreBreakdown: {
    collaborativeFiltering: 0.2,
    vehiclePopularity: 0.3,
    vehicleRating: 0.3,
    hostPopularity: 0.1,
  },
  score: 0.9,
  reasons: ['Highly rated'],
  vehicle: {
    id: 1,
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    latitude: 25.0343,
    longitude: -77.3963,
    averageRating: 4.5,
    seatingCapacity: 5,
    // Add required properties
    ownerId: 1,
    location: 'Nassau Downtown',
    dailyRate: 65,
    available: true,
    driveSide: 'LHD',
    createdAt: '2024-01-15',
    vehicleType: 'sedan',
    color: 'Silver',
    description: 'Clean and reliable sedan'
  }
};

describe('MapAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startSession', () => {
    it('should create a new session and return session ID', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const sessionId = await mapAnalyticsService.startSession('Nassau');

      expect(sessionId).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'currentMapSession',
        expect.stringContaining('Nassau')
      );
    });

    it('should include user location in session data', async () => {
      const userLocation = { latitude: 25.0343, longitude: -77.3963 };
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await mapAnalyticsService.startSession('Nassau', undefined, userLocation);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'currentMapSession',
        expect.stringContaining('"userLocation":{"latitude":25.0343,"longitude":-77.3963}')
      );
    });
  });

  describe('endSession', () => {
    it('should move current session to history and clear current session', async () => {
      const mockSession = {
        id: 'session1',
        island: 'Nassau',
        startTime: new Date().toISOString(),
        totalInteractions: 5,
        vehiclesViewed: ['1', '2']
      };

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockSession)) // Current session
        .mockResolvedValueOnce('[]'); // Existing sessions

      await mapAnalyticsService.endSession();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapSessions',
        expect.stringContaining('session1')
      );
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('currentMapSession');
    });
  });

  describe('trackVehicleClick', () => {
    it('should track vehicle click interaction', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify({ id: 'session1' })) // Current session
        .mockResolvedValueOnce('[]'); // Existing interactions

      await mapAnalyticsService.trackVehicleClick('1', mockVehicleRecommendation);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapInteractions',
        expect.stringContaining('"type":"vehicle_click"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapInteractions',
        expect.stringContaining('"vehicleId":"1"')
      );
    });
  });

  describe('trackClusterClick', () => {
    it('should track cluster click interaction', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify({ id: 'session1' })) // Current session
        .mockResolvedValueOnce('[]'); // Existing interactions

      const vehicles = [mockVehicleRecommendation];
      await mapAnalyticsService.trackClusterClick('cluster1', vehicles, 'Nassau');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapInteractions',
        expect.stringContaining('"type":"cluster_click"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapInteractions',
        expect.stringContaining('"clusterId":"cluster1"')
      );
    });
  });

  describe('trackMapDrag', () => {
    it('should track map drag interaction', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify({ id: 'session1' })) // Current session
        .mockResolvedValueOnce('[]'); // Existing interactions

      const coordinates = { latitude: 25.0343, longitude: -77.3963 };
      await mapAnalyticsService.trackMapDrag(coordinates, 'Nassau');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapInteractions',
        expect.stringContaining('"type":"map_drag"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapInteractions',
        expect.stringContaining('"coordinates":{"latitude":25.0343,"longitude":-77.3963}')
      );
    });
  });

  describe('trackZoomChange', () => {
    it('should track zoom in for high zoom levels', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify({ id: 'session1' })) // Current session
        .mockResolvedValueOnce('[]'); // Existing interactions

      const coordinates = { latitude: 25.0343, longitude: -77.3963 };
      await mapAnalyticsService.trackZoomChange(15, 'Nassau', coordinates);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapInteractions',
        expect.stringContaining('"type":"zoom_in"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapInteractions',
        expect.stringContaining('"zoomLevel":15')
      );
    });

    it('should track zoom out for low zoom levels', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify({ id: 'session1' })) // Current session
        .mockResolvedValueOnce('[]'); // Existing interactions

      const coordinates = { latitude: 25.0343, longitude: -77.3963 };
      await mapAnalyticsService.trackZoomChange(8, 'Nassau', coordinates);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'mapInteractions',
        expect.stringContaining('"type":"zoom_out"')
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      const mockInteractions = [
        {
          id: '1',
          type: 'vehicle_click',
          vehicleId: '1',
          island: 'Nassau',
          timestamp: new Date().toISOString(),
          sessionId: 'session1',
          coordinates: { latitude: 25.0343, longitude: -77.3963 }
        },
        {
          id: '2',
          type: 'cluster_click',
          clusterId: 'cluster1',
          island: 'Nassau',
          timestamp: new Date().toISOString(),
          sessionId: 'session1',
          coordinates: { latitude: 25.0343, longitude: -77.3963 }
        }
      ];

      const mockSessions = [
        {
          id: 'session1',
          island: 'Nassau',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          totalInteractions: 2,
          vehiclesViewed: ['1']
        }
      ];

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockInteractions))
        .mockResolvedValueOnce(JSON.stringify(mockSessions));

      const analytics = await mapAnalyticsService.getAnalytics();

      expect(analytics).toHaveProperty('popularVehicles');
      expect(analytics).toHaveProperty('hotspots');
      expect(analytics).toHaveProperty('clusteringMetrics');
      expect(analytics).toHaveProperty('userBehavior');
      expect(analytics.popularVehicles).toHaveLength(1);
      expect(analytics.popularVehicles[0].vehicleId).toBe('1');
    });

    it('should filter analytics by island', async () => {
      const mockInteractions = [
        {
          id: '1',
          type: 'vehicle_click',
          vehicleId: '1',
          island: 'Nassau',
          timestamp: new Date().toISOString(),
          sessionId: 'session1'
        },
        {
          id: '2',
          type: 'vehicle_click',
          vehicleId: '2',
          island: 'Freeport',
          timestamp: new Date().toISOString(),
          sessionId: 'session2'
        }
      ];

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockInteractions))
        .mockResolvedValueOnce('[]');

      const analytics = await mapAnalyticsService.getAnalytics('Nassau');

      expect(analytics.popularVehicles).toHaveLength(1);
      expect(analytics.popularVehicles[0].vehicleId).toBe('1');
    });
  });

  describe('getSessionSummary', () => {
    it('should return session summary statistics', async () => {
      const mockSessions = [
        {
          id: 'session1',
          island: 'Nassau',
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          endTime: new Date().toISOString(),
          totalInteractions: 5,
          vehiclesViewed: ['1', '2']
        },
        {
          id: 'session2',
          island: 'Freeport',
          startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          endTime: new Date().toISOString(),
          totalInteractions: 3,
          vehiclesViewed: ['3']
        }
      ];

      const mockInteractions = [
        { id: '1', type: 'vehicle_click', sessionId: 'session1' },
        { id: '2', type: 'vehicle_click', sessionId: 'session1' },
        { id: '3', type: 'vehicle_click', sessionId: 'session2' }
      ];

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockSessions))
        .mockResolvedValueOnce(JSON.stringify(mockInteractions));

      const summary = await mapAnalyticsService.getSessionSummary();

      expect(summary.totalSessions).toBe(2);
      expect(summary.totalInteractions).toBe(3);
      expect(summary.averageSessionDuration).toBeGreaterThan(0);
      expect(summary.topIslands).toHaveLength(2);
      expect(summary.topIslands[0].island).toBe('Nassau'); // More recent/active
    });
  });

  describe('clearAnalytics', () => {
    it('should clear all analytics data', async () => {
      await mapAnalyticsService.clearAnalytics();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('mapInteractions');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('mapSessions');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('currentMapSession');
    });
  });

  describe('error handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const analytics = await mapAnalyticsService.getAnalytics();

      // Should return empty analytics instead of throwing
      expect(analytics.popularVehicles).toEqual([]);
      expect(analytics.hotspots).toEqual([]);
      expect(analytics.clusteringMetrics.totalClusters).toBe(0);
    });

    it('should handle missing session data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await expect(mapAnalyticsService.trackVehicleClick('1', mockVehicleRecommendation))
        .resolves.not.toThrow();
    });
  });
});