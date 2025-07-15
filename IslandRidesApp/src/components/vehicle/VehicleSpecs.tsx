import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../styles/Theme';
import { Vehicle } from '../../types';

interface VehicleSpecsProps {
  vehicle: Vehicle;
}

export const VehicleSpecs: React.FC<VehicleSpecsProps> = ({ vehicle }) => {
  return (
    <View style={styles.specsGrid}>
      {vehicle.vehicleType && (
        <View style={styles.specItem}>
          <Ionicons name="car-outline" size={20} color={colors.primary} />
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Type</Text>
            <Text style={styles.specValue}>{vehicle.vehicleType}</Text>
          </View>
        </View>
      )}

      {vehicle.seatingCapacity && (
        <View style={styles.specItem}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Seating</Text>
            <Text style={styles.specValue}>{vehicle.seatingCapacity} passengers</Text>
          </View>
        </View>
      )}

      {vehicle.fuelType && (
        <View style={styles.specItem}>
          <Ionicons name="flash-outline" size={20} color={colors.primary} />
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Fuel Type</Text>
            <Text style={styles.specValue}>{vehicle.fuelType}</Text>
          </View>
        </View>
      )}

      {vehicle.transmissionType && (
        <View style={styles.specItem}>
          <Ionicons name="settings-outline" size={20} color={colors.primary} />
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Transmission</Text>
            <Text style={styles.specValue}>{vehicle.transmissionType}</Text>
          </View>
        </View>
      )}

      {vehicle.engineType && (
        <View style={styles.specItem}>
          <Ionicons name="hardware-chip-outline" size={20} color={colors.primary} />
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Engine</Text>
            <Text style={styles.specValue}>{vehicle.engineType}</Text>
          </View>
        </View>
      )}

      {vehicle.doors && (
        <View style={styles.specItem}>
          <Ionicons name="exit-outline" size={20} color={colors.primary} />
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Doors</Text>
            <Text style={styles.specValue}>{vehicle.doors} doors</Text>
          </View>
        </View>
      )}

      {vehicle.color && (
        <View style={styles.specItem}>
          <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Color</Text>
            <Text style={styles.specValue}>{vehicle.color}</Text>
          </View>
        </View>
      )}

      {vehicle.mileage && (
        <View style={styles.specItem}>
          <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Mileage</Text>
            <Text style={styles.specValue}>
              {typeof vehicle.mileage === 'number' && !isNaN(vehicle.mileage) 
                ? vehicle.mileage.toLocaleString() 
                : 'N/A'} miles
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing.md,
  },
  specContent: {
    marginLeft: spacing.sm,
  },
  specLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  specValue: {
    ...typography.body,
    fontWeight: '600',
  },
});