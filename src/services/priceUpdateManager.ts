/**
 * Price Update Manager
 * Manages real-time vehicle price changes and notifications
 */

import { realTimeService, VehiclePriceUpdate } from './realTimeService';
import { loggingService } from './LoggingService';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';
import { VehicleRecommendation } from '../types';

export interface PriceChangeNotification {
  vehicleId: string;
  vehicleName: string;
  oldPrice: number;
  newPrice: number;
  priceChangePercent: number;
  isPriceDrop: boolean;
  isFavorite: boolean;
  shouldNotify: boolean;
}

export interface PriceAlertSettings {
  enabled: boolean;
  priceDropThreshold: number; // percentage
  favoriteVehiclesOnly: boolean;
  maxNotificationsPerDay: number;
}

type PriceUpdateCallback = (update: VehiclePriceUpdate) => void;
type PriceChangeCallback = (notification: PriceChangeNotification) => void;

class PriceUpdateManager {
  private priceUpdateCallbacks: Set<PriceUpdateCallback> = new Set();
  private priceChangeCallbacks: Set<PriceChangeCallback> = new Set();
  private vehicleCache: Map<string, VehicleRecommendation> = new Map();
  private favoriteVehicles: Set<string> = new Set();
  private priceHistory: Map<string, VehiclePriceUpdate[]> = new Map();
  private dailyNotificationCount = 0;
  private lastNotificationReset = new Date().toDateString();
  
  private alertSettings: PriceAlertSettings = {
    enabled: true,
    priceDropThreshold: 10, // 10% price drop
    favoriteVehiclesOnly: true,
    maxNotificationsPerDay: 5,
  };

  constructor() {
    this.setupRealTimeListeners();
    this.resetDailyNotificationCount();
  }

  /**
   * Setup real-time event listeners
   */
  private setupRealTimeListeners(): void {
    realTimeService.subscribe<VehiclePriceUpdate>(
      'vehicle_price_update',
      this.handlePriceUpdate.bind(this)
    );
  }

  /**
   * Handle incoming price updates
   */
  private handlePriceUpdate(update: VehiclePriceUpdate): void {
    const vehicle = this.vehicleCache.get(update.vehicleId);
    
    if (!vehicle) {
      loggingService.warn('Received price update for unknown vehicle', { 
        vehicleId: update.vehicleId 
      });
      return;
    }

    const oldPrice = vehicle.pricePerDay;
    const newPrice = update.newPrice;
    const priceChangePercent = update.priceChangePercent;
    const isPriceDrop = newPrice < oldPrice;
    const isFavorite = this.favoriteVehicles.has(update.vehicleId);

    // Update cached vehicle data
    vehicle.pricePerDay = newPrice;
    vehicle.originalPrice = update.oldPrice;
    vehicle.lastUpdated = update.effectiveDate;
    
    if (isPriceDrop) {
      vehicle.discount = Math.abs(priceChangePercent);
    }

    this.vehicleCache.set(update.vehicleId, vehicle);

    // Store price history
    this.addToPriceHistory(update);

    // Notify callbacks
    this.priceUpdateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        loggingService.error('Error in price update callback', error as Error);
      }
    });

    // Create price change notification
    const notification: PriceChangeNotification = {
      vehicleId: update.vehicleId,
      vehicleName: `${vehicle.vehicle.make} ${vehicle.vehicle.model}`,
      oldPrice,
      newPrice,
      priceChangePercent,
      isPriceDrop,
      isFavorite,
      shouldNotify: this.shouldShowNotification(update, isPriceDrop, isFavorite),
    };

    // Notify price change callbacks
    this.priceChangeCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        loggingService.error('Error in price change callback', error as Error);
      }
    });

    // Show user notification if appropriate
    if (notification.shouldNotify) {
      this.showPriceChangeNotification(notification, update);
    }

    // Track analytics
    analyticsService.trackEvent('vehicle_price_updated', {
      vehicleId: update.vehicleId,
      oldPrice,
      newPrice,
      priceChangePercent,
      isPriceDrop,
      isFavorite,
      reason: update.reason,
      notificationShown: notification.shouldNotify,
    });
  }

  /**
   * Determine if notification should be shown
   */
  private shouldShowNotification(
    update: VehiclePriceUpdate,
    isPriceDrop: boolean,
    isFavorite: boolean
  ): boolean {
    if (!this.alertSettings.enabled) return false;
    
    // Check daily notification limit
    this.checkAndResetDailyCount();
    if (this.dailyNotificationCount >= this.alertSettings.maxNotificationsPerDay) {
      return false;
    }

    // Check if favorites only setting is enabled
    if (this.alertSettings.favoriteVehiclesOnly && !isFavorite) {
      return false;
    }

    // Check price drop threshold
    if (isPriceDrop && Math.abs(update.priceChangePercent) >= this.alertSettings.priceDropThreshold) {
      return true;
    }

    // Show notifications for significant price increases on favorites
    if (isFavorite && !isPriceDrop && update.priceChangePercent >= 20) {
      return true;
    }

    return false;
  }

  /**
   * Show price change notification to user
   */
  private showPriceChangeNotification(
    notification: PriceChangeNotification,
    update: VehiclePriceUpdate
  ): void {
    const { vehicleName, oldPrice, newPrice, priceChangePercent, isPriceDrop } = notification;
    
    let message = '';
    let notificationType: 'success' | 'info' | 'warning' = 'info';

    if (isPriceDrop) {
      const savings = oldPrice - newPrice;
      message = `💰 Price Drop! ${vehicleName} is now $${newPrice}/day (save $${savings.toFixed(2)})`;
      notificationType = 'success';
    } else {
      message = `📈 Price Update: ${vehicleName} is now $${newPrice}/day (+${priceChangePercent.toFixed(1)}%)`;
      notificationType = 'warning';
    }

    // Add reason context if available
    const reasonText = this.getPriceChangeReasonText(update.reason);
    if (reasonText) {
      message += ` ${reasonText}`;
    }

    notificationService.show(message, {
      type: notificationType,
      duration: 7000,
      action: {
        label: 'View Vehicle',
        handler: () => {
          analyticsService.trackEvent('price_notification_clicked', {
            vehicleId: notification.vehicleId,
            isPriceDrop,
            priceChangePercent,
          });
        }
      }
    });

    this.dailyNotificationCount++;
  }

  /**
   * Get human-readable price change reason
   */
  private getPriceChangeReasonText(reason?: string): string {
    switch (reason) {
      case 'demand': return '(high demand)';
      case 'promotion': return '(special offer)';
      case 'seasonal': return '(seasonal pricing)';
      case 'manual': return '';
      default: return '';
    }
  }

  /**
   * Add price update to history
   */
  private addToPriceHistory(update: VehiclePriceUpdate): void {
    if (!this.priceHistory.has(update.vehicleId)) {
      this.priceHistory.set(update.vehicleId, []);
    }

    const history = this.priceHistory.get(update.vehicleId)!;
    history.push(update);

    // Keep only last 10 price changes per vehicle
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Check and reset daily notification count
   */
  private checkAndResetDailyCount(): void {
    const today = new Date().toDateString();
    if (this.lastNotificationReset !== today) {
      this.dailyNotificationCount = 0;
      this.lastNotificationReset = today;
    }
  }

  /**
   * Reset daily notification count (for testing)
   */
  private resetDailyNotificationCount(): void {
    // Reset at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.dailyNotificationCount = 0;
      this.lastNotificationReset = new Date().toDateString();
      
      // Set up daily reset
      setInterval(() => {
        this.dailyNotificationCount = 0;
        this.lastNotificationReset = new Date().toDateString();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, msUntilMidnight);
  }

  /**
   * Subscribe to price updates
   */
  onPriceUpdate(callback: PriceUpdateCallback): () => void {
    this.priceUpdateCallbacks.add(callback);
    
    return () => {
      this.priceUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to price change notifications
   */
  onPriceChange(callback: PriceChangeCallback): () => void {
    this.priceChangeCallbacks.add(callback);
    
    return () => {
      this.priceChangeCallbacks.delete(callback);
    };
  }

  /**
   * Update vehicle cache
   */
  updateVehicleCache(vehicles: VehicleRecommendation[]): void {
    vehicles.forEach(vehicle => {
      this.vehicleCache.set(vehicle.id, vehicle);
    });
  }

  /**
   * Set favorite vehicles for enhanced notifications
   */
  setFavoriteVehicles(vehicleIds: string[]): void {
    this.favoriteVehicles.clear();
    vehicleIds.forEach(id => this.favoriteVehicles.add(id));
  }

  /**
   * Update price alert settings
   */
  updateAlertSettings(settings: Partial<PriceAlertSettings>): void {
    this.alertSettings = {
      ...this.alertSettings,
      ...settings,
    };

    analyticsService.trackEvent('price_alert_settings_updated', {
      enabled: this.alertSettings.enabled,
      priceDropThreshold: this.alertSettings.priceDropThreshold,
      favoriteVehiclesOnly: this.alertSettings.favoriteVehiclesOnly,
    });
  }

  /**
   * Get price history for a vehicle
   */
  getPriceHistory(vehicleId: string): VehiclePriceUpdate[] {
    return this.priceHistory.get(vehicleId) || [];
  }

  /**
   * Get current alert settings
   */
  getAlertSettings(): PriceAlertSettings {
    return { ...this.alertSettings };
  }

  /**
   * Get price statistics
   */
  getPriceStats(): {
    totalVehicles: number;
    vehiclesWithHistory: number;
    dailyNotificationsUsed: number;
    dailyNotificationsRemaining: number;
  } {
    return {
      totalVehicles: this.vehicleCache.size,
      vehiclesWithHistory: this.priceHistory.size,
      dailyNotificationsUsed: this.dailyNotificationCount,
      dailyNotificationsRemaining: Math.max(0, this.alertSettings.maxNotificationsPerDay - this.dailyNotificationCount),
    };
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.vehicleCache.clear();
    this.favoriteVehicles.clear();
    this.priceHistory.clear();
    this.priceUpdateCallbacks.clear();
    this.priceChangeCallbacks.clear();
    this.dailyNotificationCount = 0;

    loggingService.info('Price update manager cleared');
  }
}

export const priceUpdateManager = new PriceUpdateManager();
