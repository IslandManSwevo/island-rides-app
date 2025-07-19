import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../types';
import { colors, typography, spacing } from '../styles/theme';

const { width, height } = Dimensions.get('window');

interface MapViewProps {
  vehicles: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  showUserLocation?: boolean;
}

export const InteractiveVehicleMap: React.FC<MapViewProps> = ({
  vehicles,
  onVehicleSelect,
  userLocation,
  showUserLocation = true,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const handleVehiclePress = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
  };

  return (
    <View style={styles.container}>
      {/* Web fallback - show a styled list instead of map */}
      <View style={styles.webMapContainer}>
        <View style={styles.mapHeader}>
          <Ionicons name="map" size={24} color={colors.primary} />
          <Text style={styles.mapTitle}>Vehicle Locations</Text>
          <Text style={styles.mapSubtitle}>Map view available on mobile</Text>
        </View>
        
        <ScrollView style={styles.vehiclesList} showsVerticalScrollIndicator={false}>
          {vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleItem,
                selectedVehicle?.id === vehicle.id && styles.selectedVehicleItem
              ]}
              onPress={() => handleVehiclePress(vehicle)}
            >
              <View style={styles.vehicleHeader}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: (vehicle.available ? '#007AFF' : '#FF3B30') as string }
                ]} />
                <Text style={styles.vehicleName}>
                  {vehicle.make} {vehicle.model}
                </Text>
              </View>
              
              <Text style={styles.vehiclePrice}>
                ${vehicle.dailyRate}/day
              </Text>
              
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.darkGrey} />
                <Text style={styles.vehicleLocation}>
                  {vehicle.location}
                </Text>
              </View>
              
              {vehicle.latitude && vehicle.longitude && (
                <Text style={styles.coordinates}>
                  {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          
          {vehicles.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={colors.lightGrey} />
              <Text style={styles.emptyText}>No vehicles to display</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  webMapContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mapHeader: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  mapTitle: {
    ...typography.heading2,
    marginTop: spacing.sm,
    color: colors.darkGrey,
  },
  mapSubtitle: {
    ...typography.caption,
    color: colors.darkGrey,
    marginTop: spacing.xs,
  },
  vehiclesList: {
    flex: 1,
    padding: spacing.md,
  },
  vehicleItem: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedVehicleItem: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  vehicleName: {
    ...typography.subheading,
    flex: 1,
  },
  vehiclePrice: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  vehicleLocation: {
    ...typography.body,
    marginLeft: spacing.xs,
    color: colors.darkGrey,
  },
  coordinates: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.lightGrey,
    marginTop: spacing.md,
  },
});

export default InteractiveVehicleMap;