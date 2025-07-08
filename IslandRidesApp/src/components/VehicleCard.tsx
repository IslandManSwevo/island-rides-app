import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Vehicle } from '../types';
import { FavoriteButton } from './FavoriteButton';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.favoriteButton}>
        <FavoriteButton vehicleId={vehicle.id} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.vehicleInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.vehicleName}>
              {vehicle.make} {vehicle.model}
            </Text>
            <View style={[
              styles.driveBadge,
              vehicle.driveSide === 'LHD' ? styles.lhdBadge : styles.rhdBadge
            ]}>
              <Ionicons 
                name="car-outline" 
                size={12} 
                color={colors.white} 
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>{vehicle.driveSide}</Text>
            </View>
          </View>
          
          <Text style={styles.vehicleYear}>{vehicle.year}</Text>
          <Text style={styles.vehicleLocation}>{vehicle.location}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>${vehicle.dailyRate}</Text>
            <Text style={styles.priceUnit}>per day</Text>
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  vehicleInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGrey,
    flex: 1,
  },
  driveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  lhdBadge: {
    backgroundColor: colors.primary,
  },
  rhdBadge: {
    backgroundColor: '#E74C3C',
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleYear: {
    ...typography.body,
    fontSize: 14,
    marginBottom: 2,
  },
  vehicleLocation: {
    ...typography.body,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  priceUnit: {
    ...typography.body,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  arrowContainer: {
    marginLeft: spacing.md,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
