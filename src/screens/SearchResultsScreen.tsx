import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/notificationService';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { VehicleCard } from '../components/VehicleCard';
import { SearchResultsSkeleton } from '../components/skeletons/SearchResultsSkeleton';
import { vehicleService } from '../services/vehicleService';
import { VehicleRecommendation, Island, Vehicle } from '../types';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { InteractiveVehicleMap } from '../components/MapView';
import EnhancedVehicleMap from '../components/map/EnhancedVehicleMap';
import RoutePlanningPanel from '../components/map/RoutePlanningPanel';
import { MapBounds, RouteInfo } from '../services/advancedMapService';
import { UnifiedButton } from '../components/UnifiedButton';
import { useUnifiedAuth } from '../context/UnifiedAuthContext';
import { sanitizeFormData } from '../utils/validation';
import { enhancedSearchService, SearchFilters, SearchOptions } from '../services/enhancedSearchService';
import { favoritesService } from '../services/favoritesService';
import { analyticsService } from '../services/analyticsService';
import { vehicleAvailabilityManager } from '../services/vehicleAvailabilityManager';
import { priceUpdateManager } from '../services/priceUpdateManager';
import { liveSearchManager } from '../services/liveSearchManager';
import { realTimeService } from '../services/realTimeService';
import { VirtualizedList } from '../components/common/VirtualizedList';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { bundleOptimizationService } from '../services/bundleOptimizationService';
import { performanceDashboard } from '../services/performanceDashboard';

type SearchResultsScreenProps = StackScreenProps<RootStackParamList, typeof ROUTES.SEARCH_RESULTS>;

type ViewMode = 'list' | 'grid' | 'map';
type SortOption = 'price_low' | 'price_high' | 'distance' | 'rating' | 'availability' | 'newest';

interface FilterState {
  priceRange: [number, number];
  vehicleTypes: string[];
  features: string[];
  hostRating: number;
  instantBooking: boolean;
  deliveryAvailable: boolean;
}

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = React.memo(({ navigation, route }) => {
  const { user } = useUnifiedAuth();
  const [vehicles, setVehicles] = useState<VehicleRecommendation[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [selectedVehicleForRoute, setSelectedVehicleForRoute] = useState<VehicleRecommendation | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [enableMapClustering, setEnableMapClustering] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 500],
    vehicleTypes: [],
    features: [],
    hostRating: 0,
    instantBooking: false,
    deliveryAvailable: false,
  });

  const { island, vehicles: navigationVehicles } = route.params;

  // Sort and filter vehicles
  const sortedAndFilteredVehicles = useMemo(() => {
    let filtered = vehicles.filter(vehicle => {
      // Price filter
      if (vehicle.pricePerDay < filters.priceRange[0] || vehicle.pricePerDay > filters.priceRange[1]) {
        return false;
      }

      // Vehicle type filter
      if (filters.vehicleTypes.length > 0 && !filters.vehicleTypes.includes(vehicle.type)) {
        return false;
      }

      // Features filter (simplified for VehicleRecommendation type)
      if (filters.features.length > 0) {
        // For now, skip feature filtering as VehicleRecommendation may not have detailed features
        // This would be enhanced when the backend provides feature data
      }

      // Host rating filter (use vehicle rating from scoreBreakdown)
      if (filters.hostRating > 0 && (vehicle.scoreBreakdown?.vehicleRating || 0) < filters.hostRating) {
        return false;
      }

      // Instant booking filter (simplified)
      if (filters.instantBooking) {
        // For now, assume all vehicles support instant booking
        // This would be enhanced when the backend provides this data
      }

      // Delivery available filter (simplified)
      if (filters.deliveryAvailable) {
        // For now, assume delivery is available for all vehicles
        // This would be enhanced when the backend provides this data
      }

      return true;
    });

    // Sort vehicles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.pricePerDay - b.pricePerDay;
        case 'price_high':
          return b.pricePerDay - a.pricePerDay;
        case 'distance':
          // Use recommendation score as proxy for distance (higher score = closer/better)
          return a.recommendationScore - b.recommendationScore;
        case 'rating':
          return (b.scoreBreakdown?.vehicleRating || 0) - (a.scoreBreakdown?.vehicleRating || 0);
        case 'availability':
          return b.recommendationScore - a.recommendationScore;
        case 'newest':
          // Use vehicle ID as proxy for newest (higher ID = newer)
          return parseInt(b.id) - parseInt(a.id);
        default:
          return b.recommendationScore - a.recommendationScore;
      }
    });

    return filtered;
  }, [vehicles, filters, sortBy]);

  useEffect(() => {
    setFilteredVehicles(sortedAndFilteredVehicles);
  }, [sortedAndFilteredVehicles]);

  // Setup real-time subscriptions and performance monitoring
  useEffect(() => {
    // Initialize performance monitoring
    performanceDashboard.initialize();
    bundleOptimizationService.initialize();

    // Subscribe to vehicle availability updates
    const unsubscribeAvailability = vehicleAvailabilityManager.onVehicleListUpdate((updatedVehicles) => {
      setVehicles(updatedVehicles);
    });

    // Subscribe to price updates
    const unsubscribePrice = priceUpdateManager.onPriceChange((notification) => {
      if (notification.isPriceDrop && notification.isFavorite) {
        // Price drop notification is handled by the service
      }
    });

    return () => {
      unsubscribeAvailability();
      unsubscribePrice();
    };
  }, []);

  useEffect(() => {
    // Use vehicles from navigation if available, otherwise fetch them
    if (navigationVehicles && navigationVehicles.length > 0) {
      console.log('📱 Using vehicles from navigation:', navigationVehicles.length);
      setVehicles(navigationVehicles);

      // Subscribe to real-time updates for these vehicles
      vehicleAvailabilityManager.subscribeToVehicles(navigationVehicles);
      priceUpdateManager.updateVehicleCache(navigationVehicles);

      // Set favorites for enhanced notifications
      if (user) {
        const favoriteIds = Array.from(favorites);
        vehicleAvailabilityManager.setFavoriteVehicles(favoriteIds);
        priceUpdateManager.setFavoriteVehicles(favoriteIds);
      }
    } else {
      console.log('🔄 No vehicles from navigation, fetching...');
      fetchVehicles();
    }
  }, [island, navigationVehicles, user, favorites]);

  // Handler functions
  const toggleViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleSortChange = useCallback((sortOption: SortOption) => {
    setSortBy(sortOption);
    setShowSortModal(false);
  }, []);

  const toggleFavorite = useCallback(async (vehicleId: string) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to save favorites.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate(ROUTES.LOGIN) },
        ]
      );
      return;
    }

    const newFavorites = new Set(favorites);
    const isFavorited = newFavorites.has(vehicleId);

    try {
      if (isFavorited) {
        newFavorites.delete(vehicleId);
        await favoritesService.removeFromFavorites(vehicleId, user.id.toString());
        notificationService.success('Removed from favorites');
      } else {
        newFavorites.add(vehicleId);
        const vehicle = filteredVehicles.find(v => v.id === vehicleId);
        await favoritesService.addToFavorites(vehicleId, user.id.toString(), vehicle);
        notificationService.success('Added to favorites');
      }
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      notificationService.error('Failed to update favorites');
    }
  }, [favorites, user, navigation, filteredVehicles]);

  const handleQuickBook = useCallback((vehicle: VehicleRecommendation) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to book a vehicle.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate(ROUTES.LOGIN) },
        ]
      );
      return;
    }

    navigation.navigate(ROUTES.VEHICLE_DETAIL, {
      vehicle: vehicle.vehicle,
    });
  }, [user, navigation]);

  const applyFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      priceRange: [0, 500],
      vehicleTypes: [],
      features: [],
      hostRating: 0,
      instantBooking: false,
      deliveryAvailable: false,
    });
  }, []);

  // Enhanced map handlers
  const handleMapBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);

    // Optionally trigger search based on map bounds
    // This could be debounced for better performance
    analyticsService.trackEvent('map_bounds_changed', {
      boundsArea: (bounds.northEast.latitude - bounds.southWest.latitude) *
                  (bounds.northEast.longitude - bounds.southWest.longitude),
    });
  }, []);

  const handleVehicleSelectFromMap = useCallback((vehicle: VehicleRecommendation) => {
    setSelectedVehicleForRoute(vehicle);

    // Track map vehicle selection
    analyticsService.trackVehicleInteraction(vehicle.id, 'map_select', {
      source: 'enhanced_map',
      viewMode,
    }, user?.id.toString());
  }, [viewMode, user]);

  const handleRouteRequest = useCallback((route: RouteInfo) => {
    setRouteInfo(route);
    setShowRoutePanel(true);
  }, []);

  const handleCloseRoutePanel = useCallback(() => {
    setShowRoutePanel(false);
    setRouteInfo(null);
    setSelectedVehicleForRoute(null);
  }, []);

  const handleStartNavigation = useCallback(() => {
    if (selectedVehicleForRoute && routeInfo) {
      // This would integrate with a navigation service
      analyticsService.trackEvent('navigation_started', {
        vehicleId: selectedVehicleForRoute.id,
        distance: routeInfo.distance,
        duration: routeInfo.duration,
      });

      // Close the route panel and potentially navigate to a navigation screen
      setShowRoutePanel(false);
    }
  }, [selectedVehicleForRoute, routeInfo]);

  const toggleMapClustering = useCallback(() => {
    setEnableMapClustering(prev => !prev);

    analyticsService.trackEvent('map_clustering_toggled', {
      enabled: !enableMapClustering,
      vehicleCount: filteredVehicles.length,
    });
  }, [enableMapClustering, filteredVehicles.length]);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚗 Fetching vehicles for island:', island);

      // Prepare search filters
      const searchFilters: SearchFilters = {
        island: island as Island,
      };

      // Prepare search options
      const searchOptions: SearchOptions = {
        sortBy: sortBy,
        limit: 50,
        realTimeAvailability: realTimeUpdates,
      };

      // Use enhanced search service
      const searchResult = await enhancedSearchService.searchVehicles(searchFilters, searchOptions);

      setVehicles(searchResult.vehicles);
      setSearchId(searchResult.searchId);

      // Load user favorites
      if (user) {
        const userFavorites = favoritesService.getUserFavorites(user.id.toString());
        const favoriteIds = new Set(userFavorites.map(fav => fav.vehicleId));
        setFavorites(favoriteIds);
      }
      
      if (searchResult.vehicles.length === 0) {
        notificationService.info(`No vehicles available in ${island}`, {
          title: 'No Results',
          duration: 4000,
          action: {
            label: 'Try Another Island',
            handler: () => navigation.goBack()
          }
        });
      } else {
        // Track successful search
        analyticsService.trackEvent('search_results_loaded', {
          island,
          totalCount: searchResult.totalCount,
          availableCount: searchResult.availableCount,
          processingTime: searchResult.processingTime,
          realTimeUpdates,
        });
      }
    } catch (err) {
      console.error('❌ Error fetching vehicles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicles';
      setError(errorMessage);
      
      notificationService.error(errorMessage, {
        title: 'Error Loading Vehicles',
        duration: 5000,
        action: {
          label: 'Retry',
          handler: () => fetchVehicles()
        }
      });
    } finally {
      setLoading(false);
    }
  }, [island, sortBy, realTimeUpdates, user]);
  const handleVehiclePress = (vehicleRecommendation: VehicleRecommendation) => {
    navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicle: vehicleRecommendation.vehicle });
  };

  const renderVehicleItem = ({ item }: { item: VehicleRecommendation }) => (
    <VehicleCard 
      vehicle={item.vehicle} 
      onPress={() => handleVehiclePress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No vehicles available</Text>
      <Text style={styles.emptySubtitle}>
        There are currently no vehicles available in {island}. Please try another island.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🚗 Available in {island}</Text>
          <Text style={styles.subtitle}>Finding vehicles...</Text>
        </View>
        <SearchResultsSkeleton 
          itemCount={6}
          showHeader={false}
          compact={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Search Results</Text>
            <Text style={styles.subtitle}>
              {filteredVehicles.length} of {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in {island}
            </Text>
          </View>
        </View>

        {/* Controls Row */}
        <View style={styles.controlsRow}>
          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
              onPress={() => toggleViewMode('list')}
            >
              <Ionicons
                name="list"
                size={18}
                color={viewMode === 'list' ? colors.white : colors.darkGrey}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'grid' && styles.activeToggle]}
              onPress={() => toggleViewMode('grid')}
            >
              <Ionicons
                name="grid"
                size={18}
                color={viewMode === 'grid' ? colors.white : colors.darkGrey}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]}
              onPress={() => toggleViewMode('map')}
            >
              <Ionicons
                name="map"
                size={18}
                color={viewMode === 'map' ? colors.white : colors.darkGrey}
              />
            </TouchableOpacity>
          </View>

          {/* Sort and Filter Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSortModal(true)}
            >
              <Ionicons name="swap-vertical" size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>Sort</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, Object.values(filters).some(v =>
                Array.isArray(v) ? v.length > 0 : v !== 0 && v !== false
              ) && styles.actionButtonActive]}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons name="filter" size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {viewMode === 'list' ? (
        <VirtualizedList
          data={vehicles}
          renderItem={renderVehicleItem}
          keyExtractor={(item) => item.vehicle.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          // Performance optimizations
          itemHeight={120}
          enableVirtualization={true}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          initialNumToRender={8}
          windowSize={15}
          debug={__DEV__}
        />
      ) : (
        <View style={styles.mapContainer}>
          <EnhancedVehicleMap
            vehicles={filteredVehicles}
            onVehicleSelect={handleVehicleSelectFromMap}
            onMapBoundsChange={handleMapBoundsChange}
            onRouteRequest={handleRouteRequest}
            showUserLocation={true}
            enableClustering={enableMapClustering}
            enableRouteMode={true}
            mapType="standard"
            style={styles.enhancedMap}
          />

          {/* Map Controls Overlay */}
          <View style={styles.mapControlsOverlay}>
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={toggleMapClustering}
            >
              <Ionicons
                name={enableMapClustering ? "apps" : "location"}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.mapControlText}>
                {enableMapClustering ? 'Cluster' : 'Individual'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Route Planning Panel */}
          {showRoutePanel && routeInfo && selectedVehicleForRoute && (
            <View style={styles.routePanelContainer}>
              <RoutePlanningPanel
                routeInfo={routeInfo}
                vehicle={selectedVehicleForRoute}
                userLocation={{ latitude: 25.0343, longitude: -77.3963 }} // Would get from location service
                onClose={handleCloseRoutePanel}
                onStartNavigation={handleStartNavigation}
              />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  title: {
    ...typography.heading1,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    fontSize: 16,
  },
  listContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  viewToggle: {
    flexDirection: 'row',
    marginTop: spacing.md,
    backgroundColor: colors.lightGrey,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    ...typography.body,
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: '600',
  },
  activeToggleText: {
    color: colors.white,
  },
  mapContainer: {
    flex: 1,
  },
  // Enhanced header styles
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.lightGrey,
    gap: spacing.xs,
  },
  actionButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  // Enhanced map styles
  enhancedMap: {
    flex: 1,
  },
  mapControlsOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mapControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: spacing.xs,
  },
  mapControlText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  routePanelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
