import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import ModernVehicleCard from './ModernVehicleCard';
import VehicleCardSkeleton from './VehicleCardSkeleton';
import Theme from '../styles/Theme';
import { Vehicle } from '../types';

const ModernVehicleCardDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sample vehicle data
  const sampleVehicles: Vehicle[] = [
    {
      id: 1,
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      ownerId: 1,
      location: 'Nassau',
      dailyRate: 65,
      available: true,
      driveSide: 'LHD',
      createdAt: '2024-01-15',
      description: 'Immaculate condition, perfect for island cruising with excellent fuel economy',
      seatingCapacity: 5,
      transmissionType: 'automatic',
      conditionRating: 4.8,
      photos: [
        {
          id: 1,
          vehicleId: 1,
          photoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
          photoType: 'exterior',
          displayOrder: 1,
          isPrimary: true,
          uploadedAt: '2024-01-15',
        },
      ],
    },
    {
      id: 2,
      make: 'Honda',
      model: 'CR-V',
      year: 2022,
      ownerId: 2,
      location: 'Freeport',
      dailyRate: 85,
      available: true,
      driveSide: 'LHD',
      createdAt: '2024-01-10',
      description: 'Spacious SUV ideal for family trips and exploring the island',
      seatingCapacity: 7,
      transmissionType: 'automatic',
      conditionRating: 4.5,
      photos: [
        {
          id: 2,
          vehicleId: 2,
          photoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
          photoType: 'exterior',
          displayOrder: 1,
          isPrimary: true,
          uploadedAt: '2024-01-10',
        },
      ],
    },
    {
      id: 3,
      make: 'Jeep',
      model: 'Wrangler',
      year: 2021,
      ownerId: 3,
      location: 'Exuma',
      dailyRate: 120,
      available: true,
      driveSide: 'LHD',
      createdAt: '2024-01-08',
      description: 'Perfect for beach adventures and off-road island exploration',
      seatingCapacity: 4,
      transmissionType: 'manual',
      conditionRating: 4.2,
      photos: [
        {
          id: 3,
          vehicleId: 3,
          photoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
          photoType: 'exterior',
          displayOrder: 1,
          isPrimary: true,
          uploadedAt: '2024-01-08',
        },
      ],
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleCardPress = (vehicle: Vehicle) => {
    console.log('Pressed vehicle:', vehicle.make, vehicle.model);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Modern Vehicle Cards</Text>
        <Text style={styles.subtitle}>Frosted glass design with smooth animations</Text>
      </View>

      {loading ? (
        // Loading state
        <View>
          <VehicleCardSkeleton />
          <VehicleCardSkeleton />
          <VehicleCardSkeleton />
        </View>
      ) : (
        // Loaded state
        <View>
          {sampleVehicles.map((vehicle) => (
            <ModernVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={() => handleCardPress(vehicle)}
            />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loading Skeleton</Text>
        <VehicleCardSkeleton />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  section: {
    marginTop: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
});

export default ModernVehicleCardDemo;
