/**
 * useIslandRides - Unified hook that brings together all Week 1 and Week 2 implementations
 * Integrates ServiceRegistry, FeatureFlags, IslandContext, and RoleBasedFeatures
 */

import { useIsland, useIslandAwareSearch, usePopularLocations, useEmergencyContacts } from '../contexts/IslandContext';
import { useServices } from '../services/ServiceRegistry';
import { useFeatureFlag } from '../services/FeatureFlagService';
import { useRoleBasedFeatures } from '../components/RoleBasedView';
import { usePermissions } from '../components/ProtectedRoute';
import { SearchCriteria, Vehicle } from '../services/domains/VehicleService';

/**
 * Master hook that provides access to all Island Rides platform capabilities
 * This hook demonstrates the integration of all our architectural improvements
 */
export const useIslandRides = () => {
  // Week 1 implementations
  const services = useServices();
  const performanceMonitor = services.performance;
  
  // Week 2 implementations
  const island = useIsland();
  const islandAwareSearch = useIslandAwareSearch();
  const popularLocations = usePopularLocations();
  const emergencyContacts = useEmergencyContacts();
  const roleFeatures = useRoleBasedFeatures();
  const permissions = usePermissions();

  // Feature flags
  const islandContextEnabled = useFeatureFlag('ISLAND_CONTEXT_PROVIDER');
  const islandAwareSearchEnabled = useFeatureFlag('ISLAND_AWARE_SEARCH');
  const performanceMonitoringEnabled = useFeatureFlag('PERFORMANCE_MONITORING');
  const apiConsolidationEnabled = useFeatureFlag('API_SERVICE_CONSOLIDATION');

  // Island-aware vehicle operations
  const vehicleOperations = {
    /**
     * Search vehicles with automatic island context
     */
    searchVehicles: async (criteria: SearchCriteria): Promise<Vehicle[]> => {
      const timer = performanceMonitor.startTimer('vehicle_search');
      
      try {
        let searchCriteria = criteria;
        
        // Add island context if feature is enabled
        if (islandContextEnabled && islandAwareSearchEnabled) {
          searchCriteria = islandAwareSearch.addIslandFilter(criteria);
        }

        // Use consolidated service or fallback to direct API
        const results = apiConsolidationEnabled
          ? await services.vehicle.searchVehiclesForIsland(searchCriteria, island.currentIsland)
          : await services.vehicle.searchVehicles(searchCriteria);

        return results;
      } catch (error) {
        console.error('Vehicle search failed:', error);
        return [];
      } finally {
        timer();
      }
    },

    /**
     * Get popular vehicles for current island
     */
    getPopularVehicles: async (limit: number = 10): Promise<Vehicle[]> => {
      if (!islandContextEnabled) {
        return services.vehicle.getVehicles({ island: 'nassau' });
      }
      
      return services.vehicle.getPopularVehiclesForIsland(island.currentIsland, limit);
    },

    /**
     * Get nearby vehicles with island awareness
     */
    getNearbyVehicles: async (
      latitude: number,
      longitude: number,
      radius?: number
    ): Promise<Vehicle[]> => {
      const searchRadius = radius || islandAwareSearch.searchRadius;
      
      return services.vehicle.getNearbyVehicles(
        latitude,
        longitude,
        searchRadius,
        island.currentIsland
      );
    },
  };

  // Role-based booking operations
  const bookingOperations = {
    /**
     * Create booking with role-specific logic
     */
    createBooking: async (bookingData: any) => {
      const timer = performanceMonitor.startTimer('booking_creation');
      
      try {
        // Add island context to booking
        const enrichedBookingData = {
          ...bookingData,
          island: island.currentIsland,
          islandConfig: island.islandConfig,
        };

        // Role-specific booking logic
        if (roleFeatures.features.canApproveBookings) {
          enrichedBookingData.autoApprove = true;
        }

        return await services.booking.createBooking(enrichedBookingData);
      } catch (error) {
        console.error('Booking creation failed:', error);
        throw error;
      } finally {
        timer();
      }
    },

    /**
     * Get bookings with role-specific filtering
     */
    getBookings: async () => {
      const timer = performanceMonitor.startTimer('booking_fetch');
      
      try {
        if (roleFeatures.features.canManageFleet) {
          return services.booking.getHostBookings();
        } else {
          return services.booking.getUserBookings();
        }
      } catch (error) {
        console.error('Booking fetch failed:', error);
        return [];
      } finally {
        timer();
      }
    },
  };

  // Island-specific utilities
  const islandUtilities = {
    /**
     * Get island-specific pricing modifier
     */
    getPriceModifier: () => island.islandConfig.priceModifier,

    /**
     * Get popular pickup locations for current island
     */
    getPopularPickupLocations: () => popularLocations,

    /**
     * Get emergency contacts for current island
     */
    getEmergencyContacts: () => emergencyContacts,

    /**
     * Switch to nearest island based on coordinates
     */
    switchToNearestIsland: (lat: number, lng: number) => {
      if (islandContextEnabled) {
        island.switchToNearestIsland(lat, lng);
      }
    },

    /**
     * Check if island supports specific vehicle types
     */
    isVehicleTypeSupported: (vehicleType: string) => {
      return island.islandInfo.features.supportedVehicleTypes.includes(vehicleType as any);
    },
  };

  // Performance monitoring utilities
  const monitoring = {
    /**
     * Record custom business metric
     */
    recordBusinessMetric: (name: string, value: number, metadata?: any) => {
      if (performanceMonitoringEnabled) {
        performanceMonitor.recordMetric(name, value);
        console.log(`Business metric recorded: ${name} = ${value}`, {
          island: island.currentIsland,
          userRole: roleFeatures.userRole,
          ...metadata,
        });
      }
    },

    /**
     * Track user interaction
     */
    trackInteraction: (action: string, metadata?: any) => {
      if (performanceMonitoringEnabled) {
        performanceMonitor.recordMetric(`user_interaction_${action}`, 1);
        console.log(`User interaction tracked: ${action}`, {
          island: island.currentIsland,
          userRole: roleFeatures.userRole,
          timestamp: Date.now(),
          ...metadata,
        });
      }
    },
  };

  // Consolidated state and capabilities
  return {
    // Core contexts
    island,
    services,
    roleFeatures,
    permissions,

    // Feature flags status
    features: {
      islandContext: islandContextEnabled,
      islandAwareSearch: islandAwareSearchEnabled,
      performanceMonitoring: performanceMonitoringEnabled,
      apiConsolidation: apiConsolidationEnabled,
    },

    // Business operations
    vehicles: vehicleOperations,
    bookings: bookingOperations,

    // Island utilities
    islandUtils: islandUtilities,

    // Monitoring and analytics
    monitoring,

    // Quick access to common operations
    quickActions: {
      searchVehiclesOnCurrentIsland: (filters?: Partial<SearchCriteria>) =>
        vehicleOperations.searchVehicles({
          island: island.currentIsland,
          ...filters,
        }),

      getMyRoleBasedDashboardData: async () => {
        const timer = performanceMonitor.startTimer('dashboard_data_load');
        
        try {
          const data: any = {};

          // Load role-specific data
          if (roleFeatures.features.canRentVehicles) {
            data.popularVehicles = await vehicleOperations.getPopularVehicles(5);
          }

          if (roleFeatures.features.canManageFleet) {
            data.bookings = await bookingOperations.getBookings();
            data.fleetVehicles = await services.vehicle.getOwnerFleet();
          }

          if (roleFeatures.features.canViewAnalytics) {
            data.performance = performanceMonitor.getAllStats();
          }

          return data;
        } catch (error) {
          console.error('Dashboard data loading failed:', error);
          return {};
        } finally {
          timer();
        }
      },

      switchIslandAndRefresh: async (newIsland: string) => {
        if (island.isIslandSupported(newIsland as any)) {
          island.setCurrentIsland(newIsland as any);
          
          // Refresh relevant data for new island
          monitoring.trackInteraction('island_switch', { 
            from: island.currentIsland, 
            to: newIsland 
          });
        }
      },
    },
  };
};

export default useIslandRides;