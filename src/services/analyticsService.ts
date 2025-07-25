/**
 * Analytics Service
 * Provides analytics-driven insights for popular destinations, trending searches, and user behavior
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './apiService';
import { loggingService } from './LoggingService';
import { performanceMonitor } from './PerformanceMonitor';

export interface PopularDestination {
  id: string;
  name: string;
  description: string;
  image?: string;
  vehicleCount: number;
  averagePrice: number;
  rating: number;
  trending?: boolean;
  searchVolume: number;
  bookingVolume: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metadata?: {
    category: string;
    tags: string[];
    seasonality?: 'high' | 'medium' | 'low';
  };
}

export interface TrendingSearch {
  query: string;
  count: number;
  growth: number; // percentage growth
  category: string;
  timeframe: '1h' | '24h' | '7d' | '30d';
}

export interface UserBehaviorInsight {
  userId?: string;
  searchPatterns: {
    preferredVehicleTypes: string[];
    averagePriceRange: [number, number];
    preferredIslands: string[];
    searchFrequency: number;
  };
  bookingPatterns: {
    averageBookingValue: number;
    preferredBookingDuration: number;
    seasonalPreferences: string[];
  };
  recommendations: {
    suggestedDestinations: string[];
    suggestedVehicleTypes: string[];
    priceOptimizations: string[];
  };
}

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

class AnalyticsService {
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly MAX_QUEUE_SIZE = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startEventFlushing();
  }

  /**
   * Get popular destinations based on analytics data
   */
  async getPopularDestinations(limit: number = 10): Promise<PopularDestination[]> {
    const startTime = Date.now();
    
    try {
      // Try to get from backend first
      const response = await apiService.get('/analytics/popular-destinations', {
        params: { limit, timeframe: '7d' }
      });

      if (response.data?.destinations) {
        performanceMonitor.recordMetric('analytics_popular_destinations_api_success', 1);
        return response.data.destinations;
      }
    } catch (error) {
      loggingService.warn('Failed to fetch popular destinations from API, using fallback', error as Error);
    }

    // Fallback to cached data or mock data
    const cached = await this.getCachedPopularDestinations();
    if (cached.length > 0) {
      return cached.slice(0, limit);
    }

    // Generate mock data based on analytics patterns
    const mockDestinations = await this.generateMockPopularDestinations();
    
    performanceMonitor.recordMetric('analytics_popular_destinations_duration', Date.now() - startTime);
    return mockDestinations.slice(0, limit);
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<TrendingSearch[]> {
    try {
      const response = await apiService.get('/analytics/trending-searches', {
        params: { timeframe }
      });

      if (response.data?.searches) {
        return response.data.searches;
      }
    } catch (error) {
      loggingService.warn('Failed to fetch trending searches from API', error as Error);
    }

    // Fallback to mock data
    return this.generateMockTrendingSearches(timeframe);
  }

  /**
   * Get user behavior insights
   */
  async getUserBehaviorInsights(userId?: string): Promise<UserBehaviorInsight | null> {
    try {
      const endpoint = userId ? `/analytics/user-insights/${userId}` : '/analytics/user-insights';
      const response = await apiService.get(endpoint);

      if (response.data?.insights) {
        return response.data.insights;
      }
    } catch (error) {
      loggingService.warn('Failed to fetch user insights from API', error as Error);
    }

    // Generate insights from local data
    return this.generateLocalUserInsights();
  }

  /**
   * Track analytics event
   */
  trackEvent(event: string, properties: Record<string, any> = {}, userId?: string): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        platform: 'mobile',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      userId,
      sessionId: this.sessionId,
    };

    this.eventQueue.push(analyticsEvent);

    // Flush immediately if queue is full
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushEvents();
    }

    loggingService.debug('Analytics event tracked', { event, properties });
  }

  /**
   * Track search event
   */
  trackSearch(query: string, filters: Record<string, any>, resultCount: number, userId?: string): void {
    this.trackEvent('search_performed', {
      query,
      filters,
      resultCount,
      hasResults: resultCount > 0,
    }, userId);
  }

  /**
   * Track destination selection
   */
  trackDestinationSelection(destinationId: string, destinationName: string, source: string, userId?: string): void {
    this.trackEvent('destination_selected', {
      destinationId,
      destinationName,
      source, // 'popular', 'search', 'recent'
    }, userId);
  }

  /**
   * Track vehicle interaction
   */
  trackVehicleInteraction(vehicleId: string, action: string, properties: Record<string, any> = {}, userId?: string): void {
    this.trackEvent('vehicle_interaction', {
      vehicleId,
      action, // 'view', 'favorite', 'book', 'share'
      ...properties,
    }, userId);
  }

  /**
   * Private methods
   */
  private async getCachedPopularDestinations(): Promise<PopularDestination[]> {
    try {
      const cached = await AsyncStorage.getItem('cached_popular_destinations');
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data.destinations;
        }
      }
    } catch (error) {
      loggingService.warn('Failed to load cached popular destinations', error as Error);
    }
    return [];
  }

  private async generateMockPopularDestinations(): Promise<PopularDestination[]> {
    const mockDestinations: PopularDestination[] = [
      {
        id: 'nassau-analytics',
        name: 'Nassau',
        description: 'Capital city with rich history and beautiful beaches',
        vehicleCount: 156,
        averagePrice: 45,
        rating: 4.8,
        trending: true,
        searchVolume: 1250,
        bookingVolume: 89,
        coordinates: { latitude: 25.0343, longitude: -77.3963 },
        metadata: {
          category: 'city',
          tags: ['beaches', 'culture', 'nightlife', 'shopping'],
          seasonality: 'high',
        },
      },
      {
        id: 'paradise-island-analytics',
        name: 'Paradise Island',
        description: 'Luxury resorts and pristine beaches',
        vehicleCount: 92,
        averagePrice: 65,
        rating: 4.9,
        trending: true,
        searchVolume: 980,
        bookingVolume: 76,
        coordinates: { latitude: 25.0845, longitude: -77.3210 },
        metadata: {
          category: 'resort',
          tags: ['luxury', 'beaches', 'resorts', 'casino'],
          seasonality: 'high',
        },
      },
      {
        id: 'exuma-analytics',
        name: 'Exuma',
        description: 'Swimming pigs and crystal clear waters',
        vehicleCount: 48,
        averagePrice: 55,
        rating: 4.7,
        trending: false,
        searchVolume: 720,
        bookingVolume: 45,
        coordinates: { latitude: 23.6145, longitude: -75.7382 },
        metadata: {
          category: 'nature',
          tags: ['wildlife', 'beaches', 'adventure', 'unique'],
          seasonality: 'medium',
        },
      },
      {
        id: 'freeport-analytics',
        name: 'Freeport',
        description: 'Duty-free shopping and beautiful beaches',
        vehicleCount: 78,
        averagePrice: 40,
        rating: 4.6,
        trending: false,
        searchVolume: 650,
        bookingVolume: 52,
        coordinates: { latitude: 26.5312, longitude: -78.6956 },
        metadata: {
          category: 'city',
          tags: ['shopping', 'beaches', 'duty-free', 'family'],
          seasonality: 'medium',
        },
      },
    ];

    // Cache the mock data
    try {
      await AsyncStorage.setItem('cached_popular_destinations', JSON.stringify({
        destinations: mockDestinations,
        timestamp: Date.now(),
      }));
    } catch (error) {
      loggingService.warn('Failed to cache popular destinations', error as Error);
    }

    return mockDestinations;
  }

  private generateMockTrendingSearches(timeframe: string): TrendingSearch[] {
    const baseSearches = [
      { query: 'luxury car nassau', category: 'luxury', baseCount: 45 },
      { query: 'scooter paradise island', category: 'scooter', baseCount: 38 },
      { query: 'suv family rental', category: 'family', baseCount: 52 },
      { query: 'convertible beach', category: 'leisure', baseCount: 29 },
      { query: 'motorcycle adventure', category: 'adventure', baseCount: 22 },
    ];

    const multiplier = timeframe === '1h' ? 0.1 : timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;

    return baseSearches.map(search => ({
      ...search,
      count: Math.floor(search.baseCount * multiplier),
      growth: Math.random() * 50 - 10, // -10% to +40% growth
      timeframe,
    }));
  }

  private async generateLocalUserInsights(): Promise<UserBehaviorInsight> {
    // Analyze local search history and generate insights
    try {
      const searchHistory = await AsyncStorage.getItem('recentSearches');
      const searches = searchHistory ? JSON.parse(searchHistory) : [];

      const vehicleTypes = searches.flatMap((s: any) => s.vehicleTypes || []);
      const islands = searches.map((s: any) => s.island).filter(Boolean);

      return {
        searchPatterns: {
          preferredVehicleTypes: [...new Set(vehicleTypes)],
          averagePriceRange: [40, 80],
          preferredIslands: [...new Set(islands)],
          searchFrequency: searches.length,
        },
        bookingPatterns: {
          averageBookingValue: 150,
          preferredBookingDuration: 3,
          seasonalPreferences: ['winter', 'spring'],
        },
        recommendations: {
          suggestedDestinations: ['Nassau', 'Paradise Island'],
          suggestedVehicleTypes: ['car', 'scooter'],
          priceOptimizations: ['Book 7 days in advance for 15% savings'],
        },
      };
    } catch (error) {
      loggingService.warn('Failed to generate local user insights', error as Error);
      return {
        searchPatterns: {
          preferredVehicleTypes: [],
          averagePriceRange: [40, 80],
          preferredIslands: [],
          searchFrequency: 0,
        },
        bookingPatterns: {
          averageBookingValue: 0,
          preferredBookingDuration: 1,
          seasonalPreferences: [],
        },
        recommendations: {
          suggestedDestinations: [],
          suggestedVehicleTypes: [],
          priceOptimizations: [],
        },
      };
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startEventFlushing(): void {
    this.flushInterval = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.FLUSH_INTERVAL);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await apiService.post('/analytics/events', {
        events: eventsToFlush,
      });

      loggingService.debug('Analytics events flushed successfully', { count: eventsToFlush.length });
    } catch (error) {
      loggingService.warn('Failed to flush analytics events', error as Error);
      
      // Re-queue events for retry (keep only recent ones)
      this.eventQueue = [...eventsToFlush.slice(-10), ...this.eventQueue];
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining events
    if (this.eventQueue.length > 0) {
      this.flushEvents();
    }
  }
}

export const analyticsService = new AnalyticsService();
