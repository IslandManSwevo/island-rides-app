import { Vehicle } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export class VehicleService {
  static async getVehiclesByIsland(island: string, token: string): Promise<Vehicle[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `Failed to fetch vehicles (${response.status})`);
      }

      const allVehicles = await response.json();
      
      return allVehicles.filter((vehicle: Vehicle) => 
        vehicle.location.toLowerCase() === island.toLowerCase()
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  static async getVehicleById(vehicleId: number, token: string): Promise<Vehicle> {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `Failed to fetch vehicle (${response.status})`);
      }

      const allVehicles = await response.json();
      const vehicle = allVehicles.find((v: Vehicle) => v.id === vehicleId);
      
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      return vehicle;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  }
}
