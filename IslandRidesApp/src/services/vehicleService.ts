import { apiService } from './apiService';
import { VehicleRecommendation, Island } from '../types';
import { BusinessLogicError } from './errors/BusinessLogicError';

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
    verificationStatus?: string;
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
      
      // Handle new parameters
      if (params.location) queryParams.append('location', params.location);
      if (params.vehicleType) queryParams.append('vehicleType', params.vehicleType);
      if (params.fuelType) queryParams.append('fuelType', params.fuelType);
      if (params.transmissionType) queryParams.append('transmissionType', params.transmissionType);
      if (params.seatingCapacity) queryParams.append('seatingCapacity', params.seatingCapacity.toString());
      if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.features) queryParams.append('features', params.features);
      if (params.conditionRating) queryParams.append('conditionRating', params.conditionRating.toString());
      if (params.verificationStatus) queryParams.append('verificationStatus', params.verificationStatus);
      if (params.deliveryAvailable) queryParams.append('deliveryAvailable', params.deliveryAvailable);
      if (params.airportPickup) queryParams.append('airportPickup', params.airportPickup);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Legacy parameter support
      if (params.island && !params.location) queryParams.append('location', params.island);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.priceRange && !params.minPrice && !params.maxPrice) {
        queryParams.append('minPrice', params.priceRange[0].toString());
        queryParams.append('maxPrice', params.priceRange[1].toString());
      }

      const url = `/api/vehicles/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiService.get<{ vehicles: any[]; pagination?: any }>(url);
      
      // Transform backend vehicle data to VehicleRecommendation format
      const vehicles = response.vehicles || [];
      return vehicles.map(vehicle => ({
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
          conditionRating: vehicle.condition_rating || vehicle.conditionRating,
          verificationStatus: vehicle.verification_status || vehicle.verificationStatus,
          deliveryAvailable: vehicle.delivery_available || vehicle.deliveryAvailable,
          airportPickup: vehicle.airport_pickup || vehicle.airportPickup,
          averageRating: vehicle.average_rating || vehicle.averageRating,
          totalReviews: vehicle.total_reviews || vehicle.totalReviews,
        },
        recommendationScore: vehicle.total_reviews || 0,
        type: vehicle.vehicle_type || vehicle.vehicleType || 'car',
        island: vehicle.location || 'Nassau',
        pricePerDay: vehicle.daily_rate || vehicle.dailyRate || 0,
        scoreBreakdown: {
          collaborativeFiltering: 0,
          vehiclePopularity: vehicle.total_reviews || 0,
          vehicleRating: vehicle.average_rating || 0,
          hostPopularity: 0
        }
      }));
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
}

export const vehicleService = VehicleService.getInstance();