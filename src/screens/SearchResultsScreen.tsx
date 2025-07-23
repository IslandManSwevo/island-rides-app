import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/notificationService';
import { colors, typography, spacing } from '../styles/theme';
import { VehicleCard } from '../components/VehicleCard';
import { SearchResultsSkeleton } from '../components/skeletons/SearchResultsSkeleton';
import { vehicleService } from '../services/vehicleService';
import { VehicleRecommendation, Island, Vehicle } from '../types';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { InteractiveVehicleMap } from '../components/MapView';

type SearchResultsScreenProps = StackScreenProps<RootStackParamList, typeof ROUTES.SEARCH_RESULTS>;

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({ navigation, route }) => {
  const [vehicles, setVehicles] = useState<VehicleRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const { island, vehicles: navigationVehicles } = route.params;

  useEffect(() => {
    // Use vehicles from navigation if available, otherwise fetch them
    if (navigationVehicles && navigationVehicles.length > 0) {
      console.log('📱 Using vehicles from navigation:', navigationVehicles.length);
      setVehicles(navigationVehicles);
    } else {
      console.log('🔄 No vehicles from navigation, fetching...');
      fetchVehicles();
    }
  }, [island, navigationVehicles]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚗 Fetching vehicles for island:', island);
      const vehicleRecommendations = await vehicleService.getVehiclesByIsland(island as Island);
      setVehicles(vehicleRecommendations);
      
      if (vehicleRecommendations.length === 0) {
        notificationService.info(`No vehicles available in ${island}`, {
          title: 'No Results',
          duration: 4000,
          action: {
            label: 'Try Another Island',
            handler: () => navigation.goBack()
          }
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
  };
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
      <View style={styles.header}>
        <Text style={styles.title}>🚗 Available in {island}</Text>
        <Text style={styles.subtitle}>
          {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} found
        </Text>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={viewMode === 'list' ? colors.white : colors.darkGrey} 
            />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons 
              name="map" 
              size={20} 
              color={viewMode === 'map' ? colors.white : colors.darkGrey} 
            />
            <Text style={[styles.toggleText, viewMode === 'map' && styles.activeToggleText]}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={vehicles}
          renderItem={renderVehicleItem}
          keyExtractor={(item) => item.vehicle.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      ) : (
        <View style={styles.mapContainer}>
          <InteractiveVehicleMap
            vehicles={vehicles.map(v => v.vehicle)}
            onVehicleSelect={(vehicle: Vehicle | VehicleRecommendation) => {
              const actualVehicle = 'vehicle' in vehicle ? vehicle.vehicle : vehicle;
              navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicle: actualVehicle });
            }}
            showUserLocation={true}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

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
});
