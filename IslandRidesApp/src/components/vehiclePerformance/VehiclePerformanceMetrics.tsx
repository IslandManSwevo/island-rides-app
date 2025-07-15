import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../styles/Theme';
import { formatDate } from '../../utils/formatters';

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
  /** Maximum condition rating scale (default: 5) */
  maxConditionRating?: number;
}

export const VehiclePerformanceMetrics: React.FC<VehiclePerformanceMetricsProps> = ({
  vehicle,
  formatCurrency,
  formatPercentage,
  getPerformanceColor,
  maxConditionRating = 5
}) => {
  // Validate occupancy rate and log warning if it exceeds 100%
  if (vehicle.occupancyRate > 100) {
    console.warn(
      `Data validation warning: Vehicle occupancy rate exceeds 100%. Actual value: ${vehicle.occupancyRate}%. This may indicate a data integrity issue.`
    );
  }

  return (
    <>
      <View style={styles.performanceRow}>
        <View
        style={styles.performanceMetric}
        accessibilityLabel="Occupancy Rate Metric"
      >
          <Text style={styles.performanceLabel}>Occupancy Rate</Text>
          <View
            style={styles.progressBar}
            accessibilityRole="progressbar"
            accessibilityLabel={`Occupancy Rate: ${formatPercentage(vehicle.occupancyRate)}`}
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.min(vehicle.occupancyRate, 100),
            }}
          >
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

      <View
        style={styles.performanceMetric}
        accessibilityLabel="Condition Rating Metric"
      >
        <Text style={styles.performanceLabel}>Condition Rating</Text>
        <View
          style={styles.progressBar}
          accessibilityRole="progressbar"
          accessibilityLabel={`Condition Rating: ${vehicle.conditionRating.toFixed(1)} out of ${maxConditionRating}`}
          accessibilityValue={{
            min: 0,
            max: maxConditionRating,
            now: vehicle.conditionRating,
          }}
        >
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${Math.min((vehicle.conditionRating / maxConditionRating) * 100, 100)}%`,
                backgroundColor: getPerformanceColor(vehicle.conditionRating, 'condition')
              }
            ]} 
          />
        </View>
        <Text style={[styles.performanceValue, { color: getPerformanceColor(vehicle.conditionRating, 'condition') }]}>
          {vehicle.conditionRating.toFixed(1)}/{maxConditionRating}
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
            Last maintenance: {formatDate(vehicle.maintenanceInfo.lastMaintenance)}
          </Text>
        )}
      </View>
    </View>
  </>
  );
};

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