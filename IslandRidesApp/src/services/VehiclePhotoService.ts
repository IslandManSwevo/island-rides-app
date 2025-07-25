import { BaseService } from './base/BaseService';
import { apiService } from './apiService';
import { VehiclePhoto } from '../types';

// Use standard FormData for React Native compatibility
type VehiclePhotoUploadData = FormData;

class VehiclePhotoService extends BaseService {
  static getVehiclePhotos(vehicleId: number) {
    throw new Error('Method not implemented.');
  }
  static deleteVehiclePhoto(vehicleId: number, photoId: number) {
    throw new Error('Method not implemented.');
  }
  static setPrimaryPhoto(vehicleId: number, photoId: number) {
    throw new Error('Method not implemented.');
  }
  static uploadVehiclePhoto(vehicleId: number, formData: VehiclePhotoUploadData) {
    throw new Error('Method not implemented.');
  }
  protected override async onInit(): Promise<void> {
    await apiService.waitForInitialization();
  }

  async getVehiclePhotos(vehicleId: number): Promise<VehiclePhoto[]> {
    return await apiService.get<VehiclePhoto[]>(`/api/vehicles/${vehicleId}/photos`);
  }

  async uploadVehiclePhoto(vehicleId: number, photoData: VehiclePhotoUploadData): Promise<VehiclePhoto> {
    return await apiService.post<VehiclePhoto>(`/api/vehicles/${vehicleId}/photos`, photoData);
  }

  async updatePhotoOrder(vehicleId: number, photoUpdates: { id: number; displayOrder: number }[]): Promise<void> {
    return await apiService.put(`/api/vehicles/${vehicleId}/photos/order`, { photoUpdates });
  }

  async setPrimaryPhoto(vehicleId: number, photoId: number): Promise<void> {
    return await apiService.put(`/api/vehicles/${vehicleId}/photos/${photoId}/primary`, {});
  }

  async deleteVehiclePhoto(vehicleId: number, photoId: number): Promise<void> {
    return await apiService.delete(`/api/vehicles/${vehicleId}/photos/${photoId}`);
  }
}

export const vehiclePhotoService = VehiclePhotoService.getInstance();
export { VehiclePhotoService };