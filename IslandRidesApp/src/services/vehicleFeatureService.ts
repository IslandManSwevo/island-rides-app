import { BaseService } from './base/BaseService';
import { apiService } from './apiService';
import { 
  VehicleFeature, 
  VehicleFeatureCategory, 
  VehicleAmenity, 
  VehiclePhoto,
  VehicleAvailability,
  VehicleMaintenance,
  VehicleDamageReport
} from '../types';

interface VehicleFeatureResponse {
  categories: VehicleFeatureCategory[];
  features: VehicleFeature[];
}

interface VehiclePhotosResponse {
  photos: VehiclePhoto[];
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

  // Vehicle Photos
  async getVehiclePhotos(vehicleId: number): Promise<VehiclePhoto[]> {
    return await apiService.get<VehiclePhoto[]>(`/vehicles/${vehicleId}/photos`);
  }

  async uploadVehiclePhoto(vehicleId: number, photoData: FormData): Promise<VehiclePhoto> {
    return await apiService.post<VehiclePhoto>(`/vehicles/${vehicleId}/photos`, photoData);
  }

  async updatePhotoOrder(vehicleId: number, photoUpdates: { id: number; displayOrder: number }[]): Promise<void> {
    return await apiService.put(`/vehicles/${vehicleId}/photos/order`, { photoUpdates });
  }

  async setPrimaryPhoto(vehicleId: number, photoId: number): Promise<void> {
    return await apiService.put(`/vehicles/${vehicleId}/photos/${photoId}/primary`, {});
  }

  async deleteVehiclePhoto(vehicleId: number, photoId: number): Promise<void> {
    return await apiService.delete(`/vehicles/${vehicleId}/photos/${photoId}`);
  }

  // Vehicle Amenities
  async getVehicleAmenities(vehicleId: number): Promise<VehicleAmenity[]> {
    return await apiService.get<VehicleAmenity[]>(`/vehicles/${vehicleId}/amenities`);
  }

  async addVehicleAmenity(vehicleId: number, amenity: Omit<VehicleAmenity, 'id' | 'vehicleId' | 'createdAt'>): Promise<VehicleAmenity> {
    return await apiService.post<VehicleAmenity>(`/vehicles/${vehicleId}/amenities`, amenity);
  }

  async updateVehicleAmenity(amenityId: number, amenity: Partial<VehicleAmenity>): Promise<VehicleAmenity> {
    return await apiService.put<VehicleAmenity>(`/vehicles/amenities/${amenityId}`, amenity);
  }

  async deleteVehicleAmenity(amenityId: number): Promise<void> {
    return await apiService.delete(`/vehicles/amenities/${amenityId}`);
  }

  // Vehicle Availability
  async getVehicleAvailability(vehicleId: number, startDate: string, endDate: string): Promise<VehicleAvailability[]> {
    return await apiService.get<VehicleAvailability[]>(`/vehicles/${vehicleId}/availability`, {
      startDate,
      endDate
    });
  }

  async updateVehicleAvailability(vehicleId: number, availability: Omit<VehicleAvailability, 'id' | 'vehicleId' | 'createdAt'>[]): Promise<void> {
    return await apiService.put(`/vehicles/${vehicleId}/availability`, { availability });
  }

  async blockDates(vehicleId: number, dates: string[], reason?: string): Promise<void> {
    return await apiService.post(`/vehicles/${vehicleId}/availability/block`, { dates, reason });
  }

  async unblockDates(vehicleId: number, dates: string[]): Promise<void> {
    return await apiService.post(`/vehicles/${vehicleId}/availability/unblock`, { dates });
  }

  // Vehicle Maintenance
  async getVehicleMaintenance(vehicleId: number): Promise<VehicleMaintenance[]> {
    return await apiService.get<VehicleMaintenance[]>(`/vehicles/${vehicleId}/maintenance`);
  }

  async addMaintenanceRecord(vehicleId: number, maintenance: Omit<VehicleMaintenance, 'id' | 'vehicleId' | 'createdAt'>): Promise<VehicleMaintenance> {
    return await apiService.post<VehicleMaintenance>(`/vehicles/${vehicleId}/maintenance`, maintenance);
  }

  async updateMaintenanceRecord(maintenanceId: number, maintenance: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> {
    return await apiService.put<VehicleMaintenance>(`/vehicles/maintenance/${maintenanceId}`, maintenance);
  }

  async deleteMaintenanceRecord(maintenanceId: number): Promise<void> {
    return await apiService.delete(`/vehicles/maintenance/${maintenanceId}`);
  }

  // Vehicle Damage Reports
  async getVehicleDamageReports(vehicleId: number): Promise<VehicleDamageReport[]> {
    return await apiService.get<VehicleDamageReport[]>(`/vehicles/${vehicleId}/damage-reports`);
  }

  async reportVehicleDamage(vehicleId: number, report: Omit<VehicleDamageReport, 'id' | 'vehicleId' | 'createdAt'>): Promise<VehicleDamageReport> {
    return await apiService.post<VehicleDamageReport>(`/vehicles/${vehicleId}/damage-reports`, report);
  }

  async updateDamageReport(reportId: number, report: Partial<VehicleDamageReport>): Promise<VehicleDamageReport> {
    return await apiService.put<VehicleDamageReport>(`/vehicles/damage-reports/${reportId}`, report);
  }

  async resolveDamageReport(reportId: number, resolution: { resolutionNotes: string; repairCost?: number }): Promise<void> {
    return await apiService.put(`/vehicles/damage-reports/${reportId}/resolve`, resolution);
  }

  // Search and filtering helpers
  getVehicleTypeOptions(): Array<{ label: string; value: string }> {
    return [
      { label: 'Sedan', value: 'sedan' },
      { label: 'SUV', value: 'suv' },
      { label: 'Truck', value: 'truck' },
      { label: 'Van', value: 'van' },
      { label: 'Convertible', value: 'convertible' },
      { label: 'Coupe', value: 'coupe' },
      { label: 'Hatchback', value: 'hatchback' }
    ];
  }

  getFuelTypeOptions(): Array<{ label: string; value: string }> {
    return [
      { label: 'Gasoline', value: 'gasoline' },
      { label: 'Diesel', value: 'diesel' },
      { label: 'Electric', value: 'electric' },
      { label: 'Hybrid', value: 'hybrid' }
    ];
  }

  getTransmissionOptions(): Array<{ label: string; value: string }> {
    return [
      { label: 'Automatic', value: 'automatic' },
      { label: 'Manual', value: 'manual' },
      { label: 'CVT', value: 'cvt' }
    ];
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

  calculateTotalAdditionalCost(features: VehicleFeature[], amenities: VehicleAmenity[]): number {
    const featureCost = features
      .filter(f => f.isIncluded && f.additionalCost)
      .reduce((sum, f) => sum + (f.additionalCost || 0), 0);
    
    const amenityCost = amenities
      .filter(a => !a.isStandard)
      .reduce((sum, a) => sum + a.additionalCost, 0);
    
    return featureCost + amenityCost;
  }

  isPremiumVehicle(vehicle: { features?: VehicleFeature[]; conditionRating?: number }): boolean {
    const hasPremiumFeatures = vehicle.features?.some(f => f.isPremium && f.isIncluded) || false;
    const highConditionRating = (vehicle.conditionRating || 0) >= 4;
    return hasPremiumFeatures || highConditionRating;
  }

  getVehicleConditionText(rating: number): string {
    switch (rating) {
      case 5: return 'Excellent';
      case 4: return 'Very Good';
      case 3: return 'Good';
      case 2: return 'Fair';
      case 1: return 'Poor';
      default: return 'Not Rated';
    }
  }

  getVerificationStatusText(status?: string): string {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending Verification';
      case 'rejected': return 'Verification Failed';
      case 'expired': return 'Verification Expired';
      default: return 'Not Verified';
    }
  }

  getVerificationStatusColor(status?: string): string {
    switch (status) {
      case 'verified': return '#10B981'; // green
      case 'pending': return '#F59E0B'; // yellow
      case 'rejected': return '#EF4444'; // red
      case 'expired': return '#6B7280'; // gray
      default: return '#6B7280'; // gray
    }
  }
}

export const vehicleFeatureService = VehicleFeatureService.getInstance();
export { VehicleFeatureService }; 