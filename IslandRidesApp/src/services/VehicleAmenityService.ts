import { BaseService } from './base/BaseService';
import { apiService } from './apiService';
import { VehicleAmenity } from '../types';

class VehicleAmenityService extends BaseService {
  constructor() {
    super();
  }

  protected async onInit(): Promise<void> {
    await apiService.waitForInitialization();
  }

  async getVehicleAmenities(vehicleId: number): Promise<VehicleAmenity[]> {
    return await apiService.get<VehicleAmenity[]>(`/api/vehicles/${vehicleId}/amenities`);
  }

  async addVehicleAmenity(vehicleId: number, amenity: Omit<VehicleAmenity, 'id' | 'vehicleId' | 'createdAt'>): Promise<VehicleAmenity> {
    return await apiService.post<VehicleAmenity>(`/api/vehicles/${vehicleId}/amenities`, amenity);
  }

  async updateVehicleAmenity(amenityId: number, amenity: Partial<VehicleAmenity>): Promise<VehicleAmenity> {
    return await apiService.put<VehicleAmenity>(`/api/vehicles/amenities/${amenityId}`, amenity);
  }

  async deleteVehicleAmenity(amenityId: number): Promise<void> {
    return await apiService.delete(`/api/vehicles/amenities/${amenityId}`);
  }
}

export const vehicleAmenityService = VehicleAmenityService.getInstance();
export { VehicleAmenityService };