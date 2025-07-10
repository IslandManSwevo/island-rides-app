import { BaseService } from './base/BaseService';
import { apiService } from './apiService';
import { VehicleDamageReport } from '../types';

class VehicleDamageService extends BaseService {
  protected async onInit(): Promise<void> {
    await apiService.waitForInitialization();
  }

  async getDamageReports(vehicleId: number): Promise<VehicleDamageReport[]> {
    return await apiService.get<VehicleDamageReport[]>(`/api/vehicles/${vehicleId}/damage-reports`);
  }

  async createDamageReport(vehicleId: number, report: Omit<VehicleDamageReport, 'id' | 'vehicleId' | 'createdAt'>): Promise<VehicleDamageReport> {
    return await apiService.post<VehicleDamageReport>(`/api/vehicles/${vehicleId}/damage-reports`, report);
  }

  async updateDamageReport(reportId: number, report: Partial<VehicleDamageReport>): Promise<VehicleDamageReport> {
    return await apiService.put<VehicleDamageReport>(`/api/vehicles/damage-reports/${reportId}`, report);
  }
}

export const vehicleDamageService = VehicleDamageService.getInstance();
export { VehicleDamageService };