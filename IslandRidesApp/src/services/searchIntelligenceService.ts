import { VehicleRecommendation, Island, SearchFilters } from '../types';
import { vehicleService } from './vehicleService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TripPurpose {
  type: 'business' | 'leisure' | 'family' | 'adventure' | 'luxury' | 'unknown';
  confidence: number;
  indicators: string[];
}

export interface SearchPattern {
  userId?: string;
  searchFilters: SearchFilters;
  timestamp: Date;
  bookingMade: boolean;
  vehicleBooked?: string;
}

export interface RecommendationScore {
  vehicleId: string;
  score: number;
  reasons: string[];
  tripPurposeMatch: number;
  userPreferenceMatch: number;
  popularityScore: number;
  availabilityScore: number;
}

class SearchIntelligenceService {
  private readonly STORAGE_KEYS = {
    SEARCH_HISTORY: 'searchHistory',
    USER_PREFERENCES: 'userPreferences',
    TRIP_PATTERNS: 'tripPatterns'
  };

  async detectTripPurpose(filters: SearchFilters, searchHistory: SearchPattern[] = []): Promise<TripPurpose> {
    const indicators: string[] = [];
    let businessScore = 0;
    let leisureScore = 0;
    let familyScore = 0;
    let adventureScore = 0;
    let luxuryScore = 0;

    // Vehicle type analysis
    if (filters.vehicleTypes.includes('sedan')) {
      businessScore += 0.3;
      indicators.push('Professional vehicle type');
    }
    if (filters.vehicleTypes.includes('luxury') || filters.vehicleTypes.includes('convertible')) {
      luxuryScore += 0.4;
      indicators.push('Luxury vehicle preference');
    }
    if (filters.vehicleTypes.includes('suv') || filters.vehicleTypes.includes('minivan')) {
      familyScore += 0.3;
      indicators.push('Family-sized vehicle');
    }
    if (filters.vehicleTypes.includes('jeep') || filters.vehicleTypes.includes('truck')) {
      adventureScore += 0.3;
      indicators.push('Adventure vehicle type');
    }

    // Seating capacity analysis
    if (filters.minSeatingCapacity >= 7) {
      familyScore += 0.4;
      indicators.push('Large group size');
    } else if (filters.minSeatingCapacity >= 5) {
      familyScore += 0.2;
      leisureScore += 0.1;
    }

    // Price range analysis
    if (filters.priceRange[0] >= 200) {
      luxuryScore += 0.3;
      businessScore += 0.2;
      indicators.push('Premium price range');
    } else if (filters.priceRange[1] <= 80) {
      leisureScore += 0.2;
      indicators.push('Budget-conscious');
    }

    // Duration analysis (if dates provided)
    if (filters.startDate && filters.endDate) {
      const duration = (filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 3600 * 24);
      if (duration <= 2) {
        businessScore += 0.3;
        indicators.push('Short trip duration');
      } else if (duration >= 7) {
        leisureScore += 0.3;
        familyScore += 0.2;
        indicators.push('Extended vacation');
      }
    }

    // Features analysis
    if (filters.features.length > 0) {
      // Assume feature IDs: 1-3 are safety, 4-5 are adventure, 6+ are luxury
      const safetyFeatures = filters.features.filter(f => f >= 1 && f <= 3).length;
      const adventureFeatures = filters.features.filter(f => f >= 4 && f <= 5).length;
      const luxuryFeatures = filters.features.filter(f => f >= 6).length;

      if (safetyFeatures > 0) {
        familyScore += 0.2;
        businessScore += 0.1;
        indicators.push('Safety-focused');
      }
      if (adventureFeatures > 0) {
        adventureScore += 0.3;
        indicators.push('Adventure features');
      }
      if (luxuryFeatures > 0) {
        luxuryScore += 0.3;
        indicators.push('Luxury amenities');
      }
    }

    // Verification and instant booking preferences
    if (filters.verificationStatus.includes('verified') || filters.instantBooking) {
      businessScore += 0.2;
      indicators.push('Professional service preference');
    }

    // Historical pattern analysis
    if (searchHistory.length > 0) {
      const recentPatterns = searchHistory.slice(-5);
      const avgSeating = recentPatterns.reduce((sum, p) => sum + p.searchFilters.minSeatingCapacity, 0) / recentPatterns.length;
      const avgPrice = recentPatterns.reduce((sum, p) => sum + p.searchFilters.priceRange[1], 0) / recentPatterns.length;
      
      if (avgSeating >= 5) {
        familyScore += 0.2;
        indicators.push('Historical family preference');
      }
      if (avgPrice >= 150) {
        luxuryScore += 0.2;
        businessScore += 0.1;
        indicators.push('Historical premium preference');
      }
    }

    // Determine primary purpose
    const scores = {
      business: businessScore,
      leisure: leisureScore,
      family: familyScore,
      adventure: adventureScore,
      luxury: luxuryScore
    };

    const maxScore = Math.max(...Object.values(scores));
    const primaryPurpose = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as TripPurpose['type'];

    return {
      type: maxScore > 0.3 ? primaryPurpose || 'unknown' : 'unknown',
      confidence: Math.min(maxScore, 1.0),
      indicators
    };
  }

  async generateRecommendations(
    filters: SearchFilters,
    vehicles: VehicleRecommendation[],
    tripPurpose: TripPurpose,
    userPreferences: any = {}
  ): Promise<RecommendationScore[]> {
    const recommendations: RecommendationScore[] = [];

    for (const vehicle of vehicles) {
      let score = 0;
      const reasons: string[] = [];
      let tripPurposeMatch = 0;
      let userPreferenceMatch = 0;
      let popularityScore = 0;
      let availabilityScore = 0;

      // Base vehicle rating score
      score += (vehicle.vehicle.rating || 0) * 0.2;
      if ((vehicle.vehicle.rating || 0) >= 4.5) {
        reasons.push('Highly rated vehicle');
      }

      // Trip purpose matching
      switch (tripPurpose.type) {
        case 'business':
          if (['sedan', 'luxury'].includes(vehicle.vehicle.vehicleType || '')) {
            tripPurposeMatch += 0.4;
            reasons.push('Professional vehicle type');
          }
          if (vehicle.vehicle.verificationStatus === 'verified') {
            tripPurposeMatch += 0.3;
            reasons.push('Verified host');
          }
          if (vehicle.vehicle.instantBooking) {
            tripPurposeMatch += 0.2;
            reasons.push('Instant booking available');
          }
          break;

        case 'family':
          if (['suv', 'minivan'].includes(vehicle.vehicle.vehicleType || '')) {
            tripPurposeMatch += 0.4;
            reasons.push('Family-friendly vehicle');
          }
          if ((vehicle.vehicle.seatingCapacity || 0) >= 5) {
            tripPurposeMatch += 0.3;
            reasons.push('Spacious seating');
          }
          if ((vehicle.vehicle.conditionRating || 0) >= 4) {
            tripPurposeMatch += 0.2;
            reasons.push('Excellent condition');
          }
          break;

        case 'luxury':
          if (['luxury', 'convertible'].includes(vehicle.vehicle.vehicleType || '')) {
            tripPurposeMatch += 0.5;
            reasons.push('Luxury vehicle');
          }
          if ((vehicle.vehicle.price || 0) >= 150) {
            tripPurposeMatch += 0.2;
            reasons.push('Premium experience');
          }
          if ((vehicle.vehicle.conditionRating || 0) >= 4.5) {
            tripPurposeMatch += 0.2;
            reasons.push('Pristine condition');
          }
          break;

        case 'adventure':
          if (['suv', 'jeep', 'truck'].includes(vehicle.vehicle.vehicleType || '')) {
            tripPurposeMatch += 0.4;
            reasons.push('Adventure-ready vehicle');
          }
          if (vehicle.vehicle.features?.some(f => ['4WD', 'GPS', 'Off-road'].includes(f.name))) {
            tripPurposeMatch += 0.3;
            reasons.push('Adventure features');
          }
          break;

        case 'leisure':
          if ((vehicle.vehicle.price || 0) <= 100) {
            tripPurposeMatch += 0.3;
            reasons.push('Great value');
          }
          if ((vehicle.vehicle.vehicleType || '') === 'convertible') {
            tripPurposeMatch += 0.2;
            reasons.push('Fun driving experience');
          }
          break;
      }

      // User preference matching (based on historical choices)
      if (userPreferences.preferredVehicleTypes?.includes(vehicle.vehicle.vehicleType || '')) {
        userPreferenceMatch += 0.4;
        reasons.push('Matches your preferences');
      }
      if (userPreferences.preferredPriceRange && 
          (vehicle.vehicle.price || 0) >= userPreferences.preferredPriceRange[0] && 
          (vehicle.vehicle.price || 0) <= userPreferences.preferredPriceRange[1]) {
        userPreferenceMatch += 0.3;
        reasons.push('In your preferred price range');
      }

      // Popularity score (based on booking frequency)
      popularityScore = Math.min((vehicle.vehicle.totalBookings || 0) / 100, 1.0) * 0.3;
      if (popularityScore > 0.2) {
        reasons.push('Popular choice');
      }

      // Availability score
      if (vehicle.vehicle.instantBooking) {
        availabilityScore += 0.3;
        reasons.push('Instant booking available');
      }
      if (vehicle.vehicle.verificationStatus === 'verified') {
        availabilityScore += 0.2;
        reasons.push('Verified host');
      }

      // Combine scores
      score += tripPurposeMatch * 0.4;
      score += userPreferenceMatch * 0.3;
      score += popularityScore * 0.2;
      score += availabilityScore * 0.1;

      recommendations.push({
        vehicleId: vehicle.vehicle.id.toString(),
        score: Math.min(score, 1.0),
        reasons: reasons.slice(0, 4), // Limit to top 4 reasons
        tripPurposeMatch,
        userPreferenceMatch,
        popularityScore,
        availabilityScore
      });
    }

    // Sort by score and return top recommendations
    return recommendations.sort((a, b) => b.score - a.score);
  }

  async saveSearchPattern(pattern: SearchPattern): Promise<void> {
    try {
      const existingHistory = await this.getSearchHistory();
      const updatedHistory = [...existingHistory, pattern].slice(-50); // Keep last 50 searches
      await AsyncStorage.setItem(this.STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save search pattern:', error);
    }
  }

  async getSearchHistory(): Promise<SearchPattern[]> {
    try {
      const history = await AsyncStorage.getItem(this.STORAGE_KEYS.SEARCH_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  async updateUserPreferences(filters: SearchFilters, bookingMade: boolean): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      
      // Update preferred vehicle types
      if (bookingMade && filters.vehicleTypes.length > 0) {
        preferences.preferredVehicleTypes = preferences.preferredVehicleTypes || [];
        filters.vehicleTypes.forEach(type => {
          const existing = preferences.preferredVehicleTypes.find((p: any) => p.type === type);
          if (existing) {
            existing.count++;
          } else {
            preferences.preferredVehicleTypes.push({ type, count: 1 });
          }
        });
      }

      // Update preferred price range
      if (bookingMade) {
        if (!preferences.preferredPriceRange) {
          preferences.preferredPriceRange = filters.priceRange;
        } else {
          // Moving average
          preferences.preferredPriceRange[0] = (preferences.preferredPriceRange[0] + filters.priceRange[0]) / 2;
          preferences.preferredPriceRange[1] = (preferences.preferredPriceRange[1] + filters.priceRange[1]) / 2;
        }
      }

      // Update booking history
      preferences.hasBookings = bookingMade || preferences.hasBookings || false;
      preferences.totalSearches = (preferences.totalSearches || 0) + 1;

      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  }

  async getUserPreferences(): Promise<any> {
    try {
      const preferences = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
      return preferences ? JSON.parse(preferences) : {};
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  async generateCollaborativeRecommendations(
    currentFilters: SearchFilters,
    island: Island
  ): Promise<string[]> {
    // Simplified collaborative filtering
    // In a real implementation, this would use a recommendation algorithm
    try {
      const history = await this.getSearchHistory();
      const similarSearches = history.filter(pattern => 
        pattern.searchFilters.island === island &&
        this.calculateFilterSimilarity(pattern.searchFilters, currentFilters) > 0.6
      );

      const bookedVehicles = similarSearches
        .filter(search => search.bookingMade && search.vehicleBooked)
        .map(search => search.vehicleBooked!)
        .reduce((acc: {[key: string]: number}, vehicleId) => {
          acc[vehicleId] = (acc[vehicleId] || 0) + 1;
          return acc;
        }, {});

      return Object.entries(bookedVehicles)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([vehicleId]) => vehicleId);
    } catch (error) {
      console.error('Failed to generate collaborative recommendations:', error);
      return [];
    }
  }

  private calculateFilterSimilarity(filters1: SearchFilters, filters2: SearchFilters): number {
    let similarity = 0;
    let totalFactors = 0;

    // Compare vehicle types
    const commonTypes = filters1.vehicleTypes.filter(type => filters2.vehicleTypes.includes(type));
    const totalTypes = Math.max(filters1.vehicleTypes.length, filters2.vehicleTypes.length);
    if (totalTypes > 0) {
      similarity += (commonTypes.length / totalTypes) * 0.3;
    }
    totalFactors += 0.3;

    // Compare price ranges
    const priceOverlap = Math.max(0, 
      Math.min(filters1.priceRange[1], filters2.priceRange[1]) - 
      Math.max(filters1.priceRange[0], filters2.priceRange[0])
    );
    const maxPriceRange = Math.max(
      filters1.priceRange[1] - filters1.priceRange[0],
      filters2.priceRange[1] - filters2.priceRange[0]
    );
    if (maxPriceRange > 0) {
      similarity += (priceOverlap / maxPriceRange) * 0.25;
    }
    totalFactors += 0.25;

    // Compare seating capacity
    const seatingSimilarity = 1 - Math.abs(filters1.minSeatingCapacity - filters2.minSeatingCapacity) / 8;
    similarity += Math.max(0, seatingSimilarity) * 0.2;
    totalFactors += 0.2;

    // Compare boolean filters
    const booleanSimilarity = [
      filters1.deliveryAvailable === filters2.deliveryAvailable,
      filters1.airportPickup === filters2.airportPickup,
      filters1.instantBooking === filters2.instantBooking
    ].filter(Boolean).length / 3;
    similarity += booleanSimilarity * 0.15;
    totalFactors += 0.15;

    // Compare verification status
    const commonVerification = filters1.verificationStatus.filter(status => 
      filters2.verificationStatus.includes(status)
    );
    const totalVerification = Math.max(filters1.verificationStatus.length, filters2.verificationStatus.length);
    if (totalVerification > 0) {
      similarity += (commonVerification.length / totalVerification) * 0.1;
    }
    totalFactors += 0.1;

    return totalFactors > 0 ? similarity / totalFactors : 0;
  }
}

export const searchIntelligenceService = new SearchIntelligenceService();
