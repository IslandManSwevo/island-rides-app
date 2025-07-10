import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../styles/theme';

interface VehiclePerformanceMetricsProps {
  vehicle: {
    occupancyRate: number;
    conditionRating: number;
    recentBookings: number;
    recentRevenue: number;
    maintenanceInfo: {
      lastMaintenance: string | null;
    };
  };
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
  getPerformanceColor: (value: number, type: string) => string;
}

export const VehiclePerformanceMetrics: React.FC<VehiclePerformanceMetricsProps> = ({
  vehicle,
  formatCurrency,
  formatPercentage,
  getPerformanceColor
}) => (
  <>
    <View style={styles.performanceRow}>
      <View style={styles.performanceMetric}>
        <Text style={styles.performanceLabel}>Occupancy Rate</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min(vehicle.occupancyRate, 100)}%`,
                backgroundColor: getPerformanceColor(vehicle.occupancyRate, 'occupancy')
              }
            ]} 
          />
        </View>
        <Text style={[styles.performanceValue, { color: getPerformanceColor(vehicle.occupancyRate, 'occupancy') }]}>
          {formatPercentage(vehicle.occupancyRate)}
        </Text>
      </View>

      <View style={styles.performanceMetric}>
        <Text style={styles.performanceLabel}>Condition Rating</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${(vehicle.conditionRating / 5) * 100}%`,
                backgroundColor: getPerformanceColor(vehicle.conditionRating, 'condition')
              }
            ]} 
          />
        </View>
        <Text style={[styles.performanceValue, { color: getPerformanceColor(vehicle.conditionRating, 'condition') }]}>
          {vehicle.conditionRating.toFixed(1)}/5
        </Text>
      </View>
    </View>

    <View style={styles.recentPerformance}>
      <Text style={styles.recentTitle}>Last 30 Days</Text>
      <View style={styles.recentMetrics}>
        <Text style={styles.recentMetric}>
          {vehicle.recentBookings} bookings • {formatCurrency(vehicle.recentRevenue)}
        </Text>
        {vehicle.maintenanceInfo.lastMaintenance && (
          <Text style={styles.maintenanceInfo}>
            Last maintenance: {new Date(vehicle.maintenanceInfo.lastMaintenance).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  </>
);

const styles = StyleSheet.create({
  performanceRow: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  performanceMetric: {
    gap: spacing.xs,
  },
  performanceLabel: {
    ...typography.body,
    color: colors.darkGrey,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.offWhite,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceValue: {
    ...typography.body,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  recentPerformance: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.offWhite,
  },
  recentTitle: {
    ...typography.subheading,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  recentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentMetric: {
    ...typography.body,
    color: colors.darkGrey,
  },
  maintenanceInfo: {
    ...typography.body,
    fontSize: 12,
    color: colors.lightGrey,
  },
});