import * as Location from 'expo-location';
import { Platform } from 'react-native';

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
}

export const locationService = new LocationService();
