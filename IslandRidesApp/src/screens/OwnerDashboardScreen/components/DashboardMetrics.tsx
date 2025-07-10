import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { colors } from '../../../styles/theme';
import { DashboardOverview } from '../types';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

interface Props {
  overview: DashboardOverview;
}

const MetricCard: React.FC<{ title: string; value: string; icon: any; color: string; subtitle?: string }> = ({ title, value, icon, color, subtitle }) => (
  <View style={[styles.metricCard, { borderLeftColor: color }]}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
  </View>
);

const DashboardMetrics: React.FC<Props> = ({ overview }) => {
  return (
    <View style={styles.metricsGrid}>
      <MetricCard
        title="Total Revenue"
        value={formatCurrency(overview.grossRevenue)}
        icon="cash-outline"
        color={colors.success}
        subtitle={`Net: ${formatCurrency(overview.netRevenue)}`}
      />
      <MetricCard
        title="Active Vehicles"
        value={`${overview.activeVehicles}`}
        icon="car-outline"
        color={colors.primary}
        subtitle={`of ${overview.totalVehicles} total`}
      />
      <MetricCard
        title="Total Bookings"
        value={`${overview.totalBookings}`}
        icon="calendar-outline"
        color={colors.warning}
        subtitle={`${overview.pendingBookings} pending`}
      />
      <MetricCard
        title="Occupancy Rate"
        value={formatPercentage(overview.occupancyRate)}
        icon="speedometer-outline"
        color={colors.info}
      />
      <MetricCard
        title="Average Rating"
        value={`${overview.averageRating.toFixed(1)}`}
        icon="star-outline"
        color={colors.success}
        subtitle={`${overview.totalReviews} reviews`}
      />
      <MetricCard
        title="This Week"
        value={`${overview.newBookingsThisWeek}`}
        icon="trending-up-outline"
        color={colors.primary}
        subtitle="new bookings"
      />
    </View>
  );
};

export default DashboardMetrics;