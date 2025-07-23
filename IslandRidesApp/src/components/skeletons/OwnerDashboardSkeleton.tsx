import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface OwnerDashboardSkeletonProps {
  showTimeframe?: boolean;
}

export const OwnerDashboardSkeleton: React.FC<OwnerDashboardSkeletonProps> = ({
  showTimeframe = true,
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Timeframe Selector */}
      {showTimeframe && (
        <View style={styles.timeframeContainer}>
          <View style={styles.timeframeRow}>
            {[1, 2, 3, 4].map((index) => (
              <SkeletonBase
                key={index}
                width={70}
                height={32}
                borderRadius={16}
                style={styles.timeframeItem}
              />
            ))}
          </View>
        </View>
      )}

      {/* Dashboard Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsGrid}>
          {[1, 2, 3, 4].map((index) => (
            <View key={index} style={styles.metricCard}>
              <SkeletonBase width={40} height={40} borderRadius={20} style={styles.metricIcon} />
              <SkeletonBase width={60} height={24} style={styles.metricValue} />
              <SkeletonBase width={80} height={16} style={styles.metricLabel} />
            </View>
          ))}
        </View>
      </View>

      {/* Revenue Chart */}
      <View style={styles.chartContainer}>
        <SkeletonBase width={120} height={20} style={styles.chartTitle} />
        <SkeletonBase width="100%" height={200} style={styles.chart} />
      </View>

      {/* Goals Section */}
      <View style={styles.goalsContainer}>
        <View style={styles.sectionHeader}>
          <SkeletonBase width={80} height={20} />
          <SkeletonBase width={60} height={16} />
        </View>
        {[1, 2].map((index) => (
          <View key={index} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <SkeletonBase width={100} height={18} />
              <SkeletonBase width={40} height={16} />
            </View>
            <SkeletonBase width="100%" height={8} borderRadius={4} style={styles.goalProgress} />
            <View style={styles.goalStats}>
              <SkeletonBase width={60} height={14} />
              <SkeletonBase width={80} height={14} />
            </View>
          </View>
        ))}
      </View>

      {/* Top Vehicles Section */}
      <View style={styles.vehiclesContainer}>
        <SkeletonBase width={120} height={20} style={styles.sectionTitle} />
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.vehicleCard}>
            <SkeletonBase width={60} height={40} borderRadius={8} />
            <View style={styles.vehicleInfo}>
              <SkeletonBase width={120} height={16} />
              <SkeletonBase width={80} height={14} style={styles.vehicleDetail} />
            </View>
            <View style={styles.vehicleStats}>
              <SkeletonBase width={50} height={16} />
              <SkeletonBase width={40} height={14} />
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <SkeletonBase width={100} height={20} style={styles.sectionTitle} />
        <View style={styles.actionsGrid}>
          {[1, 2, 3, 4].map((index) => (
            <View key={index} style={styles.actionCard}>
              <SkeletonBase width={32} height={32} borderRadius={16} />
              <SkeletonBase width={60} height={14} style={styles.actionLabel} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  timeframeContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeframeItem: {
    marginHorizontal: spacing.xs,
  },
  metricsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  metricIcon: {
    marginBottom: spacing.sm,
  },
  metricValue: {
    marginBottom: spacing.xs,
  },
  metricLabel: {},
  chartContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  chartTitle: {
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: borderRadius.md,
  },
  goalsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalCard: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalProgress: {
    marginBottom: spacing.sm,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehiclesContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  vehicleDetail: {
    marginTop: spacing.xs,
  },
  vehicleStats: {
    alignItems: 'flex-end',
  },
  actionsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  actionLabel: {
    marginTop: spacing.sm,
  },
});