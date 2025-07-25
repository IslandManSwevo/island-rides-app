/**
 * Live Search Manager
 * Manages real-time search result updates with debounced filtering
 */

import { enhancedSearchService, SearchFilters, SearchOptions } from './enhancedSearchService';
import { vehicleAvailabilityManager } from './vehicleAvailabilityManager';
import { priceUpdateManager } from './priceUpdateManager';
import { loggingService } from './LoggingService';
import { analyticsService } from './analyticsService';
import { performanceMonitor } from './PerformanceMonitor';
import { VehicleRecommendation } from '../types';

export interface LiveSearchState {
  isSearching: boolean;
  lastSearchTime: number;
  searchCount: number;
  filters: SearchFilters;
  results: VehicleRecommendation[];
  totalCount: number;
  availableCount: number;
  hasError: boolean;
  errorMessage?: string;
}

export interface SearchPerformanceMetrics {
  averageSearchTime: number;
  searchesPerMinute: number;
  cacheHitRate: number;
  errorRate: number;
}

type SearchResultsCallback = (state: LiveSearchState) => void;
type SearchErrorCallback = (error: string) => void;

class LiveSearchManager {
  private searchCallbacks: Set<SearchResultsCallback> = new Set();
  private errorCallbacks: Set<SearchErrorCallback> = new Set();
  private debounceTimer: NodeJS.Timeout | null = null;
  private searchState: LiveSearchState = {
    isSearching: false,
    lastSearchTime: 0,
    searchCount: 0,
    filters: {},
    results: [],
    totalCount: 0,
    availableCount: 0,
    hasError: false,
  };
  
  private searchCache: Map<string, { results: VehicleRecommendation[]; timestamp: number }> = new Map();
  private performanceMetrics: SearchPerformanceMetrics = {
    averageSearchTime: 0,
    searchesPerMinute: 0,
    cacheHitRate: 0,
    errorRate: 0,
  };
  
  private readonly DEBOUNCE_DELAY = 300; // 300ms
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_CACHE_SIZE = 50;
  private searchTimes: number[] = [];
  private searchErrors = 0;
  private cacheHits = 0;
  private totalSearches = 0;

  constructor() {
    this.setupRealTimeListeners();
    this.startPerformanceTracking();
  }

  /**
   * Setup real-time listeners for automatic updates
   */
  private setupRealTimeListeners(): void {
    // Listen for availability updates
    vehicleAvailabilityManager.onVehicleListUpdate((vehicles) => {
      this.updateSearchResultsWithNewData(vehicles);
    });

    // Listen for price updates
    priceUpdateManager.onPriceUpdate((update) => {
      this.updateVehiclePrice(update.vehicleId, update.newPrice);
    });
  }

  /**
   * Perform live search with debouncing
   */
  performLiveSearch(
    filters: SearchFilters,
    options: SearchOptions = {},
    immediate: boolean = false
  ): void {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Update search state
    this.searchState.filters = filters;
    this.searchState.isSearching = true;
    this.notifySearchCallbacks();

    const delay = immediate ? 0 : this.DEBOUNCE_DELAY;

    this.debounceTimer = setTimeout(async () => {
      await this.executeSearch(filters, options);
    }, delay);
  }

  /**
   * Execute the actual search
   */
  private async executeSearch(filters: SearchFilters, options: SearchOptions): Promise<void> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(filters, options);

    try {
      // Check cache first
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.handleSearchSuccess(cached.results, cached.results.length, startTime, true);
        return;
      }

      // Perform search
      const searchResult = await enhancedSearchService.searchVehicles(filters, options);
      
      // Cache results
      this.cacheSearchResults(cacheKey, searchResult.vehicles);
      
      // Subscribe to real-time updates for these vehicles
      vehicleAvailabilityManager.subscribeToVehicles(searchResult.vehicles);
      priceUpdateManager.updateVehicleCache(searchResult.vehicles);

      this.handleSearchSuccess(
        searchResult.vehicles,
        searchResult.totalCount,
        startTime,
        false
      );

    } catch (error) {
      this.handleSearchError(error as Error, startTime);
    }
  }

  /**
   * Handle successful search
   */
  private handleSearchSuccess(
    results: VehicleRecommendation[],
    totalCount: number,
    startTime: number,
    fromCache: boolean
  ): void {
    const searchTime = Date.now() - startTime;
    
    // Update search state
    this.searchState = {
      ...this.searchState,
      isSearching: false,
      lastSearchTime: Date.now(),
      searchCount: this.searchState.searchCount + 1,
      results,
      totalCount,
      availableCount: results.filter(v => v.available !== false).length,
      hasError: false,
      errorMessage: undefined,
    };

    // Update performance metrics
    this.updatePerformanceMetrics(searchTime, false, fromCache);

    // Notify callbacks
    this.notifySearchCallbacks();

    // Track analytics
    analyticsService.trackEvent('live_search_completed', {
      resultCount: results.length,
      totalCount,
      searchTime,
      fromCache,
      filterCount: Object.keys(this.searchState.filters).length,
    });

    loggingService.info('Live search completed', {
      resultCount: results.length,
      totalCount,
      searchTime,
      fromCache,
    });
  }

  /**
   * Handle search error
   */
  private handleSearchError(error: Error, startTime: number): void {
    const searchTime = Date.now() - startTime;
    
    this.searchState = {
      ...this.searchState,
      isSearching: false,
      hasError: true,
      errorMessage: error.message,
    };

    // Update performance metrics
    this.updatePerformanceMetrics(searchTime, true, false);

    // Notify callbacks
    this.notifySearchCallbacks();
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error.message);
      } catch (callbackError) {
        loggingService.error('Error in search error callback', callbackError as Error);
      }
    });

    loggingService.error('Live search failed', error);
    performanceMonitor.recordMetric('live_search_error', 1);
  }

  /**
   * Update search results with new real-time data
   */
  private updateSearchResultsWithNewData(updatedVehicles: VehicleRecommendation[]): void {
    if (this.searchState.results.length === 0) return;

    let hasChanges = false;
    const updatedResults = this.searchState.results.map(vehicle => {
      const updated = updatedVehicles.find(v => v.id === vehicle.id);
      if (updated && (updated.available !== vehicle.available || updated.pricePerDay !== vehicle.pricePerDay)) {
        hasChanges = true;
        return updated;
      }
      return vehicle;
    });

    if (hasChanges) {
      this.searchState = {
        ...this.searchState,
        results: updatedResults,
        availableCount: updatedResults.filter(v => v.available !== false).length,
      };

      this.notifySearchCallbacks();

      analyticsService.trackEvent('search_results_updated_realtime', {
        vehicleCount: updatedResults.length,
        availableCount: this.searchState.availableCount,
      });
    }
  }

  /**
   * Update specific vehicle price in search results
   */
  private updateVehiclePrice(vehicleId: string, newPrice: number): void {
    const vehicleIndex = this.searchState.results.findIndex(v => v.id === vehicleId);
    
    if (vehicleIndex !== -1) {
      const updatedResults = [...this.searchState.results];
      updatedResults[vehicleIndex] = {
        ...updatedResults[vehicleIndex],
        pricePerDay: newPrice,
      };

      this.searchState = {
        ...this.searchState,
        results: updatedResults,
      };

      this.notifySearchCallbacks();
    }
  }

  /**
   * Generate cache key for search parameters
   */
  private generateCacheKey(filters: SearchFilters, options: SearchOptions): string {
    const filterStr = JSON.stringify(filters);
    const optionsStr = JSON.stringify(options);
    return `search_${btoa(filterStr + optionsStr)}`;
  }

  /**
   * Cache search results
   */
  private cacheSearchResults(key: string, results: VehicleRecommendation[]): void {
    // Clean old cache entries if at max size
    if (this.searchCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.searchCache.keys())[0];
      this.searchCache.delete(oldestKey);
    }

    this.searchCache.set(key, {
      results: [...results],
      timestamp: Date.now(),
    });
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(searchTime: number, isError: boolean, fromCache: boolean): void {
    this.totalSearches++;
    
    if (isError) {
      this.searchErrors++;
    } else {
      this.searchTimes.push(searchTime);
      if (this.searchTimes.length > 100) {
        this.searchTimes.shift(); // Keep only last 100 search times
      }
    }

    if (fromCache) {
      this.cacheHits++;
    }

    // Calculate metrics
    this.performanceMetrics = {
      averageSearchTime: this.searchTimes.length > 0 
        ? this.searchTimes.reduce((sum, time) => sum + time, 0) / this.searchTimes.length 
        : 0,
      searchesPerMinute: this.calculateSearchesPerMinute(),
      cacheHitRate: this.totalSearches > 0 ? (this.cacheHits / this.totalSearches) * 100 : 0,
      errorRate: this.totalSearches > 0 ? (this.searchErrors / this.totalSearches) * 100 : 0,
    };
  }

  /**
   * Calculate searches per minute
   */
  private calculateSearchesPerMinute(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const recentSearches = this.searchTimes.filter(time => time > oneMinuteAgo);
    return recentSearches.length;
  }

  /**
   * Start performance tracking
   */
  private startPerformanceTracking(): void {
    setInterval(() => {
      performanceMonitor.recordMetric('live_search_average_time', this.performanceMetrics.averageSearchTime);
      performanceMonitor.recordMetric('live_search_cache_hit_rate', this.performanceMetrics.cacheHitRate);
      performanceMonitor.recordMetric('live_search_error_rate', this.performanceMetrics.errorRate);
    }, 60000); // Every minute
  }

  /**
   * Notify search result callbacks
   */
  private notifySearchCallbacks(): void {
    this.searchCallbacks.forEach(callback => {
      try {
        callback({ ...this.searchState });
      } catch (error) {
        loggingService.error('Error in search callback', error as Error);
      }
    });
  }

  /**
   * Subscribe to search results updates
   */
  onSearchResults(callback: SearchResultsCallback): () => void {
    this.searchCallbacks.add(callback);
    
    return () => {
      this.searchCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to search errors
   */
  onSearchError(callback: SearchErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * Get current search state
   */
  getCurrentState(): LiveSearchState {
    return { ...this.searchState };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): SearchPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    this.cacheHits = 0;
    
    analyticsService.trackEvent('search_cache_cleared', {
      previousCacheSize: this.searchCache.size,
    });
  }

  /**
   * Cancel current search
   */
  cancelCurrentSearch(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.searchState.isSearching) {
      this.searchState.isSearching = false;
      this.notifySearchCallbacks();
    }
  }

  /**
   * Clear all data and subscriptions
   */
  clearAll(): void {
    this.cancelCurrentSearch();
    this.searchCallbacks.clear();
    this.errorCallbacks.clear();
    this.searchCache.clear();
    
    this.searchState = {
      isSearching: false,
      lastSearchTime: 0,
      searchCount: 0,
      filters: {},
      results: [],
      totalCount: 0,
      availableCount: 0,
      hasError: false,
    };

    loggingService.info('Live search manager cleared');
  }
}

export const liveSearchManager = new LiveSearchManager();
