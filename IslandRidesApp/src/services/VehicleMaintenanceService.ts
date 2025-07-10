import { BaseService } from './base/BaseService';
import { apiService } from './apiService';
import { VehicleMaintenance } from '../types';

class VehicleMaintenanceService extends BaseService {
  protected async onInit(): Promise<void> {
    await apiService.waitForInitialization();
  }

  async getVehicleMaintenance(vehicleId: number): Promise<VehicleMaintenance[]> {
    return await apiService.get<VehicleMaintenance[]>(`/api/vehicles/${vehicleId}/maintenance`);
  }

  async addMaintenanceRecord(vehicleId: number, maintenance: Omit<VehicleMaintenance, 'id' | 'vehicleId' | 'createdAt'>): Promise<VehicleMaintenance> {
    return await apiService.post<VehicleMaintenance>(`/api/vehicles/${vehicleId}/maintenance`, maintenance);
  }

  async updateMaintenanceRecord(maintenanceId: number, maintenance: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> {
    return await apiService.put<VehicleMaintenance>(`/api/vehicles/maintenance/${maintenanceId}`, maintenance);
  }

  async deleteMaintenanceRecord(maintenanceId: number): Promise<void> {
    return await apiService.delete(`/api/vehicles/maintenance/${maintenanceId}`);
  }
}

export const vehicleMaintenanceService = VehicleMaintenanceService.getInstance();
export { VehicleMaintenanceService };