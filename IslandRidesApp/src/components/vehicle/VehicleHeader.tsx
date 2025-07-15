import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/Theme';
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
          vehicle.driveSide === 'LHD' ? styles.lhdBadge : styles.rhdBadge
        ]}>
          <Ionicons 
            name="car-outline" 
            size={16} 
            color={colors.white} 
            style={styles.badgeIcon}
          />
          <Text style={styles.badgeText}>{vehicle.driveSide ?? 'N/A'}</Text>
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
    marginBottom: spacing.sm,
  },
  vehicleName: {
    ...typography.heading1,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    marginRight: spacing.md,
  },
  driveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  lhdBadge: {
    backgroundColor: colors.primary,
  },
  rhdBadge: {
    backgroundColor: colors.info,
  },
  badgeIcon: {
    marginRight: spacing.xs,
  },
  badgeText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
  },
});