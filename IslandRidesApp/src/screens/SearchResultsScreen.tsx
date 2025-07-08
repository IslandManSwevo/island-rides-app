import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { notificationService } from '../services/notificationService';
import { colors, typography, spacing } from '../styles/theme';
import { VehicleCard } from '../components/VehicleCard';
import { vehicleService } from '../services/vehicleService';
import { VehicleRecommendation, Island } from '../types';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type SearchResultsScreenProps = StackScreenProps<RootStackParamList, typeof ROUTES.SEARCH_RESULTS>;

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({ navigation, route }) => {
  const [vehicles, setVehicles] = useState<VehicleRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const handleVehiclePress = (vehicle: VehicleRecommendation) => {
    navigation.navigate('VehicleDetail', { vehicle: vehicle.vehicle });
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding vehicles in {island}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚗 Available in {island}</Text>
        <Text style={styles.subtitle}>
          {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.vehicle.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
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
});
