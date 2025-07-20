import * as Location from 'expo-location';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Island } from '../types';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coords: Coordinates;
  timestamp: number;
}

export interface Address {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

export interface IslandBounds {
  island: Island;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Define geographical bounds for each island in The Bahamas
const ISLAND_BOUNDS: IslandBounds[] = [
  {
    island: 'Nassau',
    bounds: {
      north: 25.145,
      south: 25.040,
      east: -77.300,
      west: -77.560
    }
  },
  {
    island: 'Freeport',
    bounds: {
      north: 26.600,
      south: 26.450,
      east: -78.580,
      west: -78.800
    }
  },
  {
    island: 'Exuma',
    bounds: {
      north: 24.500,
      south: 23.400,
      east: -75.600,
      west: -76.200
    }
  }
];

const STORAGE_KEYS = {
  LAST_KNOWN_ISLAND: 'lastKnownIsland',
  ISLAND_PREFERENCE: 'islandPreference',
  LOCATION_PERMISSION_ASKED: 'locationPermissionAsked'
};

class LocationService {
  private currentLocation: LocationData | null = null;

  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.currentLocation = {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async getAddressFromCoordinates(coords: Coordinates): Promise<Address | null> {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (address && typeof address === 'object') {
        return {
          street: address.street || undefined,
          city: address.city || undefined,
          region: address.region || undefined,
          country: address.country || undefined,
          postalCode: address.postalCode || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return null;
    }
  }

  async getCoordinatesFromAddress(address: string): Promise<Coordinates | null> {
    try {
      const geocodedLocation = await Location.geocodeAsync(address);
      
      if (geocodedLocation && geocodedLocation.length > 0) {
        return {
          latitude: geocodedLocation[0].latitude,
          longitude: geocodedLocation[0].longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      return null;
    }
  }

  async watchLocation(callback: (location: LocationData) => void): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const locationData: LocationData = {
            coords: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            timestamp: location.timestamp,
          };
          callback(locationData);
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }

  calculateDistance(
    coords1: Coordinates,
    coords2: Coordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(coords2.latitude - coords1.latitude);
    const dLon = this.degreesToRadians(coords2.longitude - coords1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(coords1.latitude)) * 
      Math.cos(this.degreesToRadians(coords2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getCurrentLocationSync(): LocationData | null {
    return this.currentLocation;
  }

  // Predefined locations for Bahamas
  getBahamasLocations() {
    return {
      nassau: {
        latitude: 25.0343,
        longitude: -77.3963,
        name: 'Nassau',
      },
      freeport: {
        latitude: 26.5333,
        longitude: -78.7000,
        name: 'Freeport',
      },
      exuma: {
        latitude: 23.5167,
        longitude: -75.8333,
        name: 'Exuma',
      },
      paradiseIsland: {
        latitude: 25.0833,
        longitude: -77.3167,
        name: 'Paradise Island',
      },
    };
  }

  /**
   * Detect which island the user is currently on based on coordinates
   */
  detectIslandFromCoordinates(coordinates: Coordinates): Island | null {
    for (const islandBound of ISLAND_BOUNDS) {
      const { bounds } = islandBound;
      
      if (
        coordinates.latitude >= bounds.south &&
        coordinates.latitude <= bounds.north &&
        coordinates.longitude >= bounds.west &&
        coordinates.longitude <= bounds.east
      ) {
        return islandBound.island;
      }
    }
    
    return null;
  }

  /**
   * Get the user's current island with intelligent fallback
   */
  async detectCurrentIsland(): Promise<Island | null> {
    try {
      // Try to get current location
      const location = await this.getCurrentLocation();
      
      if (location) {
        const detectedIsland = this.detectIslandFromCoordinates(location.coords);
        
        if (detectedIsland) {
          // Save as last known island
          await this.saveLastKnownIsland(detectedIsland);
          return detectedIsland;
        }
      }
      
      // Fallback to last known island
      const lastKnownIsland = await this.getLastKnownIsland();
      if (lastKnownIsland) {
        return lastKnownIsland;
      }
      
      // Fallback to island preference
      const preference = await this.getIslandPreference();
      if (preference) {
        return preference;
      }
      
      // Default fallback to Nassau
      return 'Nassau';
      
    } catch (error) {
      console.error('Error detecting current island:', error);
      
      // Return saved preference or default
      const preference = await this.getIslandPreference();
      return preference || 'Nassau';
    }
  }

  /**
   * Save the last known island
   */
  async saveLastKnownIsland(island: Island): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_KNOWN_ISLAND, island);
    } catch (error) {
      console.error('Error saving last known island:', error);
    }
  }

  /**
   * Get the last known island
   */
  async getLastKnownIsland(): Promise<Island | null> {
    try {
      const island = await AsyncStorage.getItem(STORAGE_KEYS.LAST_KNOWN_ISLAND);
      return island as Island | null;
    } catch (error) {
      console.error('Error getting last known island:', error);
      return null;
    }
  }

  /**
   * Save user's island preference
   */
  async saveIslandPreference(island: Island): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ISLAND_PREFERENCE, island);
    } catch (error) {
      console.error('Error saving island preference:', error);
    }
  }

  /**
   * Get user's island preference
   */
  async getIslandPreference(): Promise<Island | null> {
    try {
      const preference = await AsyncStorage.getItem(STORAGE_KEYS.ISLAND_PREFERENCE);
      return preference as Island | null;
    } catch (error) {
      console.error('Error getting island preference:', error);
      return null;
    }
  }

  /**
   * Check if we've asked for location permission before
   */
  async hasAskedForLocationPermission(): Promise<boolean> {
    try {
      const asked = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_PERMISSION_ASKED);
      return asked === 'true';
    } catch (error) {
      console.error('Error checking location permission history:', error);
      return false;
    }
  }

  /**
   * Get intelligent island recommendations based on user context
   */
  async getRecommendedIslands(): Promise<Island[]> {
    const recommendations: Island[] = [];
    
    // Add current detected island first
    const currentIsland = await this.detectCurrentIsland();
    if (currentIsland) {
      recommendations.push(currentIsland);
    }
    
    // Add last known island if different
    const lastKnown = await this.getLastKnownIsland();
    if (lastKnown && lastKnown !== currentIsland) {
      recommendations.push(lastKnown);
    }
    
    // Add island preference if different
    const preference = await this.getIslandPreference();
    if (preference && !recommendations.includes(preference)) {
      recommendations.push(preference);
    }
    
    // Fill with remaining islands
    const allIslands: Island[] = ['Nassau', 'Freeport', 'Exuma'];
    for (const island of allIslands) {
      if (!recommendations.includes(island)) {
        recommendations.push(island);
      }
    }
    
    return recommendations;
  }
}

export const locationService = new LocationService();
