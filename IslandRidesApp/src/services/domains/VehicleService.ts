import { apiService } from '../apiService';
import type { Island } from '../../contexts/IslandContext';

export interface SearchCriteria {
  location?: string;
  startDate?: string;
  endDate?: string;
  vehicleType?: string;
  priceMin?: number;
  priceMax?: number;
  features?: string[];
  island?: Island;
  radius?: number; // search radius in km
  coordinates?: { latitude: number; longitude: number };
  sortBy?: 'price' | 'distance' | 'rating' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  pricePerDay: number;
  location: string;
  island: Island;
  isAvailable: boolean;
  features: string[];
  photos: string[];
  description?: string;
  hostId: string;
  rating?: number;
  reviewCount?: number;
  coordinates?: { latitude: number; longitude: number };
  distance?: number; // distance from search location in km
}

export interface VehicleAvailability {
  vehicleId: string;
  availableDates: string[];
  unavailableDates: string[];
  priceCalendar: { [date: string]: number };
}

export interface VehicleCreateData {
  make: string;
  model: string;
  year: number;
  type: string;
  pricePerDay: number;
  location: string;
  island: Island;
  features: string[];
  description?: string;
  photos?: string[];
  coordinates?: { latitude: number; longitude: number };
}

export interface VehicleUpdateData extends Partial<VehicleCreateData> {
  isAvailable?: boolean;
}

/**
 * VehicleService - Domain service for vehicle-related operations
 * Consolidates all vehicle API calls into a single service layer
 */
export class VehicleService {
  
  /**
   * Search for vehicles based on criteria
   */
  async searchVehicles(criteria: SearchCriteria): Promise<Vehicle[]> {
    const response = await apiService.get<{ vehicles: Vehicle[] }>('/api/vehicles/search', criteria);
    return response.vehicles;
  }

  /**
   * Get all vehicles (with optional filters)
   */
  async getVehicles(params?: { island?: Island; type?: string }): Promise<Vehicle[]> {
    const response = await apiService.get<{ vehicles: Vehicle[] }>('/api/vehicles', params);
    return response.vehicles;
  }

  /**
   * Search vehicles with island-aware functionality
   */
  async searchVehiclesForIsland(criteria: SearchCriteria, currentIsland: Island): Promise<Vehicle[]> {
    const enhancedCriteria = {
      ...criteria,
      island: criteria.island || currentIsland, // Default to current island
    };
    
    return this.searchVehicles(enhancedCriteria);
  }

  /**
   * Get vehicles available on a specific island
   */
  async getVehiclesByIsland(island: Island, filters?: { type?: string; priceMax?: number }): Promise<Vehicle[]> {
    return this.getVehicles({ island, ...filters });
  }

  /**
   * Get popular vehicles for an island
   */
  async getPopularVehiclesForIsland(island: Island, limit: number = 10): Promise<Vehicle[]> {
    const response = await apiService.get<{ vehicles: Vehicle[] }>(`/api/vehicles/popular/${island}`, { limit });
    return response.vehicles;
  }

  /**
   * Get nearby vehicles based on coordinates
   */
  async getNearbyVehicles(
    latitude: number, 
    longitude: number, 
    radius: number = 5,
    island?: Island
  ): Promise<Vehicle[]> {
    const params = {
      latitude,
      longitude,
      radius,
      ...(island && { island })
    };
    const response = await apiService.get<{ vehicles: Vehicle[] }>('/api/vehicles/nearby', params);
    return response.vehicles;
  }

  /**
   * Get vehicle details by ID
   */
  async getVehicleDetails(id: string): Promise<Vehicle> {
    return await apiService.get<Vehicle>(`/api/vehicles/${id}`);
  }

  /**
   * Get vehicle availability for a date range
   */
  async getVehicleAvailability(id: string, dates: DateRange): Promise<VehicleAvailability> {
    return await apiService.get<VehicleAvailability>(`/api/vehicles/${id}/availability`, dates);
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(vehicleData: VehicleCreateData): Promise<Vehicle> {
    return await apiService.post<Vehicle>('/api/vehicles', vehicleData);
  }

  /**
   * Update vehicle details
   */
  async updateVehicle(id: string, updateData: VehicleUpdateData): Promise<Vehicle> {
    return await apiService.put<Vehicle>(`/api/vehicles/${id}`, updateData);
  }

  /**
   * Delete a vehicle
   */
  async deleteVehicle(id: string): Promise<void> {
    await apiService.delete(`/api/vehicles/${id}`);
  }

  /**
   * Upload vehicle photos
   */
  async uploadVehiclePhotos(vehicleId: string, photos: FormData): Promise<{ photoUrls: string[] }> {
    return await apiService.uploadFile<{ photoUrls: string[] }>(`/api/vehicles/${vehicleId}/photos`, photos);
  }

  /**
   * Get vehicle reviews
   */
  async getVehicleReviews(vehicleId: string): Promise<any[]> {
    const response = await apiService.get<{ reviews: any[] }>(`/api/vehicles/${vehicleId}/reviews`);
    return response.reviews;
  }

  /**
   * Add vehicle to favorites
   */
  async addToFavorites(vehicleId: string): Promise<void> {
    await apiService.post('/favorites', { vehicleId });
  }

  /**
   * Remove vehicle from favorites
   */
  async removeFromFavorites(vehicleId: string): Promise<void> {
    await apiService.delete(`/favorites/${vehicleId}`);
  }

  /**
   * Check if vehicle is favorited
   */
  async checkFavoriteStatus(vehicleId: string): Promise<boolean> {
    const response = await apiService.get<{ isFavorited: boolean }>(`/favorites/check/${vehicleId}`);
    return response.isFavorited;
  }

  /**
   * Get owner's fleet
   */
  async getOwnerFleet(): Promise<Vehicle[]> {
    const response = await apiService.get<{ vehicles: Vehicle[] }>('/owner/fleet');
    return response.vehicles;
  }

  /**
   * Bulk toggle vehicle availability
   */
  async bulkToggleAvailability(vehicleIds: string[]): Promise<void> {
    await apiService.post('/owner/fleet/bulk/toggle-availability', { vehicleIds });
  }

  /**
   * Bulk update vehicle availability
   */
  async bulkUpdateAvailability(vehicleIds: string[], available: boolean): Promise<void> {
    await apiService.post('/owner/fleet/bulk/availability', { vehicleIds, available });
  }

  /**
   * Bulk schedule maintenance
   */
  async bulkScheduleMaintenance(vehicleIds: string[], maintenanceData: any): Promise<void> {
    await apiService.post('/owner/fleet/bulk/maintenance', {
      vehicleIds,
      ...maintenanceData
    });
  }
}

export const vehicleService = new VehicleService();