import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { AppHeader } from '../components/AppHeader';
import { apiService } from '../services/apiService';
import { colors, typography, spacing } from '../styles/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ROUTES } from '../navigation/routes';

const screenWidth = Dimensions.get('window').width;

type HostDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.HOST_DASHBOARD>;

interface HostDashboardScreenProps {
  navigation: HostDashboardScreenNavigationProp;
}

interface EarningsOverTime {
  month: string;
  netRevenue: number;
  totalBookings: number;
}

interface TopPerformingVehicle {
  id: number;
  make: string;
  model: string;
  revenue: number;
  bookings: number;
}

interface ProDashboardData {
  earningsOverTime: EarningsOverTime[];
  topPerformingVehicles: TopPerformingVehicle[];
  totalRevenue: number;
  totalBookings: number;
}

interface DashboardResponse {
  success: boolean;
  data: Record<string, unknown>;
}

interface ProDashboardResponse {
  success: boolean;
  data: ProDashboardData;
}

interface HostBooking {
  id: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  renter: {
    id: number;
    firstName: string;
    lastName: string;
  };
  vehicle: {
    id: number;
    make: string;
    model: string;
    year: number;
  };
}

interface HostDashboardData {
  totalEarnings: number;
  upcomingBookings: HostBooking[];
  recentBookings: HostBooking[];
}

export const HostDashboardScreen = ({ navigation }: HostDashboardScreenProps) => {
  const [activeTab, setActiveTab] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<HostDashboardData | null>(null);
  const [proData, setProData] = useState<any>(null);
  const [qualifiesForPro, setQualifiesForPro] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      const response = await apiService.get<DashboardResponse>('/api/host/dashboard');
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error: unknown) {
      console.error('Dashboard error:', String(error));
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProData = useCallback(async () => {
    try {
      const response = await apiService.get<ProDashboardResponse>('/api/host/dashboard/pro');
      if (response.success) {
        setProData(response.data);
        setQualifiesForPro(true);
      }
    } catch (error: unknown) {
      const err = error as Error & { response?: { status: number } };
      if (err.response?.status === 403) {
        setQualifiesForPro(false);
      } else {
        console.error('Pro dashboard fetch error:', String(error));
      }
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadProData();
  }, [loadDashboardData, loadProData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData(false);
    if (qualifiesForPro) {
      await loadProData();
    }
    setRefreshing(false);
  }, [loadDashboardData, loadProData, qualifiesForPro]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'completed':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const renderBookingItem = (booking: HostBooking, isUpcoming: boolean = false) => (
    <View key={booking.id} style={styles.bookingItem}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingRenter}>
          {booking.renter.firstName} {booking.renter.lastName}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.bookingVehicle}>
        {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
      </Text>
      
      <View style={styles.bookingDetails}>
        <View style={styles.bookingDates}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.bookingDatesText}>
            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
          </Text>
        </View>
        
        <Text style={styles.bookingAmount}>
          {formatCurrency(booking.totalAmount)}
        </Text>
      </View>
    </View>
  );

  const renderTabBar = () => {
    if (!qualifiesForPro) return null;
    
    return (
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'standard' && styles.activeTab]}
          onPress={() => setActiveTab('standard')}
        >
          <Text style={[styles.tabText, activeTab === 'standard' && styles.activeTabText]}>
            Standard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pro' && styles.activeTab]}
          onPress={() => setActiveTab('pro')}
        >
          <Text style={[styles.tabText, activeTab === 'pro' && styles.activeTabText]}>
            Pro
          </Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEarningsChart = () => {
    if (!proData?.earningsOverTime?.length) return null;
    
    const chartData = {
      labels: proData.earningsOverTime.slice(0, 6).reverse().map((item: EarningsOverTime) => {
        const date = new Date(item.month);
        return date.toLocaleDateString('en-US', { month: 'short' });
      }),
      datasets: [{
        data: proData.earningsOverTime.slice(0, 6).reverse().map((item: EarningsOverTime) => item.netRevenue),
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 3
      }]
    };
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Earnings Over Time</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#2E7D32'
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderKeyMetrics = () => {
    if (!proData?.keyMetrics) return null;
    
    const metrics = [
      { label: 'Total Bookings', value: proData.keyMetrics.totalBookings, icon: 'calendar' },
      { label: 'Booking Rate', value: `${proData.keyMetrics.bookingRate}%`, icon: 'trending-up' },
      { label: 'Avg Trip Duration', value: `${proData.keyMetrics.avgTripDuration.toFixed(1)} days`, icon: 'time' },
      { label: 'Avg Booking Value', value: formatCurrency(proData.keyMetrics.avgBookingValue), icon: 'cash' },
      { label: 'Average Rating', value: `${proData.keyMetrics.avgRating.toFixed(1)} ⭐`, icon: 'star' },
      { label: 'Total Reviews', value: proData.keyMetrics.totalReviews, icon: 'chatbubble' }
    ];
    
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Key Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <Ionicons name={metric.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.primary} />
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTopVehicles = () => {
    if (!proData?.topPerformingVehicles?.length) return null;
    
    return (
      <View style={styles.topVehiclesContainer}>
        <Text style={styles.sectionTitle}>Top Performing Vehicles</Text>
        {proData.topPerformingVehicles.slice(0, 5).map((vehicle: TopPerformingVehicle, index: number) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <View style={styles.vehicleRank}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text style={styles.vehicleStats}>
                {vehicle.bookings} bookings • {formatCurrency(vehicle.revenue)} revenue
              </Text>
              <Text style={styles.vehicleRating}>
                ⭐ {vehicle.avg_rating.toFixed(1)} • ${vehicle.daily_rate}/day
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Host Dashboard" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Host Dashboard" navigation={navigation} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadDashboardData()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Host Dashboard" navigation={navigation} />
      {renderTabBar()}
      
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'standard' ? (
          <>
            {/* Total Earnings Card */}
            <View style={styles.earningsCard}>
              <View style={styles.earningsHeader}>
                <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                <Text style={styles.earningsTitle}>Total Lifetime Earnings</Text>
              </View>
              <Text style={styles.earningsAmount}>
                {formatCurrency(dashboardData?.totalEarnings || 0)}
              </Text>
            </View>

            {/* Upcoming Bookings Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
              </View>
              
              {dashboardData?.upcomingBookings && dashboardData.upcomingBookings.length > 0 ? (
                <View style={styles.bookingsList}>
                  {dashboardData.upcomingBookings.map(booking => renderBookingItem(booking, true))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>No upcoming bookings</Text>
                </View>
              )}
            </View>

            {/* Recent Bookings Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Recent Bookings</Text>
              </View>
              
              {dashboardData?.recentBookings && dashboardData.recentBookings.length > 0 ? (
                <View style={styles.bookingsList}>
                  {dashboardData.recentBookings.map(booking => renderBookingItem(booking))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={32} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>No recent bookings</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            {/* Pro Mode Content */}
            {renderEarningsChart()}
            {renderKeyMetrics()}
            {renderTopVehicles()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center' as const,
    marginVertical: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  // Tab Bar Styles
  tabBar: {
    flexDirection: 'row' as const,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    position: 'relative' as const,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
  },
  proBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  proBadgeText: {
    ...typography.caption,
    fontWeight: 'bold' as const,
    color: colors.white,
  },
  // Chart Styles
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: 16,
  },
  // Metrics Styles
  metricsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  metricCard: {
    width: '48%' as any,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  metricValue: {
    ...typography.heading3,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  // Top Vehicles Styles
  topVehiclesContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  vehicleRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  rankText: {
    ...typography.body,
    fontWeight: 'bold' as const,
    color: colors.white,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...typography.subheading,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  vehicleStats: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  vehicleRating: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  earningsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  earningsTitle: {
    ...typography.heading3,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  earningsAmount: {
    ...typography.heading1,
    color: colors.primary,
    fontWeight: 'bold' as const,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  bookingsList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookingHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  bookingRenter: {
      ...typography.subheading,
      color: colors.text,
    },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold' as const,
  },
  bookingVehicle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bookingDetails: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  bookingDates: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  bookingDatesText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  bookingAmount: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: 'bold' as const,
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center' as const,
  },
};