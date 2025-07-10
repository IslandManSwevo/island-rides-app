import { BaseService } from './base/BaseService';
import { apiService } from './apiService';
import { DamageReport } from '../types';

class VehicleDamageService extends BaseService {
  protected async onInit(): Promise<void> {
    await apiService.waitForInitialization();
  }

  async getDamageReports(vehicleId: number): Promise<DamageReport[]> {
    return await apiService.get<DamageReport[]>(`/api/vehicles/${vehicleId}/damage-reports`);
  }

  async createDamageReport(vehicleId: number, report: Omit<DamageReport, 'id' | 'vehicleId' | 'createdAt'>): Promise<DamageReport> {
    return await apiService.post<DamageReport>(`/api/vehicles/${vehicleId}/damage-reports`, report);
  }

  async updateDamageReport(reportId: number, report: Partial<DamageReport>): Promise<DamageReport> {
    return await apiService.put<DamageReport>(`/api/vehicles/damage-reports/${reportId}`, report);
  }
}

export const vehicleDamageService = VehicleDamageService.getInstance();
export { VehicleDamageService };