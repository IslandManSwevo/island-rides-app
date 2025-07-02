import { VehicleRecommendation, Island } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export class VehicleService {
  static async getVehiclesByIsland(island: Island, token: string): Promise<VehicleRecommendation[]> {
    const response = await fetch(`${API_BASE_URL}/recommendations/${island}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch vehicles');
    }

    const data = await response.json();
    return data.recommendations;
  }
}
