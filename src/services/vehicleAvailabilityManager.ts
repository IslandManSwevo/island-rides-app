/**
 * Vehicle Availability Manager
 * Manages real-time vehicle availability updates and UI synchronization
 */

import { realTimeService, VehicleAvailabilityUpdate } from './realTimeService';
import { loggingService } from './LoggingService';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';
import { VehicleRecommendation } from '../types';

export interface AvailabilityChangeNotification {
  vehicleId: string;
  vehicleName: string;
  available: boolean;
  reason?: string;
  showNotification: boolean;
  notificationMessage?: string;
}

type AvailabilityUpdateCallback = (update: VehicleAvailabilityUpdate) => void;
type VehicleListUpdateCallback = (vehicles: VehicleRecommendation[]) => void;

class VehicleAvailabilityManager {
  private subscribedVehicles: Set<string> = new Set();
  private availabilityCallbacks: Set<AvailabilityUpdateCallback> = new Set();
  private vehicleListCallbacks: Set<VehicleListUpdateCallback> = new Set();
  private vehicleCache: Map<string, VehicleRecommendation> = new Map();
  private favoriteVehicles: Set<string> = new Set();
  private notificationPreferences = {
    showAvailabilityChanges: true,
    showFavoriteUpdates: true,
    showPriceDrops: true,
  };

  constructor() {
    this.setupRealTimeListeners();
  }

  /**
   * Setup real-time event listeners
   */
  private setupRealTimeListeners(): void {
    realTimeService.subscribe<VehicleAvailabilityUpdate>(
      'vehicle_availability_update',
      this.handleAvailabilityUpdate.bind(this)
    );

    realTimeService.subscribe('connection_status', (status) => {
      if (status.connected && this.subscribedVehicles.size > 0) {
        // Re-subscribe to vehicles after reconnection
        this.resubscribeToVehicles();
      }
    });
  }

  /**
   * Subscribe to availability updates for specific vehicles
   */
  subscribeToVehicles(vehicles: VehicleRecommendation[]): void {
    const vehicleIds = vehicles.map(v => v.id);
    const newVehicleIds = vehicleIds.filter(id => !this.subscribedVehicles.has(id));

    if (newVehicleIds.length === 0) return;

    // Cache vehicle data
    vehicles.forEach(vehicle => {
      this.vehicleCache.set(vehicle.id, vehicle);
      this.subscribedVehicles.add(vehicle.id);
    });

    // Subscribe to real-time updates
    realTimeService.subscribeToVehicleUpdates(newVehicleIds);

    loggingService.info('Subscribed to vehicle availability updates', {
      vehicleCount: newVehicleIds.length,
      totalSubscribed: this.subscribedVehicles.size,
    });

    analyticsService.trackEvent('vehicle_availability_subscription', {
      newVehicles: newVehicleIds.length,
      totalSubscribed: this.subscribedVehicles.size,
    });
  }

  /**
   * Unsubscribe from specific vehicles
   */
  unsubscribeFromVehicles(vehicleIds: string[]): void {
    const subscribedIds = vehicleIds.filter(id => this.subscribedVehicles.has(id));
    
    if (subscribedIds.length === 0) return;

    subscribedIds.forEach(id => {
      this.subscribedVehicles.delete(id);
      this.vehicleCache.delete(id);
    });

    realTimeService.unsubscribeFromVehicleUpdates(subscribedIds);

    loggingService.info('Unsubscribed from vehicle availability updates', {
      vehicleCount: subscribedIds.length,
      remainingSubscribed: this.subscribedVehicles.size,
    });
  }

  /**
   * Handle incoming availability updates
   */
  private handleAvailabilityUpdate(update: VehicleAvailabilityUpdate): void {
    const vehicle = this.vehicleCache.get(update.vehicleId);
    
    if (!vehicle) {
      loggingService.warn('Received update for unknown vehicle', { vehicleId: update.vehicleId });
      return;
    }

    const wasAvailable = vehicle.available;
    const isNowAvailable = update.available;

    // Update cached vehicle data
    vehicle.available = isNowAvailable;
    vehicle.lastUpdated = update.lastUpdated;
    if (update.nextAvailableDate) {
      vehicle.nextAvailableDate = update.nextAvailableDate;
    }

    this.vehicleCache.set(update.vehicleId, vehicle);

    // Notify callbacks
    this.availabilityCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        loggingService.error('Error in availability callback', error as Error);
      }
    });

    // Update vehicle lists
    this.updateVehicleLists();

    // Show notifications if appropriate
    this.handleAvailabilityNotification(vehicle, wasAvailable, isNowAvailable, update);

    // Track analytics
    analyticsService.trackEvent('vehicle_availability_updated', {
      vehicleId: update.vehicleId,
      wasAvailable,
      isNowAvailable,
      reason: update.reason,
      isFavorite: this.favoriteVehicles.has(update.vehicleId),
    });
  }

  /**
   * Handle availability change notifications
   */
  private handleAvailabilityNotification(
    vehicle: VehicleRecommendation,
    wasAvailable: boolean,
    isNowAvailable: boolean,
    update: VehicleAvailabilityUpdate
  ): void {
    if (!this.notificationPreferences.showAvailabilityChanges) return;

    const isFavorite = this.favoriteVehicles.has(vehicle.id);
    const shouldNotify = isFavorite && this.notificationPreferences.showFavoriteUpdates;

    if (!shouldNotify) return;

    let notificationMessage = '';
    let notificationType: 'success' | 'info' | 'warning' = 'info';

    if (!wasAvailable && isNowAvailable) {
      // Vehicle became available
      notificationMessage = `${vehicle.vehicle.make} ${vehicle.vehicle.model} is now available!`;
      notificationType = 'success';
    } else if (wasAvailable && !isNowAvailable) {
      // Vehicle became unavailable
      const reasonText = this.getReasonText(update.reason);
      notificationMessage = `${vehicle.vehicle.make} ${vehicle.vehicle.model} is no longer available${reasonText}`;
      notificationType = 'warning';
      
      if (update.nextAvailableDate) {
        const nextDate = new Date(update.nextAvailableDate).toLocaleDateString();
        notificationMessage += ` Available again on ${nextDate}`;
      }
    }

    if (notificationMessage) {
      notificationService.show(notificationMessage, {
        type: notificationType,
        duration: 5000,
        action: {
          label: 'View Vehicle',
          handler: () => {
            analyticsService.trackEvent('availability_notification_clicked', {
              vehicleId: vehicle.id,
              notificationType,
            });
          }
        }
      });
    }
  }

  /**
   * Get human-readable reason text
   */
  private getReasonText(reason?: string): string {
    switch (reason) {
      case 'booked': return ' (just booked)';
      case 'maintenance': return ' (maintenance required)';
      case 'returned': return '';
      case 'manual': return '';
      default: return '';
    }
  }

  /**
   * Update all vehicle list callbacks
   */
  private updateVehicleLists(): void {
    const updatedVehicles = Array.from(this.vehicleCache.values());
    
    this.vehicleListCallbacks.forEach(callback => {
      try {
        callback(updatedVehicles);
      } catch (error) {
        loggingService.error('Error in vehicle list callback', error as Error);
      }
    });
  }

  /**
   * Re-subscribe to vehicles after reconnection
   */
  private resubscribeToVehicles(): void {
    if (this.subscribedVehicles.size > 0) {
      const vehicleIds = Array.from(this.subscribedVehicles);
      realTimeService.subscribeToVehicleUpdates(vehicleIds);
      
      loggingService.info('Re-subscribed to vehicles after reconnection', {
        vehicleCount: vehicleIds.length,
      });
    }
  }

  /**
   * Subscribe to availability updates
   */
  onAvailabilityUpdate(callback: AvailabilityUpdateCallback): () => void {
    this.availabilityCallbacks.add(callback);
    
    return () => {
      this.availabilityCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to vehicle list updates
   */
  onVehicleListUpdate(callback: VehicleListUpdateCallback): () => void {
    this.vehicleListCallbacks.add(callback);
    
    return () => {
      this.vehicleListCallbacks.delete(callback);
    };
  }

  /**
   * Set favorite vehicles for enhanced notifications
   */
  setFavoriteVehicles(vehicleIds: string[]): void {
    this.favoriteVehicles.clear();
    vehicleIds.forEach(id => this.favoriteVehicles.add(id));
  }

  /**
   * Update notification preferences
   */
  updateNotificationPreferences(preferences: Partial<typeof this.notificationPreferences>): void {
    this.notificationPreferences = {
      ...this.notificationPreferences,
      ...preferences,
    };
  }

  /**
   * Get current vehicle availability status
   */
  getVehicleAvailability(vehicleId: string): boolean | null {
    const vehicle = this.vehicleCache.get(vehicleId);
    return vehicle ? vehicle.available : null;
  }

  /**
   * Get all cached vehicles
   */
  getCachedVehicles(): VehicleRecommendation[] {
    return Array.from(this.vehicleCache.values());
  }

  /**
   * Force refresh availability for specific vehicles
   */
  refreshAvailability(vehicleIds: string[]): void {
    const subscribedIds = vehicleIds.filter(id => this.subscribedVehicles.has(id));
    
    if (subscribedIds.length > 0) {
      // Request fresh availability data
      realTimeService.subscribeToVehicleUpdates(subscribedIds);
      
      analyticsService.trackEvent('availability_refresh_requested', {
        vehicleCount: subscribedIds.length,
      });
    }
  }

  /**
   * Clear all subscriptions and cache
   */
  clearAll(): void {
    if (this.subscribedVehicles.size > 0) {
      const vehicleIds = Array.from(this.subscribedVehicles);
      realTimeService.unsubscribeFromVehicleUpdates(vehicleIds);
    }

    this.subscribedVehicles.clear();
    this.vehicleCache.clear();
    this.favoriteVehicles.clear();
    this.availabilityCallbacks.clear();
    this.vehicleListCallbacks.clear();

    loggingService.info('Vehicle availability manager cleared');
  }

  /**
   * Get subscription statistics
   */
  getStats(): {
    subscribedVehicles: number;
    cachedVehicles: number;
    favoriteVehicles: number;
    activeCallbacks: number;
  } {
    return {
      subscribedVehicles: this.subscribedVehicles.size,
      cachedVehicles: this.vehicleCache.size,
      favoriteVehicles: this.favoriteVehicles.size,
      activeCallbacks: this.availabilityCallbacks.size + this.vehicleListCallbacks.size,
    };
  }
}

export const vehicleAvailabilityManager = new VehicleAvailabilityManager();
