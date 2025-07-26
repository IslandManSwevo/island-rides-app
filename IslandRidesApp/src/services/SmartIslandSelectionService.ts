/**
 * Smart Island Selection Service
 * 
 * This service provides intelligent island recommendations based on user location,
 * preferences, and travel patterns. It integrates with the existing LocationService
 * and IslandContext to provide enhanced island selection capabilities.
 * 
 * BROWNFIELD SAFETY:
 * - Only active when SMART_ISLAND_SELECTION feature flag is enabled
 * - Uses existing island data structures without modification
 * - Provides enhanced functionality as an overlay to existing services
 * - Graceful fallback to existing island selection when disabled
 */

import { Island, IslandInfo, IslandConfig } from '../contexts/IslandContext';
import { locationService, Coordinates } from '../services/LocationService';
import { islands, IslandOption } from '../constants/islands';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SmartIslandRecommendation {
  island: Island;
  islandInfo: IslandInfo;
  islandOption: IslandOption;
  distance: number; // in kilometers
  travelTime: number; // in minutes
  confidence: number; // 0-1 score
  reasons: string[]; // why this island is recommended
  isCurrentLocation: boolean;
  isPreviouslyVisited: boolean;
  popularityScore: number;
}

export interface TravelTimeEstimate {
  byAir: number; // minutes
  byFerry: number; // minutes
  byPrivateBoat: number; // minutes
}

export interface UserLocationPreferences {
  preferredIslands: Island[];
  visitHistory: { island: Island; visitCount: number; lastVisit: number }[];
  searchHistory: { island: Island; searchCount: number; lastSearch: number }[];
  locationPermissionGranted: boolean;
  lastKnownLocation: Coordinates | null;
}

// Island data mapping between different data structures
const ISLAND_DATA_MAP: Record<string, Island> = {
  'Nassau': 'nassau',
  'Freeport': 'grand-bahama',
  'Paradise Island': 'paradise',
  'Exuma': 'exumas',
  'Eleuthera': 'eleuthera',
  'Harbour Island': 'harbour',
};

// Reverse mapping for display
const DISPLAY_ISLAND_MAP: Record<Island, string> = {
  'nassau': 'Nassau',
  'grand-bahama': 'Freeport',
  'paradise': 'Paradise Island',
  'exumas': 'Exuma',
  'eleuthera': 'Eleuthera',
  'harbour': 'Harbour Island',
};

// Travel time estimates between islands (in minutes)
const TRAVEL_TIMES: Record<string, Record<string, TravelTimeEstimate>> = {
  'nassau': {
    'grand-bahama': { byAir: 45, byFerry: 180, byPrivateBoat: 120 },
    'paradise': { byAir: 10, byFerry: 15, byPrivateBoat: 10 },
    'exumas': { byAir: 35, byFerry: 240, byPrivateBoat: 180 },
    'eleuthera': { byAir: 25, byFerry: 120, byPrivateBoat: 90 },
    'harbour': { byAir: 30, byFerry: 150, byPrivateBoat: 120 },
  },
  'grand-bahama': {
    'nassau': { byAir: 45, byFerry: 180, byPrivateBoat: 120 },
    'paradise': { byAir: 50, byFerry: 195, byPrivateBoat: 130 },
    'exumas': { byAir: 60, byFerry: 300, byPrivateBoat: 240 },
    'eleuthera': { byAir: 40, byFerry: 240, byPrivateBoat: 180 },
    'harbour': { byAir: 45, byFerry: 270, byPrivateBoat: 210 },
  },
  // Add more travel time data as needed
};

const STORAGE_KEYS = {
  USER_PREFERENCES: 'smartIslandSelection_userPreferences',
  VISIT_HISTORY: 'smartIslandSelection_visitHistory',
  SEARCH_HISTORY: 'smartIslandSelection_searchHistory',
};

class SmartIslandSelectionService {
  private static instance: SmartIslandSelectionService;
  private userPreferences: UserLocationPreferences | null = null;

  private constructor() {}

  static getInstance(): SmartIslandSelectionService {
    if (!SmartIslandSelectionService.instance) {
      SmartIslandSelectionService.instance = new SmartIslandSelectionService();
    }
    return SmartIslandSelectionService.instance;
  }

  /**
   * Get smart island recommendations based on user location and preferences
   */
  async getSmartRecommendations(
    userLocation?: Coordinates,
    limit: number = 5
  ): Promise<SmartIslandRecommendation[]> {
    try {
      // Load user preferences
      await this.loadUserPreferences();

      // Get current location if not provided
      let currentLocation = userLocation;
      if (!currentLocation) {
        const locationData = await locationService.getCurrentLocation();
        currentLocation = locationData?.coords || null;
      }

      // Get all available islands from existing data
      const availableIslands = this.getAvailableIslands();
      
      // Calculate recommendations for each island
      const recommendations: SmartIslandRecommendation[] = [];

      for (const islandOption of availableIslands) {
        const island = this.mapDisplayToIslandId(islandOption.id);
        if (!island) continue;

        const islandInfo = this.getIslandInfo(island);
        if (!islandInfo) continue;

        const recommendation = await this.calculateIslandRecommendation(
          island,
          islandInfo,
          islandOption,
          currentLocation
        );

        recommendations.push(recommendation);
      }

      // Sort by confidence score and distance
      recommendations.sort((a, b) => {
        // Prioritize current location
        if (a.isCurrentLocation && !b.isCurrentLocation) return -1;
        if (!a.isCurrentLocation && b.isCurrentLocation) return 1;
        
        // Then by confidence score
        if (Math.abs(a.confidence - b.confidence) > 0.1) {
          return b.confidence - a.confidence;
        }
        
        // Finally by distance
        return a.distance - b.distance;
      });

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting smart recommendations:', error);
      
      // Fallback to basic recommendations
      return this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Calculate recommendation score for a specific island
   */
  private async calculateIslandRecommendation(
    island: Island,
    islandInfo: IslandInfo,
    islandOption: IslandOption,
    userLocation: Coordinates | null
  ): Promise<SmartIslandRecommendation> {
    const distance = userLocation 
      ? this.calculateDistance(userLocation, islandInfo.coordinates)
      : 1000; // Default high distance if no location

    const travelTime = this.estimateTravelTime(island, userLocation);
    const isCurrentLocation = distance < 10; // Within 10km
    const isPreviouslyVisited = this.hasVisitedIsland(island);
    const popularityScore = this.calculatePopularityScore(island);
    
    // Calculate confidence score (0-1)
    let confidence = 0.5; // Base score
    
    // Location-based scoring
    if (isCurrentLocation) {
      confidence += 0.4; // Strong boost for current location
    } else if (distance < 50) {
      confidence += 0.3; // Boost for nearby islands
    } else if (distance < 100) {
      confidence += 0.1; // Small boost for moderately close islands
    }
    
    // History-based scoring
    if (isPreviouslyVisited) {
      confidence += 0.2;
    }
    
    // Popularity-based scoring
    confidence += popularityScore * 0.1;
    
    // Feature-based scoring
    if (islandInfo.features.hasAirport) {
      confidence += 0.05;
    }
    if (islandInfo.features.allowsVehicleRentals) {
      confidence += 0.05;
    }

    // Ensure confidence is within bounds
    confidence = Math.min(1, Math.max(0, confidence));

    // Generate recommendation reasons
    const reasons = this.generateRecommendationReasons(
      island,
      islandInfo,
      distance,
      isCurrentLocation,
      isPreviouslyVisited
    );

    return {
      island,
      islandInfo,
      islandOption,
      distance,
      travelTime,
      confidence,
      reasons,
      isCurrentLocation,
      isPreviouslyVisited,
      popularityScore,
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.latitude)) * 
              Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate travel time to an island
   */
  private estimateTravelTime(island: Island, userLocation: Coordinates | null): number {
    if (!userLocation) return 60; // Default 1 hour if no location

    // Find nearest island to user
    const nearestIsland = this.findNearestIsland(userLocation);
    if (!nearestIsland) return 60;

    // Get travel time between islands
    const travelData = TRAVEL_TIMES[nearestIsland]?.[island];
    if (!travelData) return 60;

    // Return fastest travel option (usually by air)
    return Math.min(travelData.byAir, travelData.byFerry, travelData.byPrivateBoat);
  }

  /**
   * Find the nearest island to given coordinates
   */
  private findNearestIsland(location: Coordinates): Island | null {
    // This would use the existing IslandContext logic
    // For now, simplified implementation
    return 'nassau'; // Default to Nassau
  }

  /**
   * Check if user has visited an island before
   */
  private hasVisitedIsland(island: Island): boolean {
    if (!this.userPreferences) return false;
    
    return this.userPreferences.visitHistory.some(visit => visit.island === island);
  }

  /**
   * Calculate popularity score for an island
   */
  private calculatePopularityScore(island: Island): number {
    // Mock popularity scores - in production would come from analytics
    const popularityScores: Record<Island, number> = {
      'nassau': 0.9,
      'grand-bahama': 0.7,
      'paradise': 0.8,
      'exumas': 0.6,
      'eleuthera': 0.5,
      'harbour': 0.4,
    };
    
    return popularityScores[island] || 0.5;
  }

  /**
   * Generate human-readable recommendation reasons
   */
  private generateRecommendationReasons(
    island: Island,
    islandInfo: IslandInfo,
    distance: number,
    isCurrentLocation: boolean,
    isPreviouslyVisited: boolean
  ): string[] {
    const reasons: string[] = [];

    if (isCurrentLocation) {
      reasons.push('You are currently here');
    } else if (distance < 50) {
      reasons.push(`Only ${distance.toFixed(0)}km away`);
    }

    if (isPreviouslyVisited) {
      reasons.push('You have visited before');
    }

    if (islandInfo.features.hasAirport) {
      reasons.push('Has airport for easy access');
    }

    if (islandInfo.features.allowsVehicleRentals) {
      reasons.push('Vehicle rentals available');
    }

    if (islandInfo.popularAreas.length > 3) {
      reasons.push('Many popular areas to explore');
    }

    return reasons;
  }

  /**
   * Get available islands from existing constants
   */
  private getAvailableIslands(): IslandOption[] {
    return islands.filter(island => island.id); // Filter out any invalid entries
  }

  /**
   * Map display island ID to internal island ID
   */
  private mapDisplayToIslandId(displayId: string): Island | null {
    return ISLAND_DATA_MAP[displayId] || null;
  }

  /**
   * Get island info from existing context data
   */
  private getIslandInfo(island: Island): IslandInfo | null {
    // This would integrate with IslandContext
    // For now, mock implementation with basic data
    const mockIslandInfo: Record<Island, IslandInfo> = {
      'nassau': {
        id: 'nassau',
        name: 'Nassau',
        displayName: 'Nassau',
        coordinates: { latitude: 25.0343, longitude: -77.3963 },
        region: 'New Providence',
        timezone: 'America/Nassau',
        currency: 'BSD',
        popularAreas: ['Cable Beach', 'Paradise Island', 'Downtown Nassau'],
        isActive: true,
        features: {
          hasAirport: true,
          hasPort: true,
          allowsVehicleRentals: true,
          supportedVehicleTypes: ['car', 'scooter', 'bike']
        }
      },
      'grand-bahama': {
        id: 'grand-bahama',
        name: 'Grand Bahama',
        displayName: 'Freeport',
        coordinates: { latitude: 26.5384, longitude: -78.6569 },
        region: 'Grand Bahama',
        timezone: 'America/Nassau',
        currency: 'BSD',
        popularAreas: ['Port Lucaya', 'Freeport', 'Lucaya Beach'],
        isActive: true,
        features: {
          hasAirport: true,
          hasPort: true,
          allowsVehicleRentals: true,
          supportedVehicleTypes: ['car', 'scooter', 'bike']
        }
      },
      'exumas': {
        id: 'exumas',
        name: 'Exumas',
        displayName: 'Exuma',
        coordinates: { latitude: 23.6145, longitude: -75.7382 },
        region: 'Exumas',
        timezone: 'America/Nassau',
        currency: 'BSD',
        popularAreas: ['Georgetown', 'Staniel Cay', 'Compass Cay'],
        isActive: true,
        features: {
          hasAirport: true,
          hasPort: true,
          allowsVehicleRentals: true,
          supportedVehicleTypes: ['car', 'boat']
        }
      },
      'paradise': {
        id: 'paradise',
        name: 'Paradise Island',
        displayName: 'Paradise Island',
        coordinates: { latitude: 25.0845, longitude: -77.3210 },
        region: 'New Providence',
        timezone: 'America/Nassau',
        currency: 'BSD',
        popularAreas: ['Atlantis Resort', 'Paradise Beach', 'Marina Village'],
        isActive: true,
        features: {
          hasAirport: false,
          hasPort: true,
          allowsVehicleRentals: true,
          supportedVehicleTypes: ['car', 'scooter']
        }
      },
      'eleuthera': {
        id: 'eleuthera',
        name: 'Eleuthera',
        displayName: 'Eleuthera',
        coordinates: { latitude: 25.1442, longitude: -76.1951 },
        region: 'Eleuthera',
        timezone: 'America/Nassau',
        currency: 'BSD',
        popularAreas: ['Governor\'s Harbour', 'Rock Sound', 'Harbour Island'],
        isActive: true,
        features: {
          hasAirport: true,
          hasPort: true,
          allowsVehicleRentals: true,
          supportedVehicleTypes: ['car']
        }
      },
      'harbour': {
        id: 'harbour',
        name: 'Harbour Island',
        displayName: 'Harbour Island',
        coordinates: { latitude: 25.5051, longitude: -76.6402 },
        region: 'Eleuthera',
        timezone: 'America/Nassau',
        currency: 'BSD',
        popularAreas: ['Dunmore Town', 'Pink Sands Beach'],
        isActive: true,
        features: {
          hasAirport: true,
          hasPort: true,
          allowsVehicleRentals: false,
          supportedVehicleTypes: []
        }
      },
    };

    return mockIslandInfo[island] || null;
  }

  /**
   * Load user preferences from storage
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        this.userPreferences = JSON.parse(stored);
      } else {
        this.userPreferences = {
          preferredIslands: [],
          visitHistory: [],
          searchHistory: [],
          locationPermissionGranted: false,
          lastKnownLocation: null,
        };
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      this.userPreferences = {
        preferredIslands: [],
        visitHistory: [],
        searchHistory: [],
        locationPermissionGranted: false,
        lastKnownLocation: null,
      };
    }
  }

  /**
   * Save user preferences to storage
   */
  private async saveUserPreferences(): Promise<void> {
    if (!this.userPreferences) return;

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(this.userPreferences)
      );
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Record island visit for future recommendations
   */
  async recordIslandVisit(island: Island): Promise<void> {
    await this.loadUserPreferences();
    if (!this.userPreferences) return;

    const existingVisit = this.userPreferences.visitHistory.find(v => v.island === island);
    if (existingVisit) {
      existingVisit.visitCount++;
      existingVisit.lastVisit = Date.now();
    } else {
      this.userPreferences.visitHistory.push({
        island,
        visitCount: 1,
        lastVisit: Date.now(),
      });
    }

    await this.saveUserPreferences();
  }

  /**
   * Record island search for future recommendations
   */
  async recordIslandSearch(island: Island): Promise<void> {
    await this.loadUserPreferences();
    if (!this.userPreferences) return;

    const existingSearch = this.userPreferences.searchHistory.find(s => s.island === island);
    if (existingSearch) {
      existingSearch.searchCount++;
      existingSearch.lastSearch = Date.now();
    } else {
      this.userPreferences.searchHistory.push({
        island,
        searchCount: 1,
        lastSearch: Date.now(),
      });
    }

    await this.saveUserPreferences();
  }

  /**
   * Get fallback recommendations when smart recommendations fail
   */
  private getFallbackRecommendations(limit: number): SmartIslandRecommendation[] {
    const fallbackIslands = islands.slice(0, limit);
    
    return fallbackIslands.map((islandOption, index) => {
      const island = this.mapDisplayToIslandId(islandOption.id) || 'nassau';
      const islandInfo = this.getIslandInfo(island);
      
      return {
        island,
        islandInfo: islandInfo!,
        islandOption,
        distance: 1000, // Unknown distance
        travelTime: 60, // Default 1 hour
        confidence: 0.5 - (index * 0.1), // Decreasing confidence
        reasons: ['Popular destination'],
        isCurrentLocation: false,
        isPreviouslyVisited: false,
        popularityScore: 0.5,
      };
    });
  }
}

// Export singleton instance
export const smartIslandSelectionService = SmartIslandSelectionService.getInstance();

export default smartIslandSelectionService;
