import { searchIntelligenceService } from '../searchIntelligenceService';
import { SearchFilters, VehicleRecommendation } from '../../types';
import { TripPurpose, RecommendationScore } from '../searchIntelligenceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

const mockFilters: SearchFilters = {
  island: 'Nassau',
  startDate: new Date('2023-12-01'),
  endDate: new Date('2023-12-03'),
  priceRange: [50, 150],
  vehicleTypes: ['sedan'],
  fuelTypes: [],
  transmissionTypes: [],
  minSeatingCapacity: 2,
  features: [],
  minConditionRating: 4,
  verificationStatus: ['verified'],
  deliveryAvailable: false,
  airportPickup: false,
  instantBooking: true,
  sortBy: 'rating'
};

describe('SearchIntelligenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectTripPurpose', () => {
    it('should detect business trip purpose', async () => {
      const businessFilters: SearchFilters = {
        ...mockFilters,
        vehicleTypes: ['sedan'],
        verificationStatus: ['verified'],
        instantBooking: true,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-02') // 1 day trip
      };

      const result = await searchIntelligenceService.detectTripPurpose(businessFilters);
      
      expect(result.type).toBe('business');
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.indicators).toContain('Professional vehicle type');
    });

    it('should detect family trip purpose', async () => {
      const familyFilters: SearchFilters = {
        ...mockFilters,
        vehicleTypes: ['suv'],
        minSeatingCapacity: 7,
        features: [1, 2], // Safety features
      };

      const result = await searchIntelligenceService.detectTripPurpose(familyFilters);
      
      expect(result.type).toBe('family');
      expect(result.indicators).toContain('Family-sized vehicle');
      expect(result.indicators).toContain('Large group size');
    });

    it('should detect luxury trip purpose', async () => {
      const luxuryFilters: SearchFilters = {
        ...mockFilters,
        vehicleTypes: ['luxury', 'convertible'],
        priceRange: [200, 500],
        features: [6, 7], // Luxury features
      };

      const result = await searchIntelligenceService.detectTripPurpose(luxuryFilters);
      
      expect(result.type).toBe('luxury');
      expect(result.indicators).toContain('Luxury vehicle preference');
      expect(result.indicators).toContain('Premium price range');
    });

    it('should return unknown for unclear patterns', async () => {
      const unclearFilters: SearchFilters = {
        ...mockFilters,
        vehicleTypes: [],
        priceRange: [50, 300],
        minSeatingCapacity: 1,
        features: [],
        verificationStatus: [], // Remove business indicators
        instantBooking: false,  // Remove business indicators
        startDate: null,   // Remove dates to avoid duration scoring
        endDate: null      // Remove dates to avoid duration scoring
      };

      const result = await searchIntelligenceService.detectTripPurpose(unclearFilters);
      
      expect(result.type).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.3);
    });
  });

  describe('generateRecommendations', () => {
    const mockVehicles: VehicleRecommendation[] = [
      {
        id: '1',
        vehicle: {
          id: 1,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          ownerId: 1,
          location: 'Nassau',
          dailyRate: 80,
          available: true,
          driveSide: 'LHD',
          createdAt: '2023-01-01',
          vehicleType: 'sedan',
          rating: 4.5,
          verificationStatus: 'verified',
          instantBooking: true,
          seatingCapacity: 4,
          conditionRating: 4
        },
        recommendationScore: 0,
        type: 'standard',
        island: 'Nassau',
        pricePerDay: 80,
        scoreBreakdown: {
          collaborativeFiltering: 0,
          vehiclePopularity: 0,
          vehicleRating: 0,
          hostPopularity: 0
        }
      },
      {
        id: '2',
        vehicle: {
          id: 2,
          make: 'Ford',
          model: 'Explorer',
          year: 2019,
          ownerId: 2,
          location: 'Nassau',
          dailyRate: 120,
          available: true,
          driveSide: 'LHD',
          createdAt: '2023-01-01',
          vehicleType: 'suv',
          rating: 4.2,
          verificationStatus: 'verified',
          instantBooking: false,
          seatingCapacity: 7,
          conditionRating: 5
        },
        recommendationScore: 0,
        type: 'standard',
        island: 'Nassau',
        pricePerDay: 120,
        scoreBreakdown: {
          collaborativeFiltering: 0,
          vehiclePopularity: 0,
          vehicleRating: 0,
          hostPopularity: 0
        }
      }
    ];

    it('should generate recommendations with scores', async () => {
      const tripPurpose = {
        type: 'business' as const,
        confidence: 0.8,
        indicators: ['Professional vehicle type']
      };

      const result = await searchIntelligenceService.generateRecommendations(
        mockFilters,
        mockVehicles,
        tripPurpose
      );

      expect(result).toHaveLength(2);
      expect(result[0].score).toBeGreaterThan(0);
      expect(result[0].reasons).toBeDefined();
      expect(result[0].vehicleId).toBeDefined();
    });

    it('should rank business vehicles higher for business trips', async () => {
      const tripPurpose = {
        type: 'business' as const,
        confidence: 0.8,
        indicators: ['Professional vehicle type']
      };

      const result = await searchIntelligenceService.generateRecommendations(
        mockFilters,
        mockVehicles,
        tripPurpose
      );

      // Sedan (business-appropriate) should score higher than SUV for business trips
      const sedanScore = result.find(r => r.vehicleId === '1')?.score || 0;
      const suvScore = result.find(r => r.vehicleId === '2')?.score || 0;
      
      expect(sedanScore).toBeGreaterThan(suvScore);
    });

    it('should include relevant reasons in recommendations', async () => {
      const tripPurpose = {
        type: 'business' as const,
        confidence: 0.8,
        indicators: []
      };

      const result = await searchIntelligenceService.generateRecommendations(
        mockFilters,
        mockVehicles,
        tripPurpose
      );

      const sedanRecommendation = result.find(r => r.vehicleId === '1');
      expect(sedanRecommendation?.reasons).toContain('Professional vehicle type');
      expect(sedanRecommendation?.reasons).toContain('Verified host');
      expect(sedanRecommendation?.reasons).toContain('Instant booking available');
    });
  });

  describe('saveSearchPattern and getSearchHistory', () => {
    it('should save and retrieve search patterns', async () => {
      const mockPattern = {
        searchFilters: mockFilters,
        timestamp: new Date(),
        bookingMade: true,
        vehicleBooked: 'vehicle123'
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await searchIntelligenceService.saveSearchPattern(mockPattern);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'searchHistory',
        JSON.stringify([mockPattern])
      );
    });

    it('should return empty array when no history exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await searchIntelligenceService.getSearchHistory();

      expect(result).toEqual([]);
    });

    it('should limit search history to 50 entries', async () => {
      const existingHistory = Array(50).fill(null).map((_, i) => ({
        searchFilters: mockFilters,
        timestamp: new Date(),
        bookingMade: false
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingHistory));

      const newPattern = {
        searchFilters: mockFilters,
        timestamp: new Date(),
        bookingMade: true
      };

      await searchIntelligenceService.saveSearchPattern(newPattern);

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(50); // Should still be 50 after adding one and removing one
      
      // Check the structure of the last item (dates will be serialized as strings)
      const lastItem = savedData[49];
      
      // Create expected filters with serialized dates
      const expectedFilters = {
        ...mockFilters,
        startDate: mockFilters.startDate ? mockFilters.startDate.toISOString() : null,
        endDate: mockFilters.endDate ? mockFilters.endDate.toISOString() : null
      };
      
      expect(lastItem.searchFilters).toEqual(expectedFilters);
      expect(lastItem.bookingMade).toBe(true);
      expect(typeof lastItem.timestamp).toBe('string'); // Date becomes string after JSON serialization
    });
  });

  describe('updateUserPreferences and getUserPreferences', () => {
    it('should update user preferences after booking', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{}');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await searchIntelligenceService.updateUserPreferences(mockFilters, true);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'userPreferences',
        expect.stringContaining('"hasBookings":true')
      );
    });

    it('should track preferred vehicle types', async () => {
      const existingPreferences = {
        preferredVehicleTypes: [{ type: 'sedan', count: 1 }]
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingPreferences));

      await searchIntelligenceService.updateUserPreferences(mockFilters, true);

      const savedCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedPreferences = JSON.parse(savedCall[1]);
      
      expect(savedPreferences.preferredVehicleTypes).toBeDefined();
      expect(savedPreferences.preferredVehicleTypes[0].count).toBe(2); // Should increment
    });

    it('should return empty object when no preferences exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await searchIntelligenceService.getUserPreferences();

      expect(result).toEqual({});
    });
  });

  describe('generateCollaborativeRecommendations', () => {
    it('should return vehicle IDs based on similar search patterns', async () => {
      const mockHistory = [
        {
          searchFilters: { ...mockFilters, island: 'Nassau' },
          timestamp: new Date(),
          bookingMade: true,
          vehicleBooked: 'vehicle1'
        },
        {
          searchFilters: { ...mockFilters, island: 'Nassau' },
          timestamp: new Date(),
          bookingMade: true,
          vehicleBooked: 'vehicle1'
        }
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory));

      const result = await searchIntelligenceService.generateCollaborativeRecommendations(
        mockFilters,
        'Nassau'
      );

      expect(result).toContain('vehicle1');
    });

    it('should return empty array when no similar patterns exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');

      const result = await searchIntelligenceService.generateCollaborativeRecommendations(
        mockFilters,
        'Nassau'
      );

      expect(result).toEqual([]);
    });
  });
});