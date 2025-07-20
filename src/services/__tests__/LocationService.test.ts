import { locationService } from '../LocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage methods
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;
const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;

describe('LocationService Island Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectIslandFromCoordinates', () => {
    it('should detect Nassau from Nassau coordinates', () => {
      const nassauCoords = { latitude: 25.0743, longitude: -77.3963 };
      const result = locationService.detectIslandFromCoordinates(nassauCoords);
      expect(result).toBe('Nassau');
    });

    it('should detect Freeport from Freeport coordinates', () => {
      const freeportCoords = { latitude: 26.5333, longitude: -78.7000 };
      const result = locationService.detectIslandFromCoordinates(freeportCoords);
      expect(result).toBe('Freeport');
    });

    it('should detect Exuma from Exuma coordinates', () => {
      const exumaCoords = { latitude: 23.5167, longitude: -75.8333 };
      const result = locationService.detectIslandFromCoordinates(exumaCoords);
      expect(result).toBe('Exuma');
    });

    it('should return null for coordinates outside island bounds', () => {
      const outsideCoords = { latitude: 0, longitude: 0 };
      const result = locationService.detectIslandFromCoordinates(outsideCoords);
      expect(result).toBeNull();
    });
  });

  describe('saveLastKnownIsland', () => {
    it('should save island to AsyncStorage', async () => {
      await locationService.saveLastKnownIsland('Nassau');
      expect(mockSetItem).toHaveBeenCalledWith('lastKnownIsland', 'Nassau');
    });
  });

  describe('getLastKnownIsland', () => {
    it('should retrieve island from AsyncStorage', async () => {
      mockGetItem.mockResolvedValue('Freeport');
      const result = await locationService.getLastKnownIsland();
      expect(result).toBe('Freeport');
      expect(mockGetItem).toHaveBeenCalledWith('lastKnownIsland');
    });

    it('should return null when no island is stored', async () => {
      mockGetItem.mockResolvedValue(null);
      const result = await locationService.getLastKnownIsland();
      expect(result).toBeNull();
    });
  });

  describe('saveIslandPreference', () => {
    it('should save island preference to AsyncStorage', async () => {
      await locationService.saveIslandPreference('Exuma');
      expect(mockSetItem).toHaveBeenCalledWith('islandPreference', 'Exuma');
    });
  });

  describe('getIslandPreference', () => {
    it('should retrieve island preference from AsyncStorage', async () => {
      mockGetItem.mockResolvedValue('Nassau');
      const result = await locationService.getIslandPreference();
      expect(result).toBe('Nassau');
      expect(mockGetItem).toHaveBeenCalledWith('islandPreference');
    });
  });

  describe('hasAskedForLocationPermission', () => {
    it('should return true when permission was previously asked', async () => {
      mockGetItem.mockResolvedValue('true');
      const result = await locationService.hasAskedForLocationPermission();
      expect(result).toBe(true);
    });

    it('should return false when permission was never asked', async () => {
      mockGetItem.mockResolvedValue(null);
      const result = await locationService.hasAskedForLocationPermission();
      expect(result).toBe(false);
    });
  });
});