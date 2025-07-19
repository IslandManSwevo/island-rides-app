import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { StandardCard } from '../templates/StandardCard';
import { StandardButton } from '../templates/StandardButton';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';
import hostProfileService from '../../services/hostProfileService';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorMessage } from '../ErrorMessage';

interface HostDashboardProps {
  navigation: NavigationProp<any>;
}

interface HostProfile {
  user_id: number;
  first_name: string;
  last_name: string;
  business_name: string;
  host_status: string;
  host_rating: number;
  total_host_reviews: number;
  response_rate: number;
  acceptance_rate: number;
  superhost_status: boolean;
  profile_completion_percentage: number;
  onboarding_completed: boolean;
  onboarding_step: string;
  total_earnings: number;
  total_bookings: number;
  total_guests_served: number;
}

interface DashboardStats {
  totalEarnings: number;
  totalBookings: number;
  totalGuests: number;
  responseRate: number;
  acceptanceRate: number;
  averageRating: number;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ navigation }) => {
  const { getMetrics, resetMetrics } = usePerformanceMonitoring('HostDashboard', {
    slowRenderThreshold: 16,
    enableLogging: __DEV__,
    trackMemory: true,
  });

  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [hostProfile, analytics] = await Promise.all([
        hostProfileService.getHostProfile(),
        hostProfileService.getHostAnalytics('monthly')
      ]);

      setProfile(hostProfile);
      
      // Calculate stats from profile and analytics
      const dashboardStats: DashboardStats = {
        totalEarnings: hostProfile.total_earnings || 0,
        totalBookings: hostProfile.total_bookings || 0,
        totalGuests: hostProfile.total_guests_served || 0,
        responseRate: hostProfile.response_rate || 0,
        acceptanceRate: hostProfile.acceptance_rate || 0,
        averageRating: hostProfile.host_rating || 0
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleCompleteOnboarding = () => {
    navigation.navigate('HostOnboarding', { step: profile?.onboarding_step || 'welcome' });
  };

  const handleViewProfile = () => {
    navigation.navigate('HostProfile');
  };

  const handleViewAnalytics = () => {
    navigation.navigate('HostAnalytics');
  };

  const handleManageVehicles = () => {
    navigation.navigate('FleetManagement');
  };

  const handleViewNotifications = () => {
    navigation.navigate('HostNotifications');
  };

  const renderHostStatus = () => {
    if (!profile) return null;

    const statusColor = profile.host_status === 'active' ? colors.success : colors.warning;
    const statusText = profile.host_status === 'active' ? 'Active Host' : 'Inactive Host';

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <Text style={styles.statusText}>{statusText}</Text>
        {profile.superhost_status && (
          <View style={styles.superhostBadge}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.superhostText}>Superhost</Text>
          </View>
        )}
      </View>
    );
  };

  const renderOnboardingCard = () => {
    if (!profile || profile.onboarding_completed) return null;

    return (
      <StandardCard variant="outlined" margin="medium">
        <View style={styles.onboardingContainer}>
          <View style={styles.onboardingHeader}>
            <Ionicons name="rocket-outline" size={24} color={colors.primary} />
            <Text style={styles.onboardingTitle}>Complete Your Setup</Text>
          </View>
          <Text style={styles.onboardingDescription}>
            You're {profile.profile_completion_percentage}% complete. Finish your setup to start hosting!
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${profile.profile_completion_percentage}%` }
              ]} 
            />
          </View>
          <StandardButton
            title="Continue Setup"
            onPress={handleCompleteOnboarding}
            variant="primary"
            size="medium"
            style={styles.onboardingButton}
          />
        </View>
      </StandardCard>
    );
  };

  const renderStatsCards = () => {
    if (!stats) return null;

    const statCards = [
      {
        title: 'Total Earnings',
        value: `$${stats.totalEarnings.toLocaleString()}`,
        icon: 'wallet-outline',
        color: colors.success
      },
      {
        title: 'Total Bookings',
        value: stats.totalBookings.toString(),
        icon: 'calendar-outline',
        color: colors.primary
      },
      {
        title: 'Guests Served',
        value: stats.totalGuests.toString(),
        icon: 'people-outline',
        color: colors.info
      },
      {
        title: 'Response Rate',
        value: `${stats.responseRate}%`,
        icon: 'chatbubble-outline',
        color: colors.warning
      }
    ];

    return (
      <View style={styles.statsContainer}>
        {statCards.map((stat, index) => (
          <StandardCard key={index} variant="elevated" margin="small">
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          </StandardCard>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      {
        title: 'View Profile',
        icon: 'person-outline',
        onPress: handleViewProfile,
        color: colors.primary
      },
      {
        title: 'Analytics',
        icon: 'analytics-outline',
        onPress: handleViewAnalytics,
        color: colors.info
      },
      {
        title: 'Manage Vehicles',
        icon: 'car-outline',
        onPress: handleManageVehicles,
        color: colors.success
      },
      {
        title: 'Notifications',
        icon: 'notifications-outline',
        onPress: handleViewNotifications,
        color: colors.warning
      }
    ];

    return (
      <StandardCard variant="default" margin="medium">
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={20} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </StandardCard>
    );
  };

  const renderWelcomeHeader = () => {
    if (!profile) return null;

    return (
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeTitle}>
          Welcome back, {profile.first_name}!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          {profile.business_name || 'Your KeyLo hosting dashboard'}
        </Text>
        {renderHostStatus()}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ErrorMessage message={error} onRetry={loadDashboardData} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {renderWelcomeHeader()}
      {renderOnboardingCard()}
      {renderStatsCards()}
      {renderQuickActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  welcomeHeader: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  welcomeTitle: {
    ...typography.heading2,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.white + 'CC',
    marginBottom: spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  superhostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md,
  },
  superhostText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  onboardingContainer: {
    padding: spacing.md,
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  onboardingTitle: {
    ...typography.heading4,
    color: colors.primary,
    marginLeft: spacing.md,
  },
  onboardingDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  onboardingButton: {
    alignSelf: 'flex-start',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  statCard: {
    alignItems: 'center',
    padding: spacing.md,
    minWidth: 100,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.heading4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  actionButton: {
    width: '50%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    ...typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
  },
});