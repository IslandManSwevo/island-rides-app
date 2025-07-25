/**
 * Enhanced Search Service
 * Provides real-time vehicle search with advanced filtering, sorting, and availability checking
 */

import { apiService } from './apiService';
import { loggingService } from './LoggingService';
import { performanceMonitor } from './PerformanceMonitor';
import { analyticsService } from './analyticsService';
import { sanitizeUserInput, SANITIZATION_PRESETS } from '../middleware/inputSanitization';
import { VehicleRecommendation, Island } from '../types';

export interface SearchFilters {
  island?: Island;
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // in km
  };
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  priceRange?: [number, number];
  vehicleTypes?: string[];
  features?: string[];
  hostRating?: number;
  instantBooking?: boolean;
  deliveryAvailable?: boolean;
  seatingCapacity?: number;
  transmission?: string[];
  fuelType?: string[];
}

export interface SearchOptions {
  sortBy?: 'price_low' | 'price_high' | 'distance' | 'rating' | 'availability' | 'newest';
  limit?: number;
  offset?: number;
  includeUnavailable?: boolean;
  realTimeAvailability?: boolean;
}

export interface SearchResult {
  vehicles: VehicleRecommendation[];
  totalCount: number;
  availableCount: number;
  filters: SearchFilters;
  searchId: string;
  timestamp: string;
  processingTime: number;
}

export interface AvailabilityStatus {
  vehicleId: string;
  available: boolean;
  nextAvailableDate?: string;
  priceChanges?: {
    currentPrice: number;
    originalPrice: number;
    discount?: number;
  };
  lastUpdated: string;
}

class EnhancedSearchService {
  private activeSearches: Map<string, AbortController> = new Map();
  private availabilityCache: Map<string, { status: AvailabilityStatus; timestamp: number }> = new Map();
  private readonly AVAILABILITY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Perform enhanced vehicle search with real-time data
   */
  async searchVehicles(
    filters: SearchFilters,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();

    try {
      // Cancel any existing search
      this.cancelSearch(searchId);

      // Create abort controller for this search
      const abortController = new AbortController();
      this.activeSearches.set(searchId, abortController);

      // Sanitize and prepare search parameters
      const sanitizedFilters = this.sanitizeFilters(filters);
      const searchParams = this.buildSearchParams(sanitizedFilters, options);

      loggingService.info('Starting enhanced vehicle search', { 
        searchId, 
        filters: sanitizedFilters, 
        options 
      });

      // Perform the search
      const response = await apiService.post('/vehicles/search/enhanced', {
        filters: sanitizedFilters,
        options,
        searchId,
      }, {
        signal: abortController.signal,
      }) as { data: any };

      // Process results
      const vehicles = response.data?.vehicles || [];
      const totalCount = response.data?.totalCount || 0;

      // Get real-time availability if requested
      let availableCount = totalCount;
      if (options.realTimeAvailability && vehicles.length > 0) {
        const availabilityResults = await this.checkRealTimeAvailability(
          vehicles.map((v: VehicleRecommendation) => v.id),
          sanitizedFilters.dateRange
        );
        
        // Update vehicles with real-time availability
        vehicles.forEach((vehicle: VehicleRecommendation) => {
          const availability = availabilityResults.find(a => a.vehicleId === vehicle.id);
          if (availability) {
            vehicle.available = availability.available;
            vehicle.nextAvailableDate = availability.nextAvailableDate;
            if (availability.priceChanges) {
              vehicle.pricePerDay = availability.priceChanges.currentPrice;
              vehicle.originalPrice = availability.priceChanges.originalPrice;
              vehicle.discount = availability.priceChanges.discount;
            }
          }
        });

        availableCount = vehicles.filter((v: VehicleRecommendation) => v.available).length;
      }

      const result: SearchResult = {
        vehicles,
        totalCount,
        availableCount,
        filters: sanitizedFilters,
        searchId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      };

      // Track analytics
      analyticsService.trackSearch(
        filters.location ? 'location-based' : 'island-based',
        sanitizedFilters,
        totalCount
      );

      performanceMonitor.recordMetric('enhanced_search_duration', result.processingTime);
      loggingService.info('Enhanced search completed', { 
        searchId, 
        totalCount, 
        availableCount, 
        processingTime: result.processingTime 
      });

      // Cleanup
      this.activeSearches.delete(searchId);

      return result;

    } catch (error) {
      this.activeSearches.delete(searchId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        loggingService.info('Search cancelled', { searchId });
        throw new Error('Search cancelled');
      }

      loggingService.error('Enhanced search failed', error as Error, { searchId, filters });
      performanceMonitor.recordMetric('enhanced_search_error', 1);
      
      // Fallback to basic search
      return this.fallbackSearch(filters, options);
    }
  }

  /**
   * Check real-time availability for vehicles
   */
  async checkRealTimeAvailability(
    vehicleIds: string[],
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<AvailabilityStatus[]> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cachedResults: AvailabilityStatus[] = [];
      const uncachedIds: string[] = [];

      vehicleIds.forEach(id => {
        const cached = this.availabilityCache.get(id);
        if (cached && Date.now() - cached.timestamp < this.AVAILABILITY_CACHE_TTL) {
          cachedResults.push(cached.status);
        } else {
          uncachedIds.push(id);
        }
      });

      // Fetch uncached availability
      let freshResults: AvailabilityStatus[] = [];
      if (uncachedIds.length > 0) {
        const response = await apiService.post('/vehicles/availability/check', {
          vehicleIds: uncachedIds,
          dateRange,
        }) as { data: { availability: AvailabilityStatus[] } };

        freshResults = response.data?.availability || [];

        // Cache the results
        freshResults.forEach(status => {
          this.availabilityCache.set(status.vehicleId, {
            status,
            timestamp: Date.now(),
          });
        });
      }

      const allResults = [...cachedResults, ...freshResults];
      
      performanceMonitor.recordMetric('availability_check_duration', Date.now() - startTime);
      loggingService.debug('Availability check completed', { 
        totalVehicles: vehicleIds.length,
        cachedCount: cachedResults.length,
        freshCount: freshResults.length,
      });

      return allResults;

    } catch (error) {
      loggingService.warn('Availability check failed', error as Error);
      
      // Return default availability status
      return vehicleIds.map(id => ({
        vehicleId: id,
        available: true,
        lastUpdated: new Date().toISOString(),
      }));
    }
  }

  /**
   * Get saved searches for user
   */
  async getSavedSearches(userId: string): Promise<SearchFilters[]> {
    try {
      const response = await apiService.get(`/users/${userId}/saved-searches`) as { data: any };
      return response.data?.searches || [];
    } catch (error) {
      loggingService.warn('Failed to get saved searches', error as Error);
      return [];
    }
  }

  /**
   * Save search for user
   */
  async saveSearch(userId: string, filters: SearchFilters, name?: string): Promise<void> {
    try {
      await apiService.post(`/users/${userId}/saved-searches`, {
        filters: this.sanitizeFilters(filters),
        name: name || this.generateSearchName(filters),
      });

      analyticsService.trackEvent('search_saved', {
        userId,
        hasLocation: !!filters.location,
        hasDateRange: !!filters.dateRange,
        filterCount: Object.keys(filters).length,
      });
    } catch (error) {
      loggingService.warn('Failed to save search', error as Error);
      throw error;
    }
  }

  /**
   * Cancel active search
   */
  cancelSearch(searchId?: string): void {
    if (searchId) {
      const controller = this.activeSearches.get(searchId);
      if (controller) {
        controller.abort();
        this.activeSearches.delete(searchId);
      }
    } else {
      // Cancel all active searches
      this.activeSearches.forEach(controller => controller.abort());
      this.activeSearches.clear();
    }
  }

  /**
   * Private helper methods
   */
  private sanitizeFilters(filters: SearchFilters): SearchFilters {
    const sanitized: SearchFilters = {};

    if (filters.island) {
      sanitized.island = filters.island;
    }

    if (filters.location) {
      sanitized.location = {
        latitude: Number(filters.location.latitude),
        longitude: Number(filters.location.longitude),
        radius: filters.location.radius ? Number(filters.location.radius) : undefined,
      };
    }

    if (filters.dateRange) {
      sanitized.dateRange = {
        startDate: new Date(filters.dateRange.startDate),
        endDate: new Date(filters.dateRange.endDate),
      };
    }

    if (filters.priceRange) {
      sanitized.priceRange = [
        Math.max(0, Number(filters.priceRange[0])),
        Math.min(10000, Number(filters.priceRange[1])),
      ];
    }

    if (filters.vehicleTypes) {
      sanitized.vehicleTypes = filters.vehicleTypes
        .map(type => sanitizeUserInput(type, SANITIZATION_PRESETS.userInput).sanitized)
        .filter(Boolean);
    }

    if (filters.features) {
      sanitized.features = filters.features
        .map(feature => sanitizeUserInput(feature, SANITIZATION_PRESETS.userInput).sanitized)
        .filter(Boolean);
    }

    if (filters.hostRating) {
      sanitized.hostRating = Math.max(0, Math.min(5, Number(filters.hostRating)));
    }

    if (typeof filters.instantBooking === 'boolean') {
      sanitized.instantBooking = filters.instantBooking;
    }

    if (typeof filters.deliveryAvailable === 'boolean') {
      sanitized.deliveryAvailable = filters.deliveryAvailable;
    }

    return sanitized;
  }

  private buildSearchParams(filters: SearchFilters, options: SearchOptions): Record<string, any> {
    return {
      ...filters,
      ...options,
      timestamp: Date.now(),
    };
  }

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSearchName(filters: SearchFilters): string {
    const parts: string[] = [];
    
    if (filters.island) {
      parts.push(filters.island);
    }
    
    if (filters.vehicleTypes && filters.vehicleTypes.length > 0) {
      parts.push(filters.vehicleTypes.join(', '));
    }
    
    if (filters.priceRange) {
      parts.push(`$${filters.priceRange[0]}-${filters.priceRange[1]}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Custom Search';
  }

  private async fallbackSearch(filters: SearchFilters, options: SearchOptions): Promise<SearchResult> {
    // Fallback to basic vehicle service
    try {
      const vehicles = await apiService.get('/vehicles', {
        params: this.buildSearchParams(filters, options)
      }) as { data: VehicleRecommendation[] };

      return {
        vehicles: vehicles.data || [],
        totalCount: vehicles.data?.length || 0,
        availableCount: vehicles.data?.length || 0,
        filters,
        searchId: this.generateSearchId(),
        timestamp: new Date().toISOString(),
        processingTime: 0,
      };
    } catch (error) {
      loggingService.error('Fallback search failed', error as Error);
      
      return {
        vehicles: [],
        totalCount: 0,
        availableCount: 0,
        filters,
        searchId: this.generateSearchId(),
        timestamp: new Date().toISOString(),
        processingTime: 0,
      };
    }
  }

  /**
   * Clear availability cache
   */
  clearAvailabilityCache(): void {
    this.availabilityCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.availabilityCache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
    };
  }
}

export const enhancedSearchService = new EnhancedSearchService();
