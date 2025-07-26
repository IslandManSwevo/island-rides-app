import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useFeatureFlag, useEnhancedNavigation } from '../../hooks/useFeatureFlags';
import { colors, spacing } from '../../styles/theme';
import { RootStackParamList, ROUTES } from '../../navigation/routes';
import { Island, Vehicle, VehicleRecommendation } from '../../types';
import { islands } from '../../constants/islands';
import { vehicleService } from '../../services/vehicleService';
import { SmartIslandSelector } from '../../components/enhanced/SmartIslandSelector';

/**
 * Enhanced Home Screen Component
 * 
 * This component provides an enhanced home screen experience when the
 * ENHANCED_HOME_SCREEN feature flag is enabled. It includes:
 * - Personalized welcome interface
 * - Smart island recommendations
 * - Quick action cards
 * - Recent search suggestions
 * - Popular vehicles preview
 * 
 * BROWNFIELD SAFETY:
 * - Only renders when ENHANCED_HOME_SCREEN flag is enabled
 * - Falls back gracefully to original SearchScreen
 * - Preserves all existing navigation patterns
 * - Can be instantly rolled back via Epic 1 procedures
 */

type EnhancedHomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface EnhancedHomeScreenProps {
  navigation: EnhancedHomeScreenNavigationProp;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

interface PopularVehicle {
  vehicle: Vehicle;
  popularity: number;
  island: string;
}

export const EnhancedHomeScreen: React.FC<EnhancedHomeScreenProps> = ({ navigation }) => {
  // Feature flag checks
  const isEnhancedHomeEnabled = useFeatureFlag('ENHANCED_HOME_SCREEN');
  const isSmartIslandEnabled = useFeatureFlag('SMART_ISLAND_SELECTION');
  const { actions } = useEnhancedNavigation();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendedIslands, setRecommendedIslands] = useState<Island[]>([]);
  const [popularVehicles, setPopularVehicles] = useState<PopularVehicle[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Early return if feature flag is disabled (brownfield safety)
  if (!isEnhancedHomeEnabled) {
    actions.logNavigationEvent('enhanced_home_screen_disabled', {
      flag: 'ENHANCED_HOME_SCREEN',
      fallback: 'original_search_screen'
    });
    return null; // This will cause the NavigationWrapper to show original SearchScreen
  }

  // Load enhanced home screen data
  const loadHomeScreenData = useCallback(async () => {
    try {
      setIsLoading(true);
      actions.logNavigationEvent('enhanced_home_screen_loading_start');

      // Load user preferences and location
      await Promise.all([
        loadUserLocation(),
        loadRecommendedIslands(),
        loadPopularVehicles(),
        loadUserProfile(),
      ]);

      actions.logNavigationEvent('enhanced_home_screen_loading_complete');
    } catch (error) {
      console.error('Failed to load enhanced home screen data:', error);
      actions.logNavigationEvent('enhanced_home_screen_loading_error', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [actions]);

  const loadUserLocation = async () => {
    if (!isSmartIslandEnabled) return;

    try {
      // Request location permission and get current location
      // This is a simplified implementation - in production would use expo-location
      const mockLocation = { latitude: 25.0443, longitude: -77.3504 }; // Nassau coordinates
      setUserLocation(mockLocation);
      
      actions.logNavigationEvent('user_location_detected', {
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude
      });
    } catch (error) {
      console.warn('Location detection failed, using fallback:', error);
      actions.logNavigationEvent('user_location_fallback', { error: error.message });
    }
  };

  const loadRecommendedIslands = async () => {
    try {
      let recommendedList = [...islands];

      if (isSmartIslandEnabled && userLocation) {
        // Sort islands by distance from user location
        recommendedList = islands.map(island => ({
          ...island,
          distance: calculateDistance(userLocation, {
            latitude: island.coordinates.latitude,
            longitude: island.coordinates.longitude
          })
        })).sort((a, b) => a.distance - b.distance);
      }

      setRecommendedIslands(recommendedList.slice(0, 3)); // Top 3 recommendations
    } catch (error) {
      console.error('Failed to load recommended islands:', error);
      setRecommendedIslands(islands.slice(0, 3)); // Fallback to first 3 islands
    }
  };

  const loadPopularVehicles = async () => {
    try {
      // Load popular vehicles across all islands
      const searchResults = await vehicleService.searchVehicles({
        sortBy: 'popularity',
        limit: 6
      });

      const popular = searchResults.map(result => ({
        vehicle: result.vehicle,
        popularity: Math.random() * 100, // Mock popularity score
        island: result.vehicle.island || 'Nassau'
      }));

      setPopularVehicles(popular);
    } catch (error) {
      console.error('Failed to load popular vehicles:', error);
      setPopularVehicles([]);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Mock user profile loading
      setUserName('Traveler'); // In production, load from user service
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUserName('Welcome');
    }
  };

  const calculateDistance = (point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }) => {
    // Simplified distance calculation (Haversine formula)
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHomeScreenData();
    setRefreshing(false);
  };

  // Quick action definitions
  const quickActions: QuickAction[] = [
    {
      id: 'search',
      title: 'Search Vehicles',
      description: 'Find your perfect ride',
      icon: 'search',
      color: colors.primary,
      onPress: () => {
        actions.logNavigationEvent('quick_action_search');
        navigation.navigate(ROUTES.SEARCH);
      }
    },
    {
      id: 'bookings',
      title: 'My Bookings',
      description: 'Manage your rentals',
      icon: 'calendar',
      color: colors.secondary,
      onPress: () => {
        actions.logNavigationEvent('quick_action_bookings');
        navigation.navigate('MyBookings' as any);
      }
    },
    {
      id: 'favorites',
      title: 'Favorites',
      description: 'Your saved vehicles',
      icon: 'heart',
      color: colors.accent,
      onPress: () => {
        actions.logNavigationEvent('quick_action_favorites');
        navigation.navigate('Favorites' as any);
      }
    },
    {
      id: 'map',
      title: 'Map View',
      description: 'Explore nearby vehicles',
      icon: 'map',
      color: colors.info,
      onPress: () => {
        actions.logNavigationEvent('quick_action_map');
        navigation.navigate(ROUTES.MAP);
      }
    }
  ];

  // Load data on component mount
  useEffect(() => {
    loadHomeScreenData();
  }, [loadHomeScreenData]);

  const renderWelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeTitle}>
        Welcome back, {userName}! 👋
      </Text>
      <Text style={styles.welcomeSubtitle}>
        Ready for your next adventure in the Bahamas?
      </Text>
      {userLocation && (
        <View style={styles.locationIndicator}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.locationText}>
            Location detected - showing nearby options
          </Text>
        </View>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map(action => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickActionCard, { borderLeftColor: action.color }]}
            onPress={action.onPress}
            testID={`quick-action-${action.id}`}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon} size={24} color={colors.surface} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionDescription}>{action.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecommendedIslands = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {isSmartIslandEnabled ? 'Recommended Destinations' : 'Popular Destinations'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.islandsScroll}>
        {recommendedIslands.map(island => (
          <TouchableOpacity
            key={island.id}
            style={styles.islandCard}
            onPress={() => {
              actions.logNavigationEvent('island_selected', { island: island.id });
              navigation.navigate(ROUTES.SEARCH, { island: island.id });
            }}
            testID={`island-card-${island.id}`}
          >
            <View style={styles.islandImagePlaceholder}>
              <Ionicons name="island" size={32} color={colors.primary} />
            </View>
            <Text style={styles.islandName}>{island.name}</Text>
            <Text style={styles.islandDescription}>{island.description}</Text>
            {userLocation && island.distance && (
              <Text style={styles.islandDistance}>
                {island.distance.toFixed(0)} km away
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPopularVehicles = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Vehicles</Text>
        <TouchableOpacity
          onPress={() => {
            actions.logNavigationEvent('view_all_vehicles');
            navigation.navigate(ROUTES.SEARCH);
          }}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehiclesScroll}>
        {popularVehicles.map((item, index) => (
          <TouchableOpacity
            key={`${item.vehicle.id}-${index}`}
            style={styles.vehicleCard}
            onPress={() => {
              actions.logNavigationEvent('popular_vehicle_selected', { vehicleId: item.vehicle.id });
              navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicle: item.vehicle });
            }}
            testID={`popular-vehicle-${item.vehicle.id}`}
          >
            <View style={styles.vehicleImagePlaceholder}>
              <Ionicons name="car" size={32} color={colors.primary} />
            </View>
            <Text style={styles.vehicleName}>
              {item.vehicle.make} {item.vehicle.model}
            </Text>
            <Text style={styles.vehiclePrice}>
              ${item.vehicle.price_per_day}/day
            </Text>
            <Text style={styles.vehicleIsland}>{item.island}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      testID="enhanced-home-screen"
    >
      {renderWelcomeSection()}
      {renderQuickActions()}
      {renderRecommendedIslands()}
      {renderPopularVehicles()}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcomeSection: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  locationText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  quickActionsGrid: {
    gap: spacing.md,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quickActionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  islandsScroll: {
    marginTop: spacing.md,
  },
  islandCard: {
    width: width * 0.7,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  islandImagePlaceholder: {
    height: 120,
    backgroundColor: colors.lightGrey,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  islandName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  islandDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  islandDistance: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  vehiclesScroll: {
    marginTop: spacing.md,
  },
  vehicleCard: {
    width: width * 0.4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleImagePlaceholder: {
    height: 80,
    backgroundColor: colors.lightGrey,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  vehicleIsland: {
    fontSize: 12,
    color: colors.textSecondary,
  },
};

export default EnhancedHomeScreen;
