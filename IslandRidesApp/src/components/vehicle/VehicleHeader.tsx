import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../styles/theme';
import { FavoriteButton } from '../FavoriteButton';
import { Vehicle } from '../../types';

interface VehicleHeaderProps {
  vehicle: Vehicle;
}

export const VehicleHeader: React.FC<VehicleHeaderProps> = ({ vehicle }) => {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.vehicleName}>
        {vehicle.make} {vehicle.model}
      </Text>
      <View style={styles.headerActions}>
        <FavoriteButton vehicleId={vehicle.id} size={24} style={styles.favoriteButton} />
        <View style={[
          styles.driveBadge,
          (vehicle.driveSide || vehicle.drive_side) === 'LHD' ? styles.lhdBadge : styles.rhdBadge
        ]}>
          <Ionicons 
            name="car-outline" 
            size={16} 
            color={colors.white} 
            style={styles.badgeIcon}
          />
          <Text style={styles.badgeText}>{vehicle.driveSide || vehicle.drive_side}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  vehicleName: {
    ...typography.h2,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    marginRight: spacing.medium,
  },
  driveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny,
    borderRadius: borderRadius.medium,
  },
  lhdBadge: {
    backgroundColor: colors.primary,
  },
  rhdBadge: {
    backgroundColor: colors.secondary,
  },
  badgeIcon: {
    marginRight: spacing.tiny,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
});