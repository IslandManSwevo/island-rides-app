import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

interface VehiclePerformance {
  id: number;
  make: string;
  model: string;
  year: number;
  dailyRate: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  occupancyRate: number;
  recentBookings: number;
  recentRevenue: number;
  maintenanceInfo: {
    maintenanceCount: number;
    lastMaintenance: string | null;
  };
  available: boolean;
  verificationStatus: string;
  conditionRating: number;
}

interface VehicleSummaryCardsProps {
  vehicles: VehiclePerformance[];
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
  getPerformanceColor: (value: number, type: string) => string;
}

export const VehicleSummaryCards: React.FC<VehicleSummaryCardsProps> = ({ 
  vehicles,
  formatCurrency,
  formatPercentage,
  getPerformanceColor
}) => {
  if (vehicles.length === 0) return null;

  const totalRevenue = vehicles.reduce((sum, v) => sum + v.totalRevenue, 0);
  const totalBookings = vehicles.reduce((sum, v) => sum + v.totalBookings, 0);
  const avgOccupancy = vehicles.length > 0 ? vehicles.reduce((sum, v) => sum + v.occupancyRate, 0) / vehicles.length : 0;
  const avgRating = vehicles.length > 0 ? vehicles.reduce((sum, v) => sum + v.averageRating, 0) / vehicles.length : 0;

  return (
    <View style={styles.summaryCards}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
        <Text style={styles.summaryLabel}>Total Fleet Revenue</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{totalBookings}</Text>
        <Text style={styles.summaryLabel}>Total Bookings</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={[
          styles.summaryValue,
          { color: getPerformanceColor(avgOccupancy, 'occupancy') }
        ]}>
          {formatPercentage(avgOccupancy)}
        </Text>
        <Text style={styles.summaryLabel}>Avg Occupancy</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={[
          styles.summaryValue,
          { color: getPerformanceColor(avgRating, 'rating') }
        ]}>
          {avgRating.toFixed(1)}⭐
        </Text>
        <Text style={styles.summaryLabel}>Avg Rating</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryValue: {
    ...typography.heading2,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.lightGrey,
    textAlign: 'center',
  },
});