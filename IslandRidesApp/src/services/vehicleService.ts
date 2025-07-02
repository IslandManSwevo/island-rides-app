import { VehicleRecommendation, Island } from '../types';
import { ApiService } from './apiService';

export class VehicleService {
  static async getVehiclesByIsland(island: Island): Promise<VehicleRecommendation[]> {
    const response = await ApiService.get(`/recommendations/${island}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch vehicles');
    }

    const data = await response.json();
    return data.recommendations;
  }
}
