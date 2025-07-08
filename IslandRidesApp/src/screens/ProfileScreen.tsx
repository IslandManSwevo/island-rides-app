import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileService } from '../services/profileService';
import { reviewPromptService } from '../services/reviewPromptService';
import { useAuth } from '../context/AuthContext';
import { ProfileData, ProfileBooking } from '../types';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { AppHeader } from '../components/AppHeader';
import { ROUTES } from '../navigation/routes';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setError(null);
      const data = await ProfileService.getProfile();
      setProfileData(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
      
      // Handle session expiration
      if (error instanceof Error && error.message.includes('Session expired')) {
        Alert.alert(
          'Session Expired',
          'Please log in again.',
          [{ text: 'OK', onPress: logout }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Profile editing will be available in a future update.');
  };

  const testReviewPrompts = async () => {
    try {
      // Get completed bookings and show some test prompts
      await reviewPromptService.checkForCompletedBookings();
      const stats = await reviewPromptService.getPromptStats();
      
      Alert.alert(
        'Review Prompts Test',
        `Prompt stats:\n• Total: ${stats.total}\n• Pending: ${stats.pending}\n• Sent: ${stats.sent}\n• Completed: ${stats.completed}\n• Completion Rate: ${stats.completionRate.toFixed(1)}%`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to test review prompts:', error);
      Alert.alert('Error', 'Failed to test review prompts');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'confirmed':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.lightGrey;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const renderBookingItem = ({ item }: { item: ProfileBooking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.vehicleText}>
          {item.vehicle ? `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}` : 'Vehicle Unavailable'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <Text style={styles.detailText}>
          📅 {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </Text>
        {item.vehicle && (
          <Text style={styles.detailText}>📍 {item.vehicle.location}</Text>
        )}
        <Text style={styles.detailText}>💰 {formatCurrency(item.totalAmount)}</Text>
      </View>

      {item.status === 'completed' && item.vehicle && (
        <View style={styles.bookingActions}>
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => navigation.navigate('WriteReview', { 
              booking: {
                id: item.id,
                vehicle: {
                  id: item.vehicle!.id,
                  make: item.vehicle!.make,
                  model: item.vehicle!.model,
                  year: item.vehicle!.year,
                },
                start_date: item.startDate,
                end_date: item.endDate,
              }
            })}
          >
            <Ionicons name="star-outline" size={16} color={colors.primary} />
            <Text style={styles.reviewButtonText}>Write Review</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="Profile" 
          navigation={navigation}
          showBackButton={false}
          showProfileButton={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="Profile"
          navigation={navigation}
          showBackButton={false}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Profile"
        navigation={navigation}
        showBackButton={false}
      />
      
      <FlatList
        data={profileData?.bookings || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          profileData ? (
            <View style={styles.profileHeader}>
              {/* User Info Section */}
              <View style={styles.userInfoCard}>
                <Text style={styles.userName}>
                  {profileData.user.firstName} {profileData.user.lastName}
                </Text>
                <Text style={styles.userEmail}>{profileData.user.email}</Text>
                <Text style={styles.userRole}>
                  {profileData.user.role.charAt(0).toUpperCase() + profileData.user.role.slice(1)}
                </Text>
                <Text style={styles.joinDate}>
                  Member since {formatDate(profileData.user.joinDate)}
                </Text>
              </View>

              {/* Stats Section */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{profileData.stats.totalBookings}</Text>
                  <Text style={styles.statLabel}>Total Bookings</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{profileData.stats.completedTrips}</Text>
                  <Text style={styles.statLabel}>Completed Trips</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{formatCurrency(profileData.stats.totalSpent)}</Text>
                  <Text style={styles.statLabel}>Total Spent</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate(ROUTES.PAYMENT_HISTORY)}
                >
                  <Ionicons name="receipt-outline" size={20} color={colors.white} />
                  <Text style={styles.actionButtonText}>Payment History</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate(ROUTES.FAVORITES)}
                >
                  <Ionicons name="heart-outline" size={20} color={colors.white} />
                  <Text style={styles.actionButtonText}>My Favorites</Text>
                </TouchableOpacity>
                
                {profileData?.user.role === 'owner' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.warning }]}
                    onPress={() => navigation.navigate(ROUTES.OWNER_DASHBOARD)}
                  >
                    <Ionicons name="analytics-outline" size={20} color={colors.white} />
                    <Text style={styles.actionButtonText}>Owner Dashboard</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Secondary Action Buttons */}
              <View style={styles.secondaryActionButtons}>
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.testButton} onPress={testReviewPrompts}>
                  <Text style={styles.testButtonText}>Test Reviews</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>

              {/* Booking History Header */}
              <Text style={styles.sectionTitle}>Booking History</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.lightGrey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.body.fontSize,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: 'white',
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  listContainer: {
    padding: spacing.md,
  },
  profileHeader: {
    marginBottom: spacing.lg,
  },
  userInfoCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.heading1.fontSize,
    fontWeight: 'bold',
    color: colors.darkGrey,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.body.fontSize,
    color: colors.lightGrey,
    marginBottom: spacing.xs,
  },
  userRole: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  joinDate: {
    fontSize: 14,
    color: colors.lightGrey,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  statNumber: {
    fontSize: typography.subheading.fontSize,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: colors.lightGrey,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    marginHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    marginRight: spacing.xs,
  },
  editButtonText: {
    color: 'white',
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  testButtonText: {
    color: 'white',
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    marginLeft: spacing.xs,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.subheading.fontSize,
    fontWeight: 'bold',
    color: colors.darkGrey,
    marginBottom: spacing.md,
  },
  bookingCard: {
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vehicleText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.darkGrey,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: colors.lightGrey,
  },
  bookingActions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: colors.lightGrey,
    textAlign: 'center',
  },
  secondaryActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
});

