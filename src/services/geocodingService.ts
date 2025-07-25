/**
 * Geocoding Service
 * Provides location search, autocomplete, and geocoding functionality
 * Integrates with Google Places API and Mapbox Geocoding API
 */

import { getEnvironmentConfig } from '../config/environment';
import { sanitizeUserInput, SANITIZATION_PRESETS } from '../middleware/inputSanitization';
import { performanceMonitor } from './PerformanceMonitor';
import { loggingService } from './LoggingService';

export interface GeocodingResult {
  id: string;
  name: string;
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'address' | 'poi' | 'locality' | 'region' | 'country';
  relevance: number;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface AutocompleteResult {
  id: string;
  name: string;
  description: string;
  type: 'current' | 'popular' | 'recent' | 'search';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface GeocodingServiceConfig {
  provider: 'google' | 'mapbox' | 'mock';
  apiKey?: string;
  debounceMs: number;
  maxResults: number;
  biasLocation?: {
    latitude: number;
    longitude: number;
  };
  countryCode?: string;
}

class GeocodingService {
  private config: GeocodingServiceConfig;
  private cache: Map<string, { results: GeocodingResult[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const env = getEnvironmentConfig();
    this.config = {
      provider: env.GEOCODING_PROVIDER || 'mock',
      apiKey: env.GOOGLE_PLACES_API_KEY || env.MAPBOX_API_KEY,
      debounceMs: 300,
      maxResults: 10,
      biasLocation: {
        latitude: 25.0343, // Nassau, Bahamas
        longitude: -77.3963,
      },
      countryCode: 'BS', // Bahamas
    };
  }

  /**
   * Search for locations with autocomplete
   */
  async searchLocations(query: string): Promise<GeocodingResult[]> {
    const startTime = Date.now();
    
    try {
      // Sanitize input
      const sanitizedQuery = sanitizeUserInput(query, SANITIZATION_PRESETS.searchQuery).sanitized;
      
      if (!sanitizedQuery || sanitizedQuery.length < 2) {
        return [];
      }

      // Check cache first
      const cacheKey = `search_${sanitizedQuery.toLowerCase()}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        loggingService.info('Geocoding cache hit', { query: sanitizedQuery });
        return cached.results;
      }

      let results: GeocodingResult[] = [];

      switch (this.config.provider) {
        case 'google':
          results = await this.searchWithGoogle(sanitizedQuery);
          break;
        case 'mapbox':
          results = await this.searchWithMapbox(sanitizedQuery);
          break;
        default:
          results = await this.searchWithMock(sanitizedQuery);
      }

      // Cache results
      this.cache.set(cacheKey, {
        results,
        timestamp: Date.now(),
      });

      // Clean old cache entries
      this.cleanCache();

      performanceMonitor.recordMetric('geocoding_search_duration', Date.now() - startTime);
      loggingService.info('Geocoding search completed', { 
        query: sanitizedQuery, 
        resultCount: results.length,
        provider: this.config.provider,
        duration: Date.now() - startTime 
      });

      return results;
    } catch (error) {
      loggingService.error('Geocoding search failed', error as Error, { query });
      performanceMonitor.recordMetric('geocoding_search_error', 1);
      
      // Fallback to mock data on error
      return this.searchWithMock(query);
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const startTime = Date.now();
    
    try {
      const cacheKey = `reverse_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.results.length > 0 && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.results[0];
      }

      let result: GeocodingResult | null = null;

      switch (this.config.provider) {
        case 'google':
          result = await this.reverseGeocodeWithGoogle(latitude, longitude);
          break;
        case 'mapbox':
          result = await this.reverseGeocodeWithMapbox(latitude, longitude);
          break;
        default:
          result = await this.reverseGeocodeWithMock(latitude, longitude);
      }

      if (result) {
        this.cache.set(cacheKey, {
          results: [result],
          timestamp: Date.now(),
        });
      }

      performanceMonitor.recordMetric('reverse_geocoding_duration', Date.now() - startTime);
      return result;
    } catch (error) {
      loggingService.error('Reverse geocoding failed', error as Error, { latitude, longitude });
      return this.reverseGeocodeWithMock(latitude, longitude);
    }
  }

  /**
   * Google Places API implementation
   */
  private async searchWithGoogle(query: string): Promise<GeocodingResult[]> {
    if (!this.config.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', query);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('components', `country:${this.config.countryCode}`);
    url.searchParams.set('types', 'geocode|establishment');
    
    if (this.config.biasLocation) {
      url.searchParams.set('location', `${this.config.biasLocation.latitude},${this.config.biasLocation.longitude}`);
      url.searchParams.set('radius', '50000'); // 50km radius
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.predictions?.map((prediction: any, index: number) => ({
      id: prediction.place_id,
      name: prediction.structured_formatting?.main_text || prediction.description,
      description: prediction.description,
      type: this.mapGoogleTypeToLocal(prediction.types?.[0] || 'address'),
      relevance: 1 - (index * 0.1),
      coordinates: undefined, // Would need additional Place Details API call
    })) || [];
  }

  /**
   * Mapbox Geocoding API implementation
   */
  private async searchWithMapbox(query: string): Promise<GeocodingResult[]> {
    if (!this.config.apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
    url.searchParams.set('access_token', this.config.apiKey);
    url.searchParams.set('country', this.config.countryCode?.toLowerCase() || 'bs');
    url.searchParams.set('limit', this.config.maxResults.toString());
    url.searchParams.set('types', 'place,locality,neighborhood,address,poi');
    
    if (this.config.biasLocation) {
      url.searchParams.set('proximity', `${this.config.biasLocation.longitude},${this.config.biasLocation.latitude}`);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    return data.features?.map((feature: any, index: number) => ({
      id: feature.id,
      name: feature.text,
      description: feature.place_name,
      coordinates: {
        latitude: feature.center[1],
        longitude: feature.center[0],
      },
      type: this.mapMapboxTypeToLocal(feature.place_type?.[0] || 'address'),
      relevance: feature.relevance || (1 - (index * 0.1)),
      bbox: feature.bbox,
    })) || [];
  }

  /**
   * Mock implementation for development/fallback
   */
  private async searchWithMock(query: string): Promise<GeocodingResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockResults: GeocodingResult[] = [
      {
        id: 'nassau-mock',
        name: 'Nassau',
        description: 'Nassau, New Providence, Bahamas',
        coordinates: { latitude: 25.0343, longitude: -77.3963 },
        type: 'locality',
        relevance: 0.9,
      },
      {
        id: 'paradise-island-mock',
        name: 'Paradise Island',
        description: 'Paradise Island, Nassau, Bahamas',
        coordinates: { latitude: 25.0845, longitude: -77.3210 },
        type: 'locality',
        relevance: 0.8,
      },
      {
        id: 'freeport-mock',
        name: 'Freeport',
        description: 'Freeport, Grand Bahama, Bahamas',
        coordinates: { latitude: 26.5312, longitude: -78.6956 },
        type: 'locality',
        relevance: 0.7,
      },
      {
        id: 'exuma-mock',
        name: 'Exuma',
        description: 'Exuma Cays, Bahamas',
        coordinates: { latitude: 23.6145, longitude: -75.7382 },
        type: 'locality',
        relevance: 0.6,
      },
    ];

    return mockResults.filter(result => 
      result.name.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Google reverse geocoding
   */
  private async reverseGeocodeWithGoogle(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    if (!this.config.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${latitude},${longitude}`);
    url.searchParams.set('key', this.config.apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      return null;
    }

    const result = data.results[0];
    return {
      id: result.place_id,
      name: result.address_components?.[0]?.long_name || 'Unknown Location',
      description: result.formatted_address,
      coordinates: { latitude, longitude },
      type: 'address',
      relevance: 1.0,
    };
  }

  /**
   * Mapbox reverse geocoding
   */
  private async reverseGeocodeWithMapbox(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    if (!this.config.apiKey) {
      throw new Error('Mapbox API key not configured');
    }

    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`);
    url.searchParams.set('access_token', this.config.apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    const feature = data.features?.[0];
    if (!feature) {
      return null;
    }

    return {
      id: feature.id,
      name: feature.text,
      description: feature.place_name,
      coordinates: { latitude, longitude },
      type: this.mapMapboxTypeToLocal(feature.place_type?.[0] || 'address'),
      relevance: feature.relevance || 1.0,
    };
  }

  /**
   * Mock reverse geocoding
   */
  private async reverseGeocodeWithMock(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      id: 'mock-reverse',
      name: 'Current Location',
      description: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      coordinates: { latitude, longitude },
      type: 'address',
      relevance: 1.0,
    };
  }

  /**
   * Helper methods
   */
  private mapGoogleTypeToLocal(googleType: string): GeocodingResult['type'] {
    const mapping: Record<string, GeocodingResult['type']> = {
      'street_address': 'address',
      'route': 'address',
      'locality': 'locality',
      'administrative_area_level_1': 'region',
      'country': 'country',
      'point_of_interest': 'poi',
      'establishment': 'poi',
    };
    return mapping[googleType] || 'address';
  }

  private mapMapboxTypeToLocal(mapboxType: string): GeocodingResult['type'] {
    const mapping: Record<string, GeocodingResult['type']> = {
      'address': 'address',
      'place': 'locality',
      'locality': 'locality',
      'region': 'region',
      'country': 'country',
      'poi': 'poi',
    };
    return mapping[mapboxType] || 'address';
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GeocodingServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const geocodingService = new GeocodingService();
