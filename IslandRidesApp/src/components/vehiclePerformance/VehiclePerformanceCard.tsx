import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { RootStackParamList } from '../../navigation/routes';

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

interface VehiclePerformanceCardProps {
  vehicle: VehiclePerformance;
  onPress: (vehicle: VehiclePerformance) => void;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
  getPerformanceColor: (value: number, type: string) => string;
  getVerificationStatusColor: (status: string) => string;
  getVerificationStatusIcon: (status: string) => any;
  navigation: NavigationProp<RootStackParamList>;
}

export const VehiclePerformanceCard: React.FC<VehiclePerformanceCardProps> = ({ 
  vehicle, 
  onPress, 
  formatCurrency, 
  formatPercentage, 
  getPerformanceColor, 
  getVerificationStatusColor, 
  getVerificationStatusIcon,
  navigation
}) => (
  <TouchableOpacity 
    key={vehicle.id} 
    style={styles.vehicleCard}
    onPress={() => onPress(vehicle)}
  >
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

    <View style={styles.cardActions}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate('VehicleConditionTracker', { vehicleId: vehicle.id })}
      >
        <Ionicons name="build-outline" size={16} color={colors.primary} />
        <Text style={styles.actionButtonText}>Maintenance</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate('VehiclePhotoUpload', { vehicleId: vehicle.id })}
      >
        <Ionicons name="camera-outline" size={16} color={colors.primary} />
        <Text style={styles.actionButtonText}>Photos</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate('VehicleAvailability', { vehicleId: vehicle.id })}
      >
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        <Text style={styles.actionButtonText}>Calendar</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.offWhite,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});