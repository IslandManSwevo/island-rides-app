import { BaseService } from './base/BaseService';
import { apiService } from './apiService';
import { 
  VehicleFeature, 
  VehicleFeatureCategory,
  Vehicle,
  VehicleMaintenance,
  VehicleDamageReport
} from '../types';

interface VehicleFeatureResponse {
  categories: VehicleFeatureCategory[];
  features: VehicleFeature[];
}


class VehicleFeatureService extends BaseService {
  constructor() {
    super();
  }

  protected async onInit(): Promise<void> {
    await apiService.waitForInitialization();
  }

  // Feature Categories and Features
  async getVehicleFeatures(): Promise<VehicleFeatureResponse> {
    return await apiService.get<VehicleFeatureResponse>('/api/vehicles/features');
  }

  async getVehicleFeaturesById(vehicleId: number): Promise<VehicleFeature[]> {
    return await apiService.get<VehicleFeature[]>(`/api/vehicles/${vehicleId}/features`);
  }

  async updateVehicleFeatures(vehicleId: number, featureIds: number[]): Promise<void> {
    await apiService.put(`/api/vehicles/${vehicleId}/features`, { featureIds });
  }

  async getFeatureCategories(): Promise<VehicleFeatureCategory[]> {
    return await apiService.get<VehicleFeatureCategory[]>('/api/vehicles/features/categories');
  }

  // Maintenance Records
  async getVehicleMaintenance(vehicleId: number): Promise<VehicleMaintenance[]> {
    return await apiService.get<VehicleMaintenance[]>(`/api/vehicles/${vehicleId}/maintenance`);
  }

  async addMaintenanceRecord(vehicleId: number, record: Omit<VehicleMaintenance, 'id' | 'createdAt' | 'updatedAt'>): Promise<VehicleMaintenance> {
    return await apiService.post<VehicleMaintenance>(`/api/vehicles/${vehicleId}/maintenance`, record);
  }

  // Damage Reports
  async getVehicleDamageReports(vehicleId: number): Promise<VehicleDamageReport[]> {
    return await apiService.get<VehicleDamageReport[]>(`/api/vehicles/${vehicleId}/damage-reports`);
  }

  async reportVehicleDamage(vehicleId: number, report: Omit<VehicleDamageReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<VehicleDamageReport> {
    return await apiService.post<VehicleDamageReport>(`/api/vehicles/${vehicleId}/damage-reports`, report);
  }

  // Utility methods
  formatFeaturesByCategory(features: VehicleFeature[]): Record<string, VehicleFeature[]> {
    return features.reduce((acc, feature) => {
      const categoryName = feature.category?.name || 'Other';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(feature);
      return acc;
    }, {} as Record<string, VehicleFeature[]>);
  }

  // Vehicle analysis methods
  isPremiumVehicle(vehicle: Vehicle): boolean {
    // Check if vehicle has premium features
    const hasPremiumFeatures = vehicle.features?.some(feature => feature.isPremium) || false;
    
    // Check if vehicle has premium characteristics
    const isPremiumType = vehicle.vehicleType === 'convertible' || vehicle.vehicleType === 'coupe';
    const isHighEndBrand = ['BMW', 'Mercedes', 'Audi', 'Lexus', 'Porsche', 'Tesla'].includes(vehicle.make);
    const isHighDailyRate = vehicle.dailyRate > 150;
    const isNewVehicle = vehicle.year >= new Date().getFullYear() - 3;
    
    return hasPremiumFeatures || isPremiumType || isHighEndBrand || (isHighDailyRate && isNewVehicle);
  }

  getVehicleConditionText(conditionRating: number): string {
    if (conditionRating >= 4.5) return 'Excellent';
    if (conditionRating >= 4.0) return 'Very Good';
    if (conditionRating >= 3.5) return 'Good';
    if (conditionRating >= 3.0) return 'Fair';
    if (conditionRating >= 2.0) return 'Poor';
    return 'Very Poor';
  }

  getVerificationStatusText(verificationStatus?: 'pending' | 'verified' | 'rejected' | 'expired'): string {
    switch (verificationStatus) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending Verification';
      case 'rejected': return 'Verification Failed';
      case 'expired': return 'Verification Expired';
      default: return 'Not Verified';
    }
  }

  getVerificationStatusColor(verificationStatus?: 'pending' | 'verified' | 'rejected' | 'expired'): string {
    switch (verificationStatus) {
      case 'verified': return '#4CAF50'; // Green
      case 'pending': return '#FF9800'; // Orange
      case 'rejected': return '#F44336'; // Red
      case 'expired': return '#9E9E9E'; // Grey
      default: return '#9E9E9E'; // Grey
    }
  }
}

export const vehicleFeatureService = VehicleFeatureService.getInstance();
export { VehicleFeatureService };