import { BaseService } from './base/BaseService';
import { apiService } from './apiService';
import { 
  VehicleFeature, 
  VehicleFeatureCategory
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
}

export const vehicleFeatureService = VehicleFeatureService.getInstance();
export { VehicleFeatureService };