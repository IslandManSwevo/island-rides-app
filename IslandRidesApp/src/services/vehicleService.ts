import { apiService } from './apiService';
import { VehicleRecommendation, Island, Vehicle } from '../types';
import { BusinessLogicError } from './errors/BusinessLogicError';

// Enhanced search parameters for Epic 2 functionality
export interface VehicleSearchParams {
  island?: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'price' | 'popularity' | 'distance' | 'rating';
  limit?: number;
  offset?: number;
}

export interface VehicleSearchResult {
  vehicle: Vehicle;
  distance?: number;
  popularity?: number;
  rating?: number;
}

// Interface for vehicle recommendations response
interface VehicleRecommendationsResponse {
  recommendations: VehicleRecommendation[];
}

class VehicleService {
  private static instance: VehicleService;

  private constructor() {}

  static getInstance(): VehicleService {
    if (!VehicleService.instance) {
      VehicleService.instance = new VehicleService();
    }
    return VehicleService.instance;
  }

  async getVehiclesByIsland(island: Island): Promise<VehicleRecommendation[]> {
    try {
      console.log('🏝️ Fetching vehicles for island:', island);
      const data = await apiService.get<VehicleRecommendationsResponse>(`/api/recommendations/${island}`);
      console.log('✅ Vehicle data received:', data);
      return data.recommendations;
    } catch (error) {
      console.error('❌ Vehicle fetch error:', error);
      throw new Error(`Failed to fetch vehicles: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  }

  async getAllVehicles(): Promise<VehicleRecommendation[]> {
    try {
      const data = await apiService.get<VehicleRecommendationsResponse>('/api/vehicles');
      return data.recommendations;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  async getVehicleById(vehicleId: string): Promise<VehicleRecommendation> {
    try {
      const response = await apiService.get<VehicleRecommendation>(`/api/vehicles/${vehicleId}`);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch vehicle details: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  }

  async getConditionRating(vehicleId: string): Promise<number> {
    try {
      const vehicle = await this.getVehicleById(vehicleId);
      return vehicle.vehicle.conditionRating || 0;
    } catch (error) {
      throw new Error(`Failed to fetch condition rating: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  }

  private mapVehicleFields(vehicle: any): VehicleRecommendation {
    const totalReviews = vehicle.total_reviews || vehicle.totalReviews || 0;
    const averageRating = vehicle.average_rating || vehicle.averageRating || 0;
    const conditionRating = vehicle.condition_rating || vehicle.conditionRating || 0;

    // The recommendation score is a weighted average of several factors:
    // - 50% from the vehicle's average rating.
    // - 30% from its condition rating.
    // - 20% from the logarithm of the total number of reviews (to reward popularity while diminishing returns).
    const recommendationScore = (averageRating * 0.5) + (conditionRating * 0.3) + (Math.log1p(totalReviews) * 0.2);

    return {
      id: vehicle.id.toString(),
      vehicle: {
        ...vehicle,
        createdAt: vehicle.created_at || vehicle.createdAt,
        updatedAt: vehicle.updated_at || vehicle.updatedAt,
        driveSide: vehicle.drive_side || vehicle.driveSide,
        dailyRate: vehicle.daily_rate || vehicle.dailyRate,
        ownerId: vehicle.owner_id || vehicle.ownerId,
        vehicleType: vehicle.vehicle_type || vehicle.vehicleType,
        fuelType: vehicle.fuel_type || vehicle.fuelType,
        transmissionType: vehicle.transmission_type || vehicle.transmissionType,
        seatingCapacity: vehicle.seating_capacity || vehicle.seatingCapacity,
        conditionRating: conditionRating,
        verificationStatus: vehicle.verification_status || vehicle.verificationStatus,
        deliveryAvailable: vehicle.delivery_available || vehicle.deliveryAvailable,
        airportPickup: vehicle.airport_pickup || vehicle.airportPickup,
        averageRating: averageRating,
        totalReviews: totalReviews,
      },
      recommendationScore: recommendationScore,
      type: vehicle.vehicle_type || vehicle.vehicleType || 'car',
      island: vehicle.location || 'Nassau',
      pricePerDay: vehicle.daily_rate || vehicle.dailyRate || 0,
      scoreBreakdown: {
        collaborativeFiltering: 0,
        vehiclePopularity: totalReviews,
        vehicleRating: averageRating,
        hostPopularity: 0
      }
    };
  }

  private appendQueryParams(queryParams: URLSearchParams, params: Record<string, unknown>, keys: string[]) {
    keys.forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  async searchVehicles(params: {
    location?: string;
    vehicleType?: string;
    fuelType?: string;
    transmissionType?: string;
    seatingCapacity?: number;
    minPrice?: number;
    maxPrice?: number;
    features?: string;
    conditionRating?: number;
    verificationStatus?: string; // This accepts comma-separated values like 'pending,verified'
    deliveryAvailable?: string;
    airportPickup?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
    // Legacy support
    island?: Island;
    startDate?: string;
    endDate?: string;
    priceRange?: [number, number];
  }): Promise<VehicleRecommendation[]> {
    try {
      const queryParams = new URLSearchParams();
      
      const paramKeys = [
        'location', 'vehicleType', 'fuelType', 'transmissionType', 
        'seatingCapacity', 'minPrice', 'maxPrice', 'features', 
        'conditionRating', 'verificationStatus', 'deliveryAvailable', 
        'airportPickup', 'sortBy', 'page', 'limit', 'startDate', 'endDate'
      ];
      this.appendQueryParams(queryParams, params, paramKeys);
      
      // Legacy parameter support
      if (params.island && !params.location) {
        queryParams.set('location', params.island);
      }
      if (params.priceRange && !params.minPrice && !params.maxPrice) {
        queryParams.set('minPrice', params.priceRange[0].toString());
        queryParams.set('maxPrice', params.priceRange[1].toString());
      }

      const url = `/api/vehicles/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiService.get<{ vehicles: unknown[]; pagination?: any }>(url);
      
      // Transform backend vehicle data to VehicleRecommendation format
      const vehicles = response.vehicles || [];
      return vehicles.map((vehicle) => this.mapVehicleFields(vehicle));
    } catch (error) {
      throw new Error(`Failed to search vehicles: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  }

  async findSimilarVehicles(vehicleId: string): Promise<VehicleRecommendation[]> {
    try {
      const vehicle = await this.getVehicleById(vehicleId);
      const similarVehicles = await this.searchVehicles({
        island: vehicle.island,
        vehicleType: vehicle.type,
        priceRange: [vehicle.pricePerDay * 0.8, vehicle.pricePerDay * 1.2] // 20% price range
      });

      return similarVehicles.filter(v => v.id !== vehicleId);
    } catch (error) {
      throw new BusinessLogicError(
        'Failed to find similar vehicles',
        'SIMILAR_VEHICLES_FAILED',
        { originalError: error, vehicleId }
      );
    }
  }

  /**
   * Enhanced search functionality for Epic 2
   * Provides advanced search with sorting and filtering for enhanced home screen
   */
  async enhancedSearchVehicles(params: VehicleSearchParams = {}): Promise<VehicleSearchResult[]> {
    try {
      // Convert enhanced params to existing API format
      const searchParams: any = {};

      if (params.island) searchParams.location = params.island;
      if (params.category) searchParams.vehicleType = params.category;
      if (params.priceRange) {
        searchParams.minPrice = params.priceRange.min;
        searchParams.maxPrice = params.priceRange.max;
      }
      if (params.sortBy) searchParams.sortBy = params.sortBy;
      if (params.limit) searchParams.limit = params.limit;
      if (params.offset) searchParams.page = Math.floor((params.offset || 0) / (params.limit || 10)) + 1;

      const results = await this.searchVehicles(searchParams);

      // Convert to enhanced search results format
      return results.map(rec => ({
        vehicle: rec.vehicle,
        distance: Math.random() * 50, // Mock distance until location services are integrated
        popularity: rec.scoreBreakdown?.vehiclePopularity || Math.random() * 100,
        rating: rec.vehicle.averageRating || 4.0,
      }));
    } catch (error) {
      console.error('Error in enhanced vehicle search:', error);
      throw error;
    }
  }

  /**
   * Get popular vehicles for enhanced home screen
   */
  async getPopularVehicles(limit: number = 6): Promise<VehicleSearchResult[]> {
    return this.enhancedSearchVehicles({
      sortBy: 'popularity',
      limit,
    });
  }

  /**
   * Get vehicle recommendations based on user preferences
   */
  async getRecommendedVehicles(
    userPreferences: {
      preferredCategory?: string;
      maxPrice?: number;
      island?: string;
    },
    limit: number = 4
  ): Promise<VehicleSearchResult[]> {
    const searchParams: VehicleSearchParams = {
      limit,
      sortBy: 'rating',
    };

    if (userPreferences.preferredCategory) {
      searchParams.category = userPreferences.preferredCategory;
    }

    if (userPreferences.maxPrice) {
      searchParams.priceRange = {
        min: 0,
        max: userPreferences.maxPrice,
      };
    }

    if (userPreferences.island) {
      searchParams.island = userPreferences.island;
    }

    return this.enhancedSearchVehicles(searchParams);
  }
}

export const vehicleService = VehicleService.getInstance();