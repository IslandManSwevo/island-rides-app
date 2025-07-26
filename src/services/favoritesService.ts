/**
 * Favorites Service
 * Manages user favorites with backend synchronization and offline support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';
import { loggingService } from './LoggingService';
import { analyticsService } from './analyticsService';
import { VehicleRecommendation } from '../types';

export interface FavoriteVehicle {
  id: string;
  vehicleId: string;
  userId: string;
  vehicle?: VehicleRecommendation;
  addedAt: string;
  notes?: string;
  tags?: string[];
  lastViewed?: string;
}

export interface FavoritesStats {
  totalCount: number;
  recentlyAdded: number;
  mostViewedCategory: string;
  averagePriceRange: [number, number];
}

class FavoritesService {
  private favorites: Map<string, FavoriteVehicle> = new Map();
  private syncQueue: string[] = [];
  private isOnline: boolean = true;
  private lastSyncTime: number = 0;

  constructor() {
    this.loadLocalFavorites();
    this.setupNetworkListener();
  }

  /**
   * Add vehicle to favorites
   */
  async addToFavorites(
    vehicleId: string, 
    userId: string, 
    vehicle?: VehicleRecommendation,
    notes?: string,
    tags?: string[]
  ): Promise<void> {
    const favoriteId = `${userId}_${vehicleId}`;
    
    const favorite: FavoriteVehicle = {
      id: favoriteId,
      vehicleId,
      userId,
      vehicle,
      addedAt: new Date().toISOString(),
      notes,
      tags,
    };

    // Add to local storage immediately
    this.favorites.set(favoriteId, favorite);
    await this.saveLocalFavorites();

    // Track analytics
    analyticsService.trackVehicleInteraction(vehicleId, 'favorite', {
      hasNotes: !!notes,
      tagCount: tags?.length || 0,
    }, userId);

    // Sync with backend
    if (this.isOnline) {
      try {
        await this.syncFavoriteToBackend(favorite);
      } catch (error) {
        loggingService.warn('Failed to sync favorite to backend, queuing for later', error as Error);
        this.queueForSync(favoriteId);
      }
    } else {
      this.queueForSync(favoriteId);
    }

    loggingService.info('Vehicle added to favorites', { vehicleId, userId });
  }

  /**
   * Remove vehicle from favorites
   */
  async removeFromFavorites(vehicleId: string, userId: string): Promise<void> {
    const favoriteId = `${userId}_${vehicleId}`;
    
    // Remove from local storage
    this.favorites.delete(favoriteId);
    await this.saveLocalFavorites();

    // Track analytics
    analyticsService.trackVehicleInteraction(vehicleId, 'unfavorite', {}, userId);

    // Sync with backend
    if (this.isOnline) {
      try {
        await apiService.delete(`/users/${userId}/favorites/${vehicleId}`);
      } catch (error) {
        loggingService.warn('Failed to remove favorite from backend', error as Error);
      }
    }

    loggingService.info('Vehicle removed from favorites', { vehicleId, userId });
  }

  /**
   * Check if vehicle is favorited
   */
  isFavorite(vehicleId: string, userId: string): boolean {
    const favoriteId = `${userId}_${vehicleId}`;
    return this.favorites.has(favoriteId);
  }

  /**
   * Get all favorites for user
   */
  getUserFavorites(userId: string): FavoriteVehicle[] {
    return Array.from(this.favorites.values())
      .filter(fav => fav.userId === userId)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }

  /**
   * Get favorites with full vehicle data
   */
  async getFavoritesWithVehicleData(userId: string): Promise<FavoriteVehicle[]> {
    const userFavorites = this.getUserFavorites(userId);
    
    // Get vehicle data for favorites that don't have it
    const favoritesNeedingData = userFavorites.filter(fav => !fav.vehicle);
    
    if (favoritesNeedingData.length > 0) {
      try {
        const vehicleIds = favoritesNeedingData.map(fav => fav.vehicleId);
        const response = await apiService.post('/vehicles/batch', {
          vehicleIds
        }) as { data: { vehicles: VehicleRecommendation[] } };

        const vehicles = response.data?.vehicles || [];
        
        // Update favorites with vehicle data
        favoritesNeedingData.forEach(favorite => {
          const vehicle = vehicles.find(v => v.id === favorite.vehicleId);
          if (vehicle) {
            favorite.vehicle = vehicle;
            this.favorites.set(favorite.id, favorite);
          }
        });

        await this.saveLocalFavorites();
      } catch (error) {
        loggingService.warn('Failed to fetch vehicle data for favorites', error as Error);
      }
    }

    return this.getUserFavorites(userId);
  }

  /**
   * Update favorite notes or tags
   */
  async updateFavorite(
    vehicleId: string, 
    userId: string, 
    updates: { notes?: string; tags?: string[] }
  ): Promise<void> {
    const favoriteId = `${userId}_${vehicleId}`;
    const favorite = this.favorites.get(favoriteId);
    
    if (!favorite) {
      throw new Error('Favorite not found');
    }

    const updatedFavorite = {
      ...favorite,
      ...updates,
      lastViewed: new Date().toISOString(),
    };

    this.favorites.set(favoriteId, updatedFavorite);
    await this.saveLocalFavorites();

    // Sync with backend
    if (this.isOnline) {
      try {
        await apiService.patch(`/users/${userId}/favorites/${vehicleId}`, updates);
      } catch (error) {
        loggingService.warn('Failed to update favorite on backend', error as Error);
        this.queueForSync(favoriteId);
      }
    } else {
      this.queueForSync(favoriteId);
    }
  }

  /**
   * Get favorites statistics
   */
  getFavoritesStats(userId: string): FavoritesStats {
    const userFavorites = this.getUserFavorites(userId);
    const recentThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    const recentlyAdded = userFavorites.filter(
      fav => new Date(fav.addedAt).getTime() > recentThreshold
    ).length;

    // Calculate most viewed category
    const categories = userFavorites
      .map(fav => fav.vehicle?.type)
      .filter(Boolean) as string[];
    
    const categoryCount = categories.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostViewedCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    // Calculate average price range
    const prices = userFavorites
      .map(fav => fav.vehicle?.pricePerDay)
      .filter(Boolean) as number[];
    
    const averagePriceRange: [number, number] = prices.length > 0 
      ? [Math.min(...prices), Math.max(...prices)]
      : [0, 0];

    return {
      totalCount: userFavorites.length,
      recentlyAdded,
      mostViewedCategory,
      averagePriceRange,
    };
  }

  /**
   * Sync all favorites with backend
   */
  async syncWithBackend(userId: string): Promise<void> {
    if (!this.isOnline) {
      loggingService.info('Offline, skipping favorites sync');
      return;
    }

    try {
      // Get backend favorites
      const response = await apiService.get(`/users/${userId}/favorites`) as { 
        data: { favorites: FavoriteVehicle[] } 
      };
      
      const backendFavorites = response.data?.favorites || [];
      
      // Merge with local favorites
      const mergedFavorites = this.mergeFavorites(
        this.getUserFavorites(userId),
        backendFavorites
      );

      // Update local storage
      mergedFavorites.forEach(favorite => {
        this.favorites.set(favorite.id, favorite);
      });
      
      await this.saveLocalFavorites();

      // Process sync queue
      await this.processSyncQueue();

      this.lastSyncTime = Date.now();
      loggingService.info('Favorites synced successfully', { 
        userId, 
        localCount: this.getUserFavorites(userId).length,
        backendCount: backendFavorites.length 
      });

    } catch (error) {
      loggingService.error('Failed to sync favorites with backend', error as Error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async loadLocalFavorites(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('user_favorites');
      if (stored) {
        const favorites: FavoriteVehicle[] = JSON.parse(stored);
        favorites.forEach(favorite => {
          this.favorites.set(favorite.id, favorite);
        });
      }
    } catch (error) {
      loggingService.warn('Failed to load local favorites', error as Error);
    }
  }

  private async saveLocalFavorites(): Promise<void> {
    try {
      const favorites = Array.from(this.favorites.values());
      await AsyncStorage.setItem('user_favorites', JSON.stringify(favorites));
    } catch (error) {
      loggingService.warn('Failed to save local favorites', error as Error);
    }
  }

  private async syncFavoriteToBackend(favorite: FavoriteVehicle): Promise<void> {
    await apiService.post(`/users/${favorite.userId}/favorites`, {
      vehicleId: favorite.vehicleId,
      notes: favorite.notes,
      tags: favorite.tags,
    });
  }

  private queueForSync(favoriteId: string): void {
    if (!this.syncQueue.includes(favoriteId)) {
      this.syncQueue.push(favoriteId);
    }
  }

  private async processSyncQueue(): Promise<void> {
    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const favoriteId of queue) {
      const favorite = this.favorites.get(favoriteId);
      if (favorite) {
        try {
          await this.syncFavoriteToBackend(favorite);
        } catch (error) {
          loggingService.warn('Failed to sync queued favorite', error as Error);
          this.queueForSync(favoriteId); // Re-queue for next sync
        }
      }
    }
  }

  private mergeFavorites(
    localFavorites: FavoriteVehicle[], 
    backendFavorites: FavoriteVehicle[]
  ): FavoriteVehicle[] {
    const merged = new Map<string, FavoriteVehicle>();

    // Add backend favorites first
    backendFavorites.forEach(favorite => {
      merged.set(favorite.id, favorite);
    });

    // Merge local favorites (local takes precedence for conflicts)
    localFavorites.forEach(favorite => {
      const existing = merged.get(favorite.id);
      if (!existing || new Date(favorite.addedAt) > new Date(existing.addedAt)) {
        merged.set(favorite.id, favorite);
      }
    });

    return Array.from(merged.values());
  }

  private setupNetworkListener(): void {
    // In a real app, you would listen to network state changes
    // For now, we'll assume online status
    this.isOnline = true;
  }

  /**
   * Clear all favorites (for testing/reset)
   */
  async clearAllFavorites(userId: string): Promise<void> {
    const userFavorites = this.getUserFavorites(userId);
    
    userFavorites.forEach(favorite => {
      this.favorites.delete(favorite.id);
    });

    await this.saveLocalFavorites();

    if (this.isOnline) {
      try {
        await apiService.delete(`/users/${userId}/favorites`);
      } catch (error) {
        loggingService.warn('Failed to clear favorites on backend', error as Error);
      }
    }

    loggingService.info('All favorites cleared', { userId });
  }
}

export const favoritesService = new FavoritesService();
