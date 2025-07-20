import { searchNotificationService } from '../searchNotificationService';
import { SearchFilters } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vehicleService } from '../vehicleService';
import { notificationService } from '../notificationService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

// Mock vehicle service
jest.mock('../vehicleService', () => ({
  vehicleService: {
    searchVehicles: jest.fn()
  }
}));

// Mock notification service
jest.mock('../notificationService', () => ({
  notificationService: {
    info: jest.fn()
  }
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

describe('SearchNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSavedSearch', () => {
    it('should save a new search successfully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (vehicleService.searchVehicles as jest.Mock).mockResolvedValue([]);

      const searchData = {
        name: 'Test Search',
        filters: mockFilters,
        isActive: true,
        notificationEnabled: true,
        notificationFrequency: 'daily' as const,
        lastChecked: new Date(),
        lastNotified: null,
        matchCount: 0
      };

      const result = await searchNotificationService.saveSavedSearch(searchData);

      expect(result.name).toBe('Test Search');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'savedSearches',
        expect.stringContaining('Test Search')
      );
    });

    it('should check for matches after saving', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (vehicleService.searchVehicles as jest.Mock).mockResolvedValue([
        { id: 'vehicle1', vehicle: { id: 'vehicle1', price: 100 } }
      ]);

      const searchData = {
        name: 'Test Search',
        filters: mockFilters,
        isActive: true,
        notificationEnabled: true,
        notificationFrequency: 'daily' as const,
        lastChecked: new Date(),
        lastNotified: null,
        matchCount: 0
      };

      await searchNotificationService.saveSavedSearch(searchData);

      expect(vehicleService.searchVehicles).toHaveBeenCalled();
    });
  });

  describe('getSavedSearches', () => {
    it('should return empty array when no searches exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await searchNotificationService.getSavedSearches();

      expect(result).toEqual([]);
    });

    it('should return saved searches with correct date parsing', async () => {
      const mockSavedSearches = [
        {
          id: '1',
          name: 'Test Search',
          filters: mockFilters,
          isActive: true,
          notificationEnabled: true,
          notificationFrequency: 'daily' as const,
          lastChecked: new Date().toISOString(),
          lastNotified: null,
          matchCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSavedSearches));

      const result = await searchNotificationService.getSavedSearches();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Search');
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].lastChecked).toBeInstanceOf(Date);
    });
  });

  describe('updateSavedSearch', () => {
    it('should update an existing search', async () => {
      const existingSearch = {
        id: '1',
        name: 'Test Search',
        filters: mockFilters,
        isActive: true,
        notificationEnabled: true,
        notificationFrequency: 'daily' as const,
        lastChecked: new Date(),
        lastNotified: null,
        matchCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingSearch]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await searchNotificationService.updateSavedSearch('1', { matchCount: 10 });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'savedSearches',
        expect.stringContaining('"matchCount":10')
      );
    });

    it('should throw error if search not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');

      await expect(
        searchNotificationService.updateSavedSearch('nonexistent', { matchCount: 10 })
      ).rejects.toThrow('Saved search not found');
    });
  });

  describe('deleteSavedSearch', () => {
    it('should remove search from storage', async () => {
      const searches = [
        { id: '1', name: 'Search 1' },
        { id: '2', name: 'Search 2' }
      ];

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(searches)) // For getSavedSearches
        .mockResolvedValueOnce('[]'); // For getSearchAlerts

      await searchNotificationService.deleteSavedSearch('1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'savedSearches',
        expect.not.stringContaining('Search 1')
      );
    });
  });

  describe('toggleSearchActive', () => {
    it('should toggle the active state of a search', async () => {
      const search = {
        id: '1',
        name: 'Test Search',
        isActive: true,
        filters: mockFilters,
        notificationEnabled: true,
        notificationFrequency: 'daily' as const,
        lastChecked: new Date(),
        lastNotified: null,
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([search]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await searchNotificationService.toggleSearchActive('1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'savedSearches',
        expect.stringContaining('"isActive":false')
      );
    });
  });

  describe('checkForMatches', () => {
    it('should detect new vehicles and create alerts', async () => {
      const savedSearch = {
        id: '1',
        name: 'Test Search',
        filters: mockFilters,
        isActive: true,
        notificationEnabled: true,
        notificationFrequency: 'daily' as const,
        lastChecked: new Date(),
        lastNotified: null,
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (vehicleService.searchVehicles as jest.Mock).mockResolvedValue([
        { id: 'vehicle1', vehicle: { id: 'vehicle1', price: 100 } },
        { id: 'vehicle2', vehicle: { id: 'vehicle2', price: 120 } }
      ]);
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify([savedSearch])) // For updateSavedSearch
        .mockResolvedValueOnce('{"enabled":true}') // For getNotificationPreferences
        .mockResolvedValueOnce('[]'); // For getSearchAlerts

      await searchNotificationService.checkForMatches(savedSearch);

      expect(vehicleService.searchVehicles).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'savedSearches',
        expect.stringContaining('"matchCount":2')
      );
    });

    it('should not process inactive searches', async () => {
      const inactiveSearch = {
        id: '1',
        name: 'Test Search',
        filters: mockFilters,
        isActive: false,
        notificationEnabled: true,
        notificationFrequency: 'daily' as const,
        lastChecked: new Date(),
        lastNotified: null,
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await searchNotificationService.checkForMatches(inactiveSearch);

      expect(vehicleService.searchVehicles).not.toHaveBeenCalled();
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return default preferences when none exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await searchNotificationService.getNotificationPreferences();

      expect(result.enabled).toBe(true);
      expect(result.frequency).toBe('daily');
      expect(result.quietHours.enabled).toBe(true);
    });

    it('should merge stored preferences with defaults', async () => {
      const storedPreferences = {
        enabled: false,
        frequency: 'weekly'
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedPreferences));

      const result = await searchNotificationService.getNotificationPreferences();

      expect(result.enabled).toBe(false);
      expect(result.frequency).toBe('weekly');
      expect(result.quietHours.enabled).toBe(true); // Should still have default
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const currentPreferences = {
        enabled: true,
        frequency: 'daily',
        quietHours: { enabled: true, start: '22:00', end: '08:00' },
        alertTypes: {
          newVehicle: true,
          priceDrops: true,
          availability: true,
          featureMatches: true
        }
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(currentPreferences));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await searchNotificationService.updateNotificationPreferences({
        enabled: false,
        frequency: 'weekly'
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notificationPreferences',
        expect.stringContaining('"enabled":false')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notificationPreferences',
        expect.stringContaining('"frequency":"weekly"')
      );
    });
  });

  describe('shareSavedSearch', () => {
    it('should generate shareable URL for saved search', async () => {
      const search = {
        id: '1',
        name: 'Beach Trip Search',
        filters: mockFilters,
        isActive: true,
        notificationEnabled: true,
        notificationFrequency: 'daily' as const,
        lastChecked: new Date(),
        lastNotified: null,
        matchCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([search]));

      const result = await searchNotificationService.shareSavedSearch('1');

      expect(result).toContain('islandrides://search/shared');
      expect(result).toContain('data=');
    });

    it('should throw error for non-existent search', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');

      await expect(
        searchNotificationService.shareSavedSearch('nonexistent')
      ).rejects.toThrow('Saved search not found');
    });
  });

  describe('getSearchStatistics', () => {
    it('should calculate correct statistics', async () => {
      const searches = [
        {
          id: '1',
          name: 'Search 1',
          isActive: true,
          matchCount: 10,
          filters: mockFilters,
          notificationEnabled: true,
          notificationFrequency: 'daily' as const,
          lastChecked: new Date(),
          lastNotified: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Search 2',
          isActive: false,
          matchCount: 5,
          filters: mockFilters,
          notificationEnabled: true,
          notificationFrequency: 'daily' as const,
          lastChecked: new Date(),
          lastNotified: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const alerts = [
        { id: '1', isRead: false, savedSearchId: '1', alertType: 'new_vehicle', message: 'Test', vehicleId: 'v1', createdAt: new Date() },
        { id: '2', isRead: true, savedSearchId: '1', alertType: 'new_vehicle', message: 'Test', vehicleId: 'v2', createdAt: new Date() }
      ];

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(searches))
        .mockResolvedValueOnce(JSON.stringify(alerts));

      const result = await searchNotificationService.getSearchStatistics();

      expect(result.totalSavedSearches).toBe(2);
      expect(result.activeSavedSearches).toBe(1);
      expect(result.totalAlerts).toBe(2);
      expect(result.unreadAlerts).toBe(1);
      expect(result.averageMatchCount).toBe(7.5);
      expect(result.mostActiveSearch?.name).toBe('Search 1');
    });
  });
});
