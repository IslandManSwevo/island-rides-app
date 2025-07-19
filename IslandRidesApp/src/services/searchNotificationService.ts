import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchFilters, VehicleRecommendation } from '../types';
import { notificationService } from './notificationService';
import { vehicleService } from './vehicleService';

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  isActive: boolean;
  notificationEnabled: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  lastChecked: Date;
  lastNotified: Date | null;
  matchCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchAlert {
  id: string;
  savedSearchId: string;
  vehicleId: string;
  alertType: 'new_vehicle' | 'price_drop' | 'availability' | 'feature_match';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  alertTypes: {
    newVehicle: boolean;
    priceDrops: boolean;
    availability: boolean;
    featureMatches: boolean;
  };
}

class SearchNotificationService {
  private readonly STORAGE_KEYS = {
    SAVED_SEARCHES: 'savedSearches',
    SEARCH_ALERTS: 'searchAlerts',
    NOTIFICATION_PREFERENCES: 'notificationPreferences'
  };

  private readonly DEFAULT_PREFERENCES: NotificationPreferences = {
    enabled: true,
    frequency: 'daily',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    },
    alertTypes: {
      newVehicle: true,
      priceDrops: true,
      availability: true,
      featureMatches: true
    }
  };

  async saveSavedSearch(search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedSearch> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const savedSearch: SavedSearch = {
        ...search,
        id,
        createdAt: now,
        updatedAt: now
      };

      const existingSearches = await this.getSavedSearches();
      const updatedSearches = [...existingSearches, savedSearch];
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SAVED_SEARCHES,
        JSON.stringify(updatedSearches)
      );

      // Perform initial check for matches
      await this.checkForMatches(savedSearch);

      return savedSearch;
    } catch (error) {
      console.error('Failed to save search:', error);
      throw error;
    }
  }

  async getSavedSearches(): Promise<SavedSearch[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.SAVED_SEARCHES);
      if (!data) return [];
      
      return JSON.parse(data).map((search: any) => ({
        ...search,
        createdAt: new Date(search.createdAt),
        updatedAt: new Date(search.updatedAt),
        lastChecked: new Date(search.lastChecked),
        lastNotified: search.lastNotified ? new Date(search.lastNotified) : null
      }));
    } catch (error) {
      console.error('Failed to get saved searches:', error);
      return [];
    }
  }

  async updateSavedSearch(id: string, updates: Partial<SavedSearch>): Promise<void> {
    try {
      const searches = await this.getSavedSearches();
      const searchIndex = searches.findIndex(s => s.id === id);
      
      if (searchIndex === -1) {
        throw new Error('Saved search not found');
      }

      searches[searchIndex] = {
        ...searches[searchIndex],
        ...updates,
        updatedAt: new Date()
      };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SAVED_SEARCHES,
        JSON.stringify(searches)
      );
    } catch (error) {
      console.error('Failed to update saved search:', error);
      throw error;
    }
  }

  async deleteSavedSearch(id: string): Promise<void> {
    try {
      const searches = await this.getSavedSearches();
      const filteredSearches = searches.filter(s => s.id !== id);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SAVED_SEARCHES,
        JSON.stringify(filteredSearches)
      );

      // Also delete associated alerts
      await this.deleteAlertsForSearch(id);
    } catch (error) {
      console.error('Failed to delete saved search:', error);
      throw error;
    }
  }

  async toggleSearchActive(id: string): Promise<void> {
    try {
      const searches = await this.getSavedSearches();
      const search = searches.find(s => s.id === id);
      
      if (!search) {
        throw new Error('Saved search not found');
      }

      await this.updateSavedSearch(id, { isActive: !search.isActive });
    } catch (error) {
      console.error('Failed to toggle search active state:', error);
      throw error;
    }
  }

  async checkForMatches(savedSearch: SavedSearch): Promise<void> {
    try {
      if (!savedSearch.isActive) return;

      const searchParams = this.convertFiltersToSearchParams(savedSearch.filters);
      const currentMatches = await vehicleService.searchVehicles(searchParams);

      // Get previous match count
      const previousMatchCount = savedSearch.matchCount;
      const currentMatchCount = currentMatches.length;

      // Update match count and last checked time
      await this.updateSavedSearch(savedSearch.id, {
        matchCount: currentMatchCount,
        lastChecked: new Date()
      });

      // Check for new vehicles
      if (currentMatchCount > previousMatchCount) {
        const newVehicleCount = currentMatchCount - previousMatchCount;
        await this.createAlert(savedSearch.id, {
          alertType: 'new_vehicle',
          message: `${newVehicleCount} new vehicle${newVehicleCount > 1 ? 's' : ''} found for "${savedSearch.name}"`,
          vehicleId: currentMatches[0]?.id || ''
        });
      }

      // Check for price drops and other specific matches
      await this.checkForSpecificMatches(savedSearch, currentMatches);
    } catch (error) {
      console.error('Failed to check for matches:', error);
    }
  }

  async checkAllSavedSearches(): Promise<void> {
    try {
      const searches = await this.getSavedSearches();
      const activeSearches = searches.filter(s => s.isActive && s.notificationEnabled);

      for (const search of activeSearches) {
        if (this.shouldCheckSearch(search)) {
          await this.checkForMatches(search);
        }
      }
    } catch (error) {
      console.error('Failed to check all saved searches:', error);
    }
  }

  private shouldCheckSearch(search: SavedSearch): boolean {
    const now = new Date();
    const lastChecked = new Date(search.lastChecked);
    const timeSinceLastCheck = now.getTime() - lastChecked.getTime();

    switch (search.notificationFrequency) {
      case 'immediate':
        return timeSinceLastCheck > 5 * 60 * 1000; // 5 minutes
      case 'daily':
        return timeSinceLastCheck > 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return timeSinceLastCheck > 7 * 24 * 60 * 60 * 1000; // 7 days
      default:
        return false;
    }
  }

  private async checkForSpecificMatches(
    savedSearch: SavedSearch,
    currentMatches: VehicleRecommendation[]
  ): Promise<void> {
    const preferences = await this.getNotificationPreferences();
    
    // Check for price drops
    if (preferences.alertTypes.priceDrops) {
      const priceDropMatches = currentMatches.filter(vehicle => {
        const maxBudget = savedSearch.filters.priceRange[1];
        return (vehicle.vehicle.price || 0) < maxBudget * 0.9; // 10% below max budget
      });

      if (priceDropMatches.length > 0) {
        await this.createAlert(savedSearch.id, {
          alertType: 'price_drop',
          message: `Great deals found for "${savedSearch.name}" - vehicles under budget!`,
          vehicleId: priceDropMatches[0].vehicle.id.toString()
        });
      }
    }

    // Check for instant booking availability
    if (preferences.alertTypes.availability && savedSearch.filters.instantBooking) {
      const instantBookingMatches = currentMatches.filter(vehicle => 
        vehicle.vehicle.instantBooking
      );

      if (instantBookingMatches.length > 0) {
        await this.createAlert(savedSearch.id, {
          alertType: 'availability',
          message: `Instant booking vehicles available for "${savedSearch.name}"`,
          vehicleId: instantBookingMatches[0].vehicle.id.toString()
        });
      }
    }

    // Check for feature matches
    if (preferences.alertTypes.featureMatches && savedSearch.filters.features.length > 0) {
      const featureMatches = currentMatches.filter(vehicle => {
        const vehicleFeatureIds = vehicle.vehicle.features?.map(f => f.id) || [];
        return savedSearch.filters.features.some(featureId => 
          vehicleFeatureIds.includes(featureId)
        );
      });

      if (featureMatches.length > 0) {
        await this.createAlert(savedSearch.id, {
          alertType: 'feature_match',
          message: `Vehicles with your preferred features found for "${savedSearch.name}"`,
          vehicleId: featureMatches[0].vehicle.id.toString()
        });
      }
    }
  }

  private async createAlert(
    savedSearchId: string,
    alertData: {
      alertType: SearchAlert['alertType'];
      message: string;
      vehicleId: string;
    }
  ): Promise<void> {
    try {
      const preferences = await this.getNotificationPreferences();
      
      if (!preferences.enabled) return;
      if (this.isInQuietHours(preferences.quietHours)) return;

      const alert: SearchAlert = {
        id: this.generateId(),
        savedSearchId,
        vehicleId: alertData.vehicleId,
        alertType: alertData.alertType,
        message: alertData.message,
        isRead: false,
        createdAt: new Date()
      };

      // Save alert
      const existingAlerts = await this.getSearchAlerts();
      const updatedAlerts = [...existingAlerts, alert];
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SEARCH_ALERTS,
        JSON.stringify(updatedAlerts)
      );

      // Send notification
      await notificationService.info(alert.message, {
        duration: 6000,
        action: {
          label: 'View',
          handler: () => {
            // Navigate to search results or vehicle detail
            console.log('Navigate to search results for:', savedSearchId);
          }
        }
      });

      // Update last notified time
      await this.updateSavedSearch(savedSearchId, {
        lastNotified: new Date()
      });
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }

  private isInQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  async getSearchAlerts(): Promise<SearchAlert[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.SEARCH_ALERTS);
      if (!data) return [];
      
      return JSON.parse(data).map((alert: any) => ({
        ...alert,
        createdAt: new Date(alert.createdAt)
      }));
    } catch (error) {
      console.error('Failed to get search alerts:', error);
      return [];
    }
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      const alerts = await this.getSearchAlerts();
      const alertIndex = alerts.findIndex(a => a.id === alertId);
      
      if (alertIndex === -1) return;
      
      alerts[alertIndex].isRead = true;
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SEARCH_ALERTS,
        JSON.stringify(alerts)
      );
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  }

  async deleteAlert(alertId: string): Promise<void> {
    try {
      const alerts = await this.getSearchAlerts();
      const filteredAlerts = alerts.filter(a => a.id !== alertId);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SEARCH_ALERTS,
        JSON.stringify(filteredAlerts)
      );
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  }

  private async deleteAlertsForSearch(savedSearchId: string): Promise<void> {
    try {
      const alerts = await this.getSearchAlerts();
      const filteredAlerts = alerts.filter(a => a.savedSearchId !== savedSearchId);
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SEARCH_ALERTS,
        JSON.stringify(filteredAlerts)
      );
    } catch (error) {
      console.error('Failed to delete alerts for search:', error);
    }
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.NOTIFICATION_PREFERENCES);
      if (!data) return this.DEFAULT_PREFERENCES;
      
      return { ...this.DEFAULT_PREFERENCES, ...JSON.parse(data) };
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return this.DEFAULT_PREFERENCES;
    }
  }

  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const currentPreferences = await this.getNotificationPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.NOTIFICATION_PREFERENCES,
        JSON.stringify(updatedPreferences)
      );
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  async shareSavedSearch(searchId: string): Promise<string> {
    try {
      const searches = await this.getSavedSearches();
      const search = searches.find(s => s.id === searchId);
      
      if (!search) {
        throw new Error('Saved search not found');
      }

      // Create a shareable link or data structure
      const shareData = {
        name: search.name,
        filters: search.filters,
        island: search.filters.island,
        sharedAt: new Date().toISOString()
      };

      // In a real app, this would generate a shareable link
      const shareableData = encodeURIComponent(JSON.stringify(shareData));
      const shareUrl = `islandrides://search/shared?data=${shareableData}`;
      
      return shareUrl;
    } catch (error) {
      console.error('Failed to share saved search:', error);
      throw error;
    }
  }

  async importSharedSearch(shareUrl: string): Promise<SavedSearch> {
    try {
      const urlParams = new URLSearchParams(shareUrl.split('?')[1]);
      const encodedData = urlParams.get('data');
      
      if (!encodedData) {
        throw new Error('Invalid share URL');
      }

      const shareData = JSON.parse(decodeURIComponent(encodedData));
      
      const savedSearch = await this.saveSavedSearch({
        name: `${shareData.name} (Shared)`,
        filters: shareData.filters,
        isActive: true,
        notificationEnabled: false,
        notificationFrequency: 'daily',
        lastChecked: new Date(),
        lastNotified: null,
        matchCount: 0
      });

      return savedSearch;
    } catch (error) {
      console.error('Failed to import shared search:', error);
      throw error;
    }
  }

  async getSearchStatistics(): Promise<{
    totalSavedSearches: number;
    activeSavedSearches: number;
    totalAlerts: number;
    unreadAlerts: number;
    averageMatchCount: number;
    mostActiveSearch: SavedSearch | null;
  }> {
    try {
      const searches = await this.getSavedSearches();
      const alerts = await this.getSearchAlerts();
      
      const totalSavedSearches = searches.length;
      const activeSavedSearches = searches.filter(s => s.isActive).length;
      const totalAlerts = alerts.length;
      const unreadAlerts = alerts.filter(a => !a.isRead).length;
      const averageMatchCount = searches.length > 0 
        ? searches.reduce((sum, s) => sum + s.matchCount, 0) / searches.length
        : 0;
      
      const mostActiveSearch = searches.reduce((most, current) => {
        if (!most) return current;
        return current.matchCount > most.matchCount ? current : most;
      }, null as SavedSearch | null);

      return {
        totalSavedSearches,
        activeSavedSearches,
        totalAlerts,
        unreadAlerts,
        averageMatchCount,
        mostActiveSearch
      };
    } catch (error) {
      console.error('Failed to get search statistics:', error);
      return {
        totalSavedSearches: 0,
        activeSavedSearches: 0,
        totalAlerts: 0,
        unreadAlerts: 0,
        averageMatchCount: 0,
        mostActiveSearch: null
      };
    }
  }

  private convertFiltersToSearchParams(filters: SearchFilters): any {
    return {
      location: filters.island,
      vehicleType: filters.vehicleTypes.length > 0 ? filters.vehicleTypes.join(',') : undefined,
      fuelType: filters.fuelTypes.length > 0 ? filters.fuelTypes.join(',') : undefined,
      transmissionType: filters.transmissionTypes.length > 0 ? filters.transmissionTypes.join(',') : undefined,
      seatingCapacity: filters.minSeatingCapacity > 1 ? filters.minSeatingCapacity : undefined,
      minPrice: filters.priceRange[0],
      maxPrice: filters.priceRange[1],
      features: filters.features.length > 0 ? filters.features.join(',') : undefined,
      conditionRating: filters.minConditionRating > 1 ? filters.minConditionRating : undefined,
      verificationStatus: filters.verificationStatus.length > 0 ? filters.verificationStatus.join(',') : undefined,
      deliveryAvailable: filters.deliveryAvailable ? 'true' : undefined,
      airportPickup: filters.airportPickup ? 'true' : undefined,
      instantBooking: filters.instantBooking ? 'true' : undefined,
      sortBy: filters.sortBy,
      page: 1,
      limit: 50
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const searchNotificationService = new SearchNotificationService();