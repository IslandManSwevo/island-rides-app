import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { AppHeader } from '../components/AppHeader';

const { width } = Dimensions.get('window');

interface DashboardOverview {
  totalVehicles: number;
  activeVehicles: number;
  grossRevenue: number;
  netRevenue: number;
  totalBookings: number;
  pendingBookings: number;
  averageRating: number;
  totalReviews: number;
  occupancyRate: number;
  newBookingsThisWeek: number;
  newReviewsThisWeek: number;
}

interface RevenueData {
  dailyData: Array<{
    date: string;
    bookings: number;
    grossRevenue: number;
    netRevenue: number;
    platformFees: number;
  }>;
  vehicleBreakdown: Array<{
    id: number;
    make: string;
    model: string;
    year: number;
    bookings: number;
    grossRevenue: number;
    netRevenue: number;
    avgBookingValue: number;
  }>;
  summary: {
    totalGross: number;
    totalNet: number;
    totalFees: number;
    avgDailyRevenue: number;
  };
}

interface Goal {
  id: number;
  goalType: string;
  targetValue: number;
  currentValue: number;
  targetPeriod: string;
  progressPercentage: number;
  status: string;
}

interface OwnerDashboardScreenProps {
  navigation: any;
}

export const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('30');
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalType: 'monthly_revenue',
    targetValue: '',
    targetPeriod: 'monthly',
  });

  const timeframeOptions = [
    { label: '7 Days', value: '7' },
    { label: '30 Days', value: '30' },
    { label: '90 Days', value: '90' },
    { label: '1 Year', value: '365' },
  ];

  const goalTypes = [
    { label: 'Monthly Revenue', value: 'monthly_revenue' },
    { label: 'Occupancy Rate', value: 'occupancy_rate' },
    { label: 'Average Rating', value: 'rating_target' },
    { label: 'Booking Count', value: 'booking_count' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.get(`/owner/dashboard?timeframe=${timeframe}`);
      
      if (response.success) {
        setOverview(response.data.overview);
        setRevenueData(response.data.revenue);
        setGoals(response.data.goals || []);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      notificationService.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [timeframe]);

  const handleCreateGoal = async () => {
    try {
      if (!newGoal.targetValue) {
        Alert.alert('Error', 'Please enter a target value');
        return;
      }

      const goalData = {
        goal_type: newGoal.goalType,
        target_value: parseFloat(newGoal.targetValue),
        target_period: newGoal.targetPeriod,
      };

      const response = await apiService.post('/owner/goals', goalData);
      
      if (response.success) {
        setGoals([...goals, response.data]);
        setShowGoalModal(false);
        setNewGoal({
          goalType: 'monthly_revenue',
          targetValue: '',
          targetPeriod: 'monthly',
        });
        notificationService.success('Goal created successfully');
      } else {
        throw new Error('Failed to create goal');
      }
    } catch (error) {
      console.error('Create goal error:', error);
      notificationService.error('Failed to create goal');
    }
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

  const getGoalTypeLabel = (type: string) => {
    const goal = goalTypes.find(g => g.value === type);
    return goal?.label || type;
  };

  const renderMetricCard = (title: string, value: string, icon: string, color: string, subtitle?: string) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderRevenueChart = () => {
    if (!revenueData?.dailyData || revenueData.dailyData.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No revenue data available</Text>
        </View>
      );
    }

    const maxRevenue = Math.max(...revenueData.dailyData.map(d => d.grossRevenue));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Revenue Trend</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chart}>
            {revenueData.dailyData.slice(-14).map((data, index) => {
              const height = maxRevenue > 0 ? (data.grossRevenue / maxRevenue) * 100 : 0;
              return (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.chartBarContainer}>
                    <View 
                      style={[
                        styles.chartBarFill, 
                        { height: `${height}%`, backgroundColor: colors.primary }
                      ]} 
                    />
                  </View>
                  <Text style={styles.chartBarLabel}>
                    {new Date(data.date).getDate()}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderGoalProgress = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Goals & Targets</Text>
        <TouchableOpacity onPress={() => setShowGoalModal(true)}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="target-outline" size={48} color={colors.lightGrey} />
          <Text style={styles.emptyStateText}>No goals set</Text>
          <TouchableOpacity 
            style={styles.createGoalButton}
            onPress={() => setShowGoalModal(true)}
          >
            <Text style={styles.createGoalButtonText}>Set Your First Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        goals.map((goal, index) => (
          <View key={index} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalType}>{getGoalTypeLabel(goal.goalType)}</Text>
              <Text style={styles.goalProgress}>
                {formatPercentage(goal.progressPercentage)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min(goal.progressPercentage, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.goalTarget}>
              Target: {goal.goalType.includes('revenue') ? formatCurrency(goal.targetValue) : goal.targetValue}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderTopVehicles = () => {
    if (!revenueData?.vehicleBreakdown || revenueData.vehicleBreakdown.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performing Vehicles</Text>
        {revenueData.vehicleBreakdown.slice(0, 3).map((vehicle, index) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text style={styles.vehicleStats}>
                {vehicle.bookings} bookings • {formatCurrency(vehicle.grossRevenue)}
              </Text>
            </View>
            <View style={styles.vehicleRank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderGoalModal = () => (
    <Modal visible={showGoalModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Create New Goal</Text>
          
          <Text style={styles.inputLabel}>Goal Type</Text>
          <View style={styles.pickerContainer}>
            {goalTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.pickerOption,
                  newGoal.goalType === type.value && styles.pickerOptionSelected
                ]}
                onPress={() => setNewGoal({ ...newGoal, goalType: type.value })}
              >
                <Text style={[
                  styles.pickerOptionText,
                  newGoal.goalType === type.value && styles.pickerOptionTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Target Value</Text>
          <TextInput
            style={styles.input}
            value={newGoal.targetValue}
            onChangeText={(text) => setNewGoal({ ...newGoal, targetValue: text })}
            placeholder="Enter target value"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Time Period</Text>
          <View style={styles.pickerContainer}>
            {['monthly', 'quarterly', 'yearly'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.pickerOption,
                  newGoal.targetPeriod === period && styles.pickerOptionSelected
                ]}
                onPress={() => setNewGoal({ ...newGoal, targetPeriod: period })}
              >
                <Text style={[
                  styles.pickerOptionText,
                  newGoal.targetPeriod === period && styles.pickerOptionTextSelected
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowGoalModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateGoal}
            >
              <Text style={styles.createButtonText}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !overview) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Owner Dashboard" navigation={navigation} />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Timeframe Selector */}
        <View style={styles.timeframeSelector}>
          {timeframeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeframeOption,
                timeframe === option.value && styles.timeframeOptionActive
              ]}
              onPress={() => setTimeframe(option.value)}
            >
              <Text style={[
                styles.timeframeOptionText,
                timeframe === option.value && styles.timeframeOptionTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        {overview && (
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Revenue',
              formatCurrency(overview.grossRevenue),
              'cash-outline',
              colors.success,
              `Net: ${formatCurrency(overview.netRevenue)}`
            )}
            {renderMetricCard(
              'Active Vehicles',
              `${overview.activeVehicles}`,
              'car-outline',
              colors.primary,
              `of ${overview.totalVehicles} total`
            )}
            {renderMetricCard(
              'Total Bookings',
              `${overview.totalBookings}`,
              'calendar-outline',
              colors.warning,
              `${overview.pendingBookings} pending`
            )}
            {renderMetricCard(
              'Occupancy Rate',
              formatPercentage(overview.occupancyRate),
              'speedometer-outline',
              colors.info
            )}
            {renderMetricCard(
              'Average Rating',
              `${overview.averageRating.toFixed(1)}`,
              'star-outline',
              colors.success,
              `${overview.totalReviews} reviews`
            )}
            {renderMetricCard(
              'This Week',
              `${overview.newBookingsThisWeek}`,
              'trending-up-outline',
              colors.primary,
              'new bookings'
            )}
          </View>
        )}

        {/* Revenue Chart */}
        {renderRevenueChart()}

        {/* Goals Progress */}
        {renderGoalProgress()}

        {/* Top Vehicles */}
        {renderTopVehicles()}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('VehiclePerformance')}
            >
              <Ionicons name="analytics-outline" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Vehicle Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('FinancialReports')}
            >
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Financial Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('FleetManagement')}
            >
              <Ionicons name="car-sport-outline" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Fleet Management</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {renderGoalModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  timeframeSelector: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  timeframeOption: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  timeframeOptionActive: {
    backgroundColor: colors.primary,
  },
  timeframeOptionText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  timeframeOptionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  metricsGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metricTitle: {
    ...typography.caption,
    color: colors.darkGrey,
    textTransform: 'uppercase',
  },
  metricValue: {
    ...typography.heading1,
    fontSize: 24,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  metricSubtitle: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading2,
    color: colors.black,
  },
  chartContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    ...typography.heading3,
    color: colors.black,
    marginBottom: spacing.md,
  },
  noDataText: {
    ...typography.body,
    color: colors.lightGrey,
    textAlign: 'center',
    padding: spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: spacing.xs,
  },
  chartBar: {
    alignItems: 'center',
    width: 20,
  },
  chartBarContainer: {
    height: 100,
    width: 16,
    backgroundColor: colors.offWhite,
    borderRadius: 2,
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  chartBarLabel: {
    ...typography.caption,
    color: colors.lightGrey,
    marginTop: spacing.xs,
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGrey,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  createGoalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  createGoalButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalType: {
    ...typography.body,
    fontWeight: '600',
    color: colors.black,
  },
  goalProgress: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.offWhite,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  goalTarget: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  vehicleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  vehicleStats: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  vehicleRank: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    ...typography.body,
    color: colors.black,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.heading2,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.darkGrey,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: spacing.lg,
  },
  pickerOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.offWhite,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary,
  },
  pickerOptionText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  pickerOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGrey,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  createButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  createButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
}); 