import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { AppHeader } from '../components/AppHeader';
import { VehicleCard } from '../components/VehicleCard';

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

interface VehiclePerformanceScreenProps {
  navigation: any;
}

export const VehiclePerformanceScreen: React.FC<VehiclePerformanceScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<VehiclePerformance[]>([]);
  const [sortBy, setSortBy] = useState('totalRevenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortOptions = [
    { label: 'Revenue', value: 'totalRevenue' },
    { label: 'Bookings', value: 'totalBookings' },
    { label: 'Rating', value: 'averageRating' },
    { label: 'Occupancy', value: 'occupancyRate' },
    { label: 'Recent Performance', value: 'recentRevenue' },
  ];

  useEffect(() => {
    loadVehiclePerformance();
  }, []);

  const loadVehiclePerformance = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.get('/owner/vehicles/performance');
      
      if (response.success) {
        setVehicles(response.data || []);
      } else {
        throw new Error('Failed to load vehicle performance data');
      }
    } catch (error) {
      console.error('Vehicle performance error:', error);
      notificationService.error('Failed to load vehicle performance data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVehiclePerformance();
    setRefreshing(false);
  }, []);

  const sortVehicles = (vehicles: VehiclePerformance[]) => {
    return [...vehicles].sort((a, b) => {
      let aValue = a[sortBy as keyof VehiclePerformance];
      let bValue = b[sortBy as keyof VehiclePerformance];

      // Handle null/undefined values
      if (aValue == null) aValue = 0;
      if (bValue == null) bValue = 0;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }
      
      return sortOrder === 'desc' 
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number, type: string) => {
    switch (type) {
      case 'rating':
        if (value >= 4.5) return colors.success;
        if (value >= 4.0) return colors.warning;
        return colors.error;
      case 'occupancy':
        if (value >= 70) return colors.success;
        if (value >= 50) return colors.warning;
        return colors.error;
      case 'condition':
        if (value >= 4.5) return colors.success;
        if (value >= 4.0) return colors.warning;
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      default:
        return colors.lightGrey;
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return 'checkmark-circle';
      case 'pending':
        return 'time-outline';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const handleVehiclePress = (vehicle: VehiclePerformance) => {
    navigation.navigate('VehicleDetail', { 
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        dailyRate: vehicle.dailyRate,
        available: vehicle.available,
        averageRating: vehicle.averageRating,
        totalReviews: vehicle.reviewCount,
        verificationStatus: vehicle.verificationStatus,
        conditionRating: vehicle.conditionRating,
      }
    });
  };

  const renderSortControls = () => (
    <View style={styles.sortControls}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortOption,
              sortBy === option.value && styles.sortOptionActive
            ]}
            onPress={() => {
              if (sortBy === option.value) {
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              } else {
                setSortBy(option.value);
                setSortOrder('desc');
              }
            }}
          >
            <Text style={[
              styles.sortOptionText,
              sortBy === option.value && styles.sortOptionTextActive
            ]}>
              {option.label}
            </Text>
            {sortBy === option.value && (
              <Ionicons 
                name={sortOrder === 'desc' ? 'chevron-down' : 'chevron-up'} 
                size={16} 
                color={colors.white} 
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderVehicleCard = (vehicle: VehiclePerformance) => (
    <TouchableOpacity 
      key={vehicle.id} 
      style={styles.vehicleCard}
      onPress={() => handleVehiclePress(vehicle)}
    >
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <View style={styles.statusRow}>
            <View style={[
              styles.availabilityBadge, 
              { backgroundColor: vehicle.available ? colors.success : colors.error }
            ]}>
              <Text style={styles.availabilityText}>
                {vehicle.available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
            <View style={styles.verificationBadge}>
              <Ionicons 
                name={getVerificationStatusIcon(vehicle.verificationStatus) as any} 
                size={12} 
                color={getVerificationStatusColor(vehicle.verificationStatus)} 
              />
              <Text style={[
                styles.verificationText,
                { color: getVerificationStatusColor(vehicle.verificationStatus) }
              ]}>
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
          <Text style={[
            styles.metricValue,
            { color: getPerformanceColor(vehicle.averageRating, 'rating') }
          ]}>
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
          <Text style={[
            styles.performanceValue,
            { color: getPerformanceColor(vehicle.occupancyRate, 'occupancy') }
          ]}>
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
          <Text style={[
            styles.performanceValue,
            { color: getPerformanceColor(vehicle.conditionRating, 'condition') }
          ]}>
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

  const renderSummaryCards = () => {
    if (vehicles.length === 0) return null;

    const totalRevenue = vehicles.reduce((sum, v) => sum + v.totalRevenue, 0);
    const totalBookings = vehicles.reduce((sum, v) => sum + v.totalBookings, 0);
    const avgOccupancy = vehicles.reduce((sum, v) => sum + v.occupancyRate, 0) / vehicles.length;
    const avgRating = vehicles.reduce((sum, v) => sum + v.averageRating, 0) / vehicles.length;

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading vehicle performance...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Vehicle Performance" navigation={navigation} showBackButton />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSummaryCards()}
        {renderSortControls()}

        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={colors.lightGrey} />
            <Text style={styles.emptyStateTitle}>No vehicles found</Text>
            <Text style={styles.emptyStateText}>
              Add your first vehicle to start tracking performance
            </Text>
          </View>
        ) : (
          <View style={styles.vehiclesList}>
            {sortVehicles(vehicles).map(renderVehicleCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
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
  sortControls: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  sortLabel: {
    ...typography.body,
    color: colors.darkGrey,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    ...typography.caption,
    color: colors.darkGrey,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: colors.white,
  },
  vehiclesList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
    ...typography.heading3,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  availabilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  availabilityText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verificationText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  dailyRate: {
    ...typography.heading3,
    color: colors.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.lightGrey,
    textAlign: 'center',
  },
  performanceRow: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  performanceMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  performanceLabel: {
    ...typography.caption,
    color: colors.darkGrey,
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.offWhite,
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceValue: {
    ...typography.caption,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  recentPerformance: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  recentTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.darkGrey,
    marginBottom: spacing.sm,
  },
  recentMetrics: {
    gap: spacing.xs,
  },
  recentMetric: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  maintenanceInfo: {
    ...typography.caption,
    color: colors.warning,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.offWhite,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.heading2,
    color: colors.darkGrey,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGrey,
    textAlign: 'center',
  },
}); 