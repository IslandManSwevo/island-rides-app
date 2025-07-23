import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface VehiclePerformanceSkeletonProps {
  vehicleCount?: number;
}

export const VehiclePerformanceSkeleton: React.FC<VehiclePerformanceSkeletonProps> = ({
  vehicleCount = 4,
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryGrid}>
          {[1, 2, 3, 4].map((index) => (
            <View key={index} style={styles.summaryCard}>
              <SkeletonBase width={32} height={32} borderRadius={16} style={styles.summaryIcon} />
              <SkeletonBase width={50} height={20} style={styles.summaryValue} />
              <SkeletonBase width={70} height={14} style={styles.summaryLabel} />
            </View>
          ))}
        </View>
      </View>

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <View style={styles.sortRow}>
          <SkeletonBase width={80} height={16} />
          <View style={styles.sortControls}>
            <SkeletonBase width={100} height={32} borderRadius={16} />
            <SkeletonBase width={40} height={32} borderRadius={16} style={styles.sortOrder} />
          </View>
        </View>
      </View>

      {/* Vehicle Performance Cards */}
      <View style={styles.vehiclesContainer}>
        {Array.from({ length: vehicleCount }).map((_, index) => (
          <View key={index} style={styles.vehicleCard}>
            {/* Vehicle Header */}
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleInfo}>
                <SkeletonBase width={120} height={18} />
                <SkeletonBase width={80} height={14} style={styles.vehicleLocation} />
              </View>
              <View style={styles.vehicleStatus}>
                <SkeletonBase width={20} height={20} borderRadius={10} />
                <SkeletonBase width={60} height={14} style={styles.statusText} />
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.metricsGrid}>
              {[1, 2, 3, 4].map((metricIndex) => (
                <View key={metricIndex} style={styles.metricItem}>
                  <SkeletonBase width={40} height={16} />
                  <SkeletonBase width={60} height={12} style={styles.metricLabel} />
                </View>
              ))}
            </View>

            {/* Rating and Reviews */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingRow}>
                <SkeletonBase width={80} height={16} />
                <SkeletonBase width={60} height={14} />
              </View>
              <SkeletonBase width="100%" height={8} borderRadius={4} style={styles.ratingBar} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <SkeletonBase width={80} height={32} borderRadius={16} />
              <SkeletonBase width={100} height={32} borderRadius={16} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  summaryIcon: {
    marginBottom: spacing.sm,
  },
  summaryValue: {
    marginBottom: spacing.xs,
  },
  summaryLabel: {},
  sortContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortOrder: {
    marginLeft: spacing.sm,
  },
  vehiclesContainer: {
    padding: spacing.md,
  },
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLocation: {
    marginTop: spacing.xs,
  },
  vehicleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    marginTop: spacing.xs,
  },
  ratingSection: {
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingBar: {},
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});