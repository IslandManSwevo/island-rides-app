import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

interface VehicleHeaderProps {
  vehicle: {
    year: number;
    make: string;
    model: string;
    dailyRate: number;
    available: boolean;
    verificationStatus: string;
  };
  formatCurrency: (amount: number) => string;
  getVerificationStatusColor: (status: string) => string;
  getVerificationStatusIcon: (status: string) => any;
}

export const VehicleHeader: React.FC<VehicleHeaderProps> = ({
  vehicle,
  formatCurrency,
  getVerificationStatusColor,
  getVerificationStatusIcon
}) => (
  <View style={styles.vehicleHeader}>
    <View style={styles.vehicleInfo}>
      <Text style={styles.vehicleName}>
        {vehicle.year} {vehicle.make} {vehicle.model}
      </Text>
      <View style={styles.statusRow}>
        <View style={[styles.availabilityBadge, { backgroundColor: vehicle.available ? colors.success : colors.error }]}>
          <Text style={styles.availabilityText}>
            {vehicle.available ? 'Available' : 'Unavailable'}
          </Text>
        </View>
        <View style={styles.verificationBadge}>
          <Ionicons 
            name={getVerificationStatusIcon(vehicle.verificationStatus)} 
            size={12} 
            color={getVerificationStatusColor(vehicle.verificationStatus)} 
          />
          <Text style={[styles.verificationText, { color: getVerificationStatusColor(vehicle.verificationStatus) }]}>
            {vehicle.verificationStatus?.charAt(0).toUpperCase() + vehicle.verificationStatus?.slice(1)}
          </Text>
        </View>
      </View>
    </View>
    <Text style={styles.dailyRate}>{formatCurrency(vehicle.dailyRate)}/day</Text>
  </View>
);

const styles = StyleSheet.create({
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...typography.heading1,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  availabilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  availabilityText: {
    ...typography.body,
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verificationText: {
    ...typography.body,
    fontSize: 12,
    fontWeight: '600',
  },
  dailyRate: {
    ...typography.heading1,
    color: colors.primary,
  },
});