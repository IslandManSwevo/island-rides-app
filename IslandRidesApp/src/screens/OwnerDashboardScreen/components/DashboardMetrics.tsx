import React from 'react';
import { View } from 'react-native';
import { styles } from '../styles';
import { colors } from '../../../styles/Theme';
import { DashboardOverview } from '../../../types';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';
import MetricCard from './MetricCard';

interface Props {
  overview: DashboardOverview;
}

const DashboardMetrics: React.FC<Props> = ({ overview }) => {
  const safeFormatCurrency = (value: number): string => {
    try {
      return formatCurrency(value);
    } catch (error) {
      console.warn('Error formatting currency:', error);
      return `$${value || 0}`;
    }
  };

  const safeFormatPercentage = (value: number): string => {
    try {
      return formatPercentage(value);
    } catch (error) {
      console.warn('Error formatting percentage:', error);
      return `${value || 0}%`;
    }
  };

  return (
    <View style={styles.metricsGrid}>
      <MetricCard
        title="Total Revenue"
        value={safeFormatCurrency(overview.grossRevenue)}
        icon="cash-outline"
        color={colors.success}
        subtitle={`Net: ${safeFormatCurrency(overview.netRevenue)}`}
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
        value={safeFormatPercentage(overview.occupancyRate)}
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