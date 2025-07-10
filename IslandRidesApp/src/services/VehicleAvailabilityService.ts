import { BaseService } from './base/BaseService';
import { apiService } from './apiService';
import { VehicleAvailability } from '../types';

class VehicleAvailabilityService extends BaseService {
  protected async onInit(): Promise<void> {
    await apiService.waitForInitialization();
  }

  async getVehicleAvailability(vehicleId: number, startDate: string, endDate: string): Promise<VehicleAvailability[]> {
    return await apiService.get<VehicleAvailability[]>(`/api/vehicles/${vehicleId}/availability`, {
      startDate,
      endDate
    });
  }

  async updateVehicleAvailability(vehicleId: number, availability: Omit<VehicleAvailability, 'id' | 'vehicleId' | 'createdAt'>[]): Promise<void> {
    return await apiService.put(`/api/vehicles/${vehicleId}/availability`, { availability });
  }

  async blockDates(vehicleId: number, dates: string[], reason?: string): Promise<void> {
    return await apiService.post(`/api/vehicles/${vehicleId}/availability/block`, { dates, reason });
  }

  async unblockDates(vehicleId: number, dates: string[]): Promise<void> {
    return await apiService.post(`/api/vehicles/${vehicleId}/availability/unblock`, { dates });
  }
}

export const vehicleAvailabilityService = VehicleAvailabilityService.getInstance();
export { VehicleAvailabilityService };