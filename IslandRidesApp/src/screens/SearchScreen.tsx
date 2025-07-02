import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleService } from '../services/vehicleService';
import { StorageService } from '../utils/storage';
import { Vehicle } from '../types';
import { colors, typography, spacing } from '../styles/theme';

interface SearchScreenProps {
  route: any;
  navigation: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ route, navigation }) => {
  const { island } = route.params || {};
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, [island]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await StorageService.getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again');
        navigation.navigate('Login');
        return;
      }

      const vehicleData = await VehicleService.getVehiclesByIsland(island, token);
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError(error instanceof Error ? error.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    navigation.navigate('VehicleDetail', { vehicle });
  };

  const renderVehicleCard = ({ item }: { item: Vehicle }) => (
    <VehicleCard
      vehicle={item}
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

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorTitle}>Unable to load vehicles</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.gradientLight]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.gradientLight]}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🚗 Available in {island}</Text>
        <Text style={styles.subtitle}>
          {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicleCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading1,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    ...typography.subheading,
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
  },
});
