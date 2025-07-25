/**
 * Advanced Map Service
 * Provides vehicle clustering, custom markers, route planning, and map-based search functionality
 */

import { VehicleRecommendation } from '../types';
import { loggingService } from './LoggingService';
import { performanceMonitor } from './PerformanceMonitor';
import { analyticsService } from './analyticsService';
import { apiService } from './apiService';

export interface MapBounds {
  northEast: {
    latitude: number;
    longitude: number;
  };
  southWest: {
    latitude: number;
    longitude: number;
  };
}

export interface VehicleCluster {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  vehicleCount: number;
  vehicles: VehicleRecommendation[];
  averagePrice: number;
  availableCount: number;
  radius: number; // in meters
  zoomLevel: number;
}

export interface CustomMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  vehicle: VehicleRecommendation;
  markerType: 'car' | 'scooter' | 'motorcycle' | 'bicycle' | 'other';
  availabilityStatus: 'available' | 'unavailable' | 'reserved' | 'maintenance';
  priceLevel: 'budget' | 'standard' | 'premium' | 'luxury';
  iconUrl?: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string; // encoded polyline
  steps: RouteStep[];
  trafficInfo?: {
    congestionLevel: 'low' | 'moderate' | 'heavy';
    estimatedDelay: number; // in seconds
  };
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

export interface MapSearchFilters {
  bounds: MapBounds;
  vehicleTypes?: string[];
  priceRange?: [number, number];
  availabilityOnly?: boolean;
  maxDistance?: number; // from center in km
}

class AdvancedMapService {
  private clusteringCache: Map<string, VehicleCluster[]> = new Map();
  private routeCache: Map<string, RouteInfo> = new Map();
  private readonly CLUSTER_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly ROUTE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly MIN_CLUSTER_SIZE = 2;
  private readonly MAX_CLUSTER_RADIUS = 1000; // meters

  /**
   * Generate vehicle clusters for map display
   */
  async generateVehicleClusters(
    vehicles: VehicleRecommendation[],
    zoomLevel: number,
    bounds: MapBounds
  ): Promise<VehicleCluster[]> {
    const startTime = Date.now();
    const cacheKey = this.generateClusterCacheKey(vehicles, zoomLevel, bounds);

    try {
      // Check cache first
      const cached = this.clusteringCache.get(cacheKey);
      if (cached) {
        performanceMonitor.recordMetric('map_clustering_cache_hit', 1);
        return cached;
      }

      // Filter vehicles within bounds
      const vehiclesInBounds = vehicles.filter(vehicle => 
        this.isVehicleInBounds(vehicle, bounds)
      );

      if (vehiclesInBounds.length === 0) {
        return [];
      }

      // Calculate clustering parameters based on zoom level
      const clusterRadius = this.calculateClusterRadius(zoomLevel);
      const clusters = this.performClustering(vehiclesInBounds, clusterRadius);

      // Cache the results
      this.clusteringCache.set(cacheKey, clusters);
      
      // Clean old cache entries
      this.cleanClusterCache();

      const processingTime = Date.now() - startTime;
      performanceMonitor.recordMetric('map_clustering_duration', processingTime);
      
      loggingService.info('Vehicle clustering completed', {
        vehicleCount: vehiclesInBounds.length,
        clusterCount: clusters.length,
        zoomLevel,
        processingTime,
      });

      // Track analytics
      analyticsService.trackEvent('map_clustering_performed', {
        vehicleCount: vehiclesInBounds.length,
        clusterCount: clusters.length,
        zoomLevel,
        processingTime,
      });

      return clusters;

    } catch (error) {
      loggingService.error('Vehicle clustering failed', error as Error);
      performanceMonitor.recordMetric('map_clustering_error', 1);
      
      // Fallback: return individual markers
      return this.createFallbackClusters(vehicles.filter(v => this.isVehicleInBounds(v, bounds)));
    }
  }

  /**
   * Generate custom markers for vehicles
   */
  generateCustomMarkers(vehicles: VehicleRecommendation[]): CustomMarker[] {
    return vehicles.map(vehicle => ({
      id: vehicle.id,
      coordinate: {
        latitude: vehicle.vehicle.location?.latitude || 0,
        longitude: vehicle.vehicle.location?.longitude || 0,
      },
      vehicle,
      markerType: this.determineMarkerType(vehicle.vehicle.type),
      availabilityStatus: this.determineAvailabilityStatus(vehicle),
      priceLevel: this.determinePriceLevel(vehicle.pricePerDay),
      iconUrl: this.generateMarkerIconUrl(vehicle),
    }));
  }

  /**
   * Plan route between two points
   */
  async planRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    travelMode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<RouteInfo> {
    const startTime = Date.now();
    const cacheKey = this.generateRouteCacheKey(origin, destination, travelMode);

    try {
      // Check cache first
      const cached = this.routeCache.get(cacheKey);
      if (cached) {
        performanceMonitor.recordMetric('route_planning_cache_hit', 1);
        return cached;
      }

      // Call Google Directions API
      const response = await apiService.post('/maps/directions', {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: travelMode,
        alternatives: false,
        traffic_model: 'best_guess',
        departure_time: 'now',
      }) as { data: any };

      if (!response.data?.routes?.[0]) {
        throw new Error('No route found');
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      const routeInfo: RouteInfo = {
        distance: leg.distance.value,
        duration: leg.duration.value,
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML
          distance: step.distance.value,
          duration: step.duration.value,
          coordinate: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
        })),
        trafficInfo: route.legs[0].duration_in_traffic ? {
          congestionLevel: this.determineCongestionLevel(
            leg.duration.value,
            route.legs[0].duration_in_traffic.value
          ),
          estimatedDelay: route.legs[0].duration_in_traffic.value - leg.duration.value,
        } : undefined,
      };

      // Cache the route
      this.routeCache.set(cacheKey, routeInfo);
      this.cleanRouteCache();

      const processingTime = Date.now() - startTime;
      performanceMonitor.recordMetric('route_planning_duration', processingTime);

      // Track analytics
      analyticsService.trackEvent('route_planned', {
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        travelMode,
        hasTraffic: !!routeInfo.trafficInfo,
        processingTime,
      });

      return routeInfo;

    } catch (error) {
      loggingService.error('Route planning failed', error as Error);
      performanceMonitor.recordMetric('route_planning_error', 1);
      
      // Fallback: calculate straight-line distance
      return this.calculateStraightLineRoute(origin, destination);
    }
  }

  /**
   * Search vehicles within map bounds
   */
  async searchVehiclesInBounds(
    bounds: MapBounds,
    filters: MapSearchFilters
  ): Promise<VehicleRecommendation[]> {
    try {
      const response = await apiService.post('/vehicles/search/map-bounds', {
        bounds,
        filters,
      }) as { data: { vehicles: VehicleRecommendation[] } };

      const vehicles = response.data?.vehicles || [];

      // Track map-based search
      analyticsService.trackEvent('map_bounds_search', {
        boundsArea: this.calculateBoundsArea(bounds),
        vehicleCount: vehicles.length,
        hasFilters: Object.keys(filters).length > 1, // More than just bounds
      });

      return vehicles;

    } catch (error) {
      loggingService.warn('Map bounds search failed', error as Error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private performClustering(vehicles: VehicleRecommendation[], radius: number): VehicleCluster[] {
    const clusters: VehicleCluster[] = [];
    const processed = new Set<string>();

    vehicles.forEach(vehicle => {
      if (processed.has(vehicle.id)) return;

      const vehicleLocation = {
        latitude: vehicle.vehicle.location?.latitude || 0,
        longitude: vehicle.vehicle.location?.longitude || 0,
      };

      // Find nearby vehicles
      const nearbyVehicles = vehicles.filter(v => {
        if (processed.has(v.id) || v.id === vehicle.id) return false;
        
        const distance = this.calculateDistance(
          vehicleLocation,
          {
            latitude: v.vehicle.location?.latitude || 0,
            longitude: v.vehicle.location?.longitude || 0,
          }
        );
        
        return distance <= radius;
      });

      // Create cluster if we have enough vehicles
      if (nearbyVehicles.length >= this.MIN_CLUSTER_SIZE - 1) {
        const clusterVehicles = [vehicle, ...nearbyVehicles];
        const centerPoint = this.calculateClusterCenter(clusterVehicles);
        
        clusters.push({
          id: `cluster_${clusters.length}`,
          coordinate: centerPoint,
          vehicleCount: clusterVehicles.length,
          vehicles: clusterVehicles,
          averagePrice: clusterVehicles.reduce((sum, v) => sum + v.pricePerDay, 0) / clusterVehicles.length,
          availableCount: clusterVehicles.filter(v => v.available !== false).length,
          radius,
          zoomLevel: 0, // Will be set by caller
        });

        // Mark vehicles as processed
        clusterVehicles.forEach(v => processed.add(v.id));
      } else {
        // Single vehicle cluster
        clusters.push({
          id: `single_${vehicle.id}`,
          coordinate: vehicleLocation,
          vehicleCount: 1,
          vehicles: [vehicle],
          averagePrice: vehicle.pricePerDay,
          availableCount: vehicle.available !== false ? 1 : 0,
          radius: 0,
          zoomLevel: 0,
        });
        
        processed.add(vehicle.id);
      }
    });

    return clusters;
  }

  private calculateClusterRadius(zoomLevel: number): number {
    // Adjust cluster radius based on zoom level
    // Higher zoom = smaller radius (more granular clustering)
    const baseRadius = this.MAX_CLUSTER_RADIUS;
    const zoomFactor = Math.max(0.1, 1 - (zoomLevel / 20));
    return baseRadius * zoomFactor;
  }

  private calculateClusterCenter(vehicles: VehicleRecommendation[]): { latitude: number; longitude: number } {
    const totalLat = vehicles.reduce((sum, v) => sum + (v.vehicle.location?.latitude || 0), 0);
    const totalLng = vehicles.reduce((sum, v) => sum + (v.vehicle.location?.longitude || 0), 0);
    
    return {
      latitude: totalLat / vehicles.length,
      longitude: totalLng / vehicles.length,
    };
  }

  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private isVehicleInBounds(vehicle: VehicleRecommendation, bounds: MapBounds): boolean {
    const lat = vehicle.vehicle.location?.latitude || 0;
    const lng = vehicle.vehicle.location?.longitude || 0;
    
    return lat >= bounds.southWest.latitude &&
           lat <= bounds.northEast.latitude &&
           lng >= bounds.southWest.longitude &&
           lng <= bounds.northEast.longitude;
  }

  private determineMarkerType(vehicleType: string): CustomMarker['markerType'] {
    const type = vehicleType.toLowerCase();
    if (type.includes('car') || type.includes('sedan') || type.includes('suv')) return 'car';
    if (type.includes('scooter') || type.includes('moped')) return 'scooter';
    if (type.includes('motorcycle') || type.includes('bike')) return 'motorcycle';
    if (type.includes('bicycle') || type.includes('cycle')) return 'bicycle';
    return 'other';
  }

  private determineAvailabilityStatus(vehicle: VehicleRecommendation): CustomMarker['availabilityStatus'] {
    if (vehicle.available === false) return 'unavailable';
    if (vehicle.vehicle.status === 'maintenance') return 'maintenance';
    if (vehicle.vehicle.status === 'reserved') return 'reserved';
    return 'available';
  }

  private determinePriceLevel(price: number): CustomMarker['priceLevel'] {
    if (price < 30) return 'budget';
    if (price < 60) return 'standard';
    if (price < 100) return 'premium';
    return 'luxury';
  }

  private generateMarkerIconUrl(vehicle: VehicleRecommendation): string {
    const markerType = this.determineMarkerType(vehicle.vehicle.type);
    const availability = this.determineAvailabilityStatus(vehicle);
    const priceLevel = this.determinePriceLevel(vehicle.pricePerDay);
    
    return `/assets/markers/${markerType}_${availability}_${priceLevel}.png`;
  }

  private calculateStraightLineRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): RouteInfo {
    const distance = this.calculateDistance(origin, destination);
    const duration = Math.round(distance / 1000 * 60); // Rough estimate: 1 km per minute
    
    return {
      distance,
      duration,
      polyline: '', // Would need to encode a straight line
      steps: [{
        instruction: 'Head straight to destination',
        distance,
        duration,
        coordinate: origin,
      }],
    };
  }

  private determineCongestionLevel(normalDuration: number, trafficDuration: number): 'low' | 'moderate' | 'heavy' {
    const ratio = trafficDuration / normalDuration;
    if (ratio < 1.2) return 'low';
    if (ratio < 1.5) return 'moderate';
    return 'heavy';
  }

  private calculateBoundsArea(bounds: MapBounds): number {
    const latDiff = bounds.northEast.latitude - bounds.southWest.latitude;
    const lngDiff = bounds.northEast.longitude - bounds.southWest.longitude;
    return latDiff * lngDiff;
  }

  private generateClusterCacheKey(vehicles: VehicleRecommendation[], zoomLevel: number, bounds: MapBounds): string {
    const vehicleIds = vehicles.map(v => v.id).sort().join(',');
    const boundsKey = `${bounds.northEast.latitude},${bounds.northEast.longitude},${bounds.southWest.latitude},${bounds.southWest.longitude}`;
    return `cluster_${zoomLevel}_${boundsKey}_${vehicleIds.substring(0, 50)}`;
  }

  private generateRouteCacheKey(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    travelMode: string
  ): string {
    return `route_${origin.latitude},${origin.longitude}_${destination.latitude},${destination.longitude}_${travelMode}`;
  }

  private createFallbackClusters(vehicles: VehicleRecommendation[]): VehicleCluster[] {
    return vehicles.map(vehicle => ({
      id: `fallback_${vehicle.id}`,
      coordinate: {
        latitude: vehicle.vehicle.location?.latitude || 0,
        longitude: vehicle.vehicle.location?.longitude || 0,
      },
      vehicleCount: 1,
      vehicles: [vehicle],
      averagePrice: vehicle.pricePerDay,
      availableCount: vehicle.available !== false ? 1 : 0,
      radius: 0,
      zoomLevel: 0,
    }));
  }

  private cleanClusterCache(): void {
    const now = Date.now();
    for (const [key, value] of this.clusteringCache.entries()) {
      // Note: We'd need to store timestamp with cached data for proper TTL
      // For now, just limit cache size
      if (this.clusteringCache.size > 50) {
        this.clusteringCache.delete(key);
      }
    }
  }

  private cleanRouteCache(): void {
    const now = Date.now();
    for (const [key, value] of this.routeCache.entries()) {
      // Note: We'd need to store timestamp with cached data for proper TTL
      // For now, just limit cache size
      if (this.routeCache.size > 20) {
        this.routeCache.delete(key);
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.clusteringCache.clear();
    this.routeCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { clusterCacheSize: number; routeCacheSize: number } {
    return {
      clusterCacheSize: this.clusteringCache.size,
      routeCacheSize: this.routeCache.size,
    };
  }
}

export const advancedMapService = new AdvancedMapService();
