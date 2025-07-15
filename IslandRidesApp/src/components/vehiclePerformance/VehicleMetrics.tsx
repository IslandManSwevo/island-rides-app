import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../styles/Theme';

interface VehicleMetricsProps {
  vehicle: {
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    reviewCount: number;
  };
  formatCurrency: (amount: number) => string;
  getPerformanceColor: (value: number, type: string) => string;
}

export const VehicleMetrics: React.FC<VehicleMetricsProps> = ({
  vehicle,
  formatCurrency,
  getPerformanceColor
}) => (
  <View style={styles.metricsRow}>
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{vehicle.totalBookings}</Text>
      <Text style={styles.metricLabel}>Total Bookings</Text>
    </View>
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{formatCurrency(vehicle.totalRevenue)}</Text>
      <Text style={styles.metricLabel}>Total Revenue</Text>
    </View>
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: getPerformanceColor(vehicle.averageRating, 'rating') }]}>
        {vehicle.averageRating.toFixed(1)}⭐
      </Text>
      <Text style={styles.metricLabel}>{vehicle.reviewCount} reviews</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.offWhite,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.heading1,
    color: colors.black,
  },
  metricLabel: {
    ...typography.body,
    fontSize: 12,
    color: colors.lightGrey,
    marginTop: spacing.xs,
  },
});