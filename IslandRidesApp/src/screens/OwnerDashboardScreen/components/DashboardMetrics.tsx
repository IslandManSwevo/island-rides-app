import React from 'react';
import { View } from 'react-native';
import { styles } from '../styles';
import { colors } from '../../../styles/theme';
import { DashboardOverview } from '../types';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';
import MetricCard from './MetricCard';

interface Props {
  overview: DashboardOverview;
}

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
        value={`${overview.averageRating != null ? overview.averageRating.toFixed(1) : '0.0'}`}
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