import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';

interface PublicProfile {
  id: number;
  first_name: string;
  last_name: string;
  profile_photo_url?: string;
  bio?: string;
  location?: string;
  languages_spoken?: string[];
  interests?: string[];
  fun_fact?: string;
  member_since: string;
  last_active: string;
  verification_score: number;
  overall_verification_status: string;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  address_verified: boolean;
  driving_license_verified: boolean;
  background_check_verified: boolean;
  allow_messages?: boolean;
  badges: Badge[];
  stats: ProfileStats;
  recentTrips: PublicTrip[];
  recentReviews: Review[];
  vehicles: Vehicle[];
}

interface Badge {
  type: string;
  name: string;
  icon: string;
  color: string;
  earnedAt: string;
  description: string;
}

interface ProfileStats {
  public_trips_count: number;
  reviews_received_count: number;
  average_rating_received: string;
  reviews_given_count: number;
  vehicles_owned: number;
  completed_bookings: number;
}

interface PublicTrip {
  id: number;
  destination: string;
  trip_start_date: string;
  trip_end_date: string;
  trip_duration_days: number;
  trip_story?: string;
  trip_rating?: number;
  show_destination: boolean;
  show_dates: boolean;
  show_duration: boolean;
}

interface Review {
  id: number;
  rating: number;
  review_text: string;
  created_at: string;
  reviewer_first_name: string;
  reviewer_last_name: string;
  reviewer_photo?: string;
}

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  location: string;
  daily_rate: number;
  average_rating?: number;
  total_reviews?: number;
}

type PublicUserProfileScreenProps = StackScreenProps<RootStackParamList, typeof ROUTES.PUBLIC_USER_PROFILE>;

export const PublicUserProfileScreen: React.FC<PublicUserProfileScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { userId } = route.params;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await apiService.get(`/profiles/${userId}`);
      setProfile(response as PublicProfile);
    } catch (error: any) {
      console.error('Error loading public profile:', error);
      if (error?.response?.status === 404) {
        notificationService.error('Profile not found or private');
        navigation.goBack();
      } else {
        notificationService.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile(false);
  };

  const handleSendMessage = () => {
    if (!profile) return;
    
    // Navigate to chat with this user
    navigation.navigate(ROUTES.CHAT, {
      context: { participantId: profile.id },
      title: `${profile.first_name} ${profile.last_name}`
    });
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    // Convert the public profile vehicle to the full Vehicle type expected by VehicleDetail
    const fullVehicle = {
      ...vehicle,
      ownerId: 0, // This will be populated by the VehicleDetail screen
      dailyRate: vehicle.daily_rate,
      available: true,
      driveSide: 'LHD' as const,
      createdAt: new Date().toISOString(),
    };
    navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicle: fullVehicle });
  };

  const formatMemberSince = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'premium': return '#10B981';
      case 'verified': return '#3B82F6';
      case 'partial': return '#F59E0B';
      default: return colors.lightGrey;
    }
  };

  const getVerificationText = (status: string) => {
    switch (status) {
      case 'premium': return 'Premium Verified';
      case 'verified': return 'Verified';
      case 'partial': return 'Partially Verified';
      default: return 'Unverified';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileImageContainer}>
        {profile?.profile_photo_url ? (
          <Image 
            source={{ uri: profile.profile_photo_url }} 
            style={styles.profileImage} 
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="person" size={60} color={colors.lightGrey} />
          </View>
        )}
        
        {/* Verification badge overlay */}
        <View style={[
          styles.verificationBadge,
          { backgroundColor: getVerificationColor(profile?.overall_verification_status || 'unverified') }
        ]}>
          <MaterialIcons 
            name={profile?.overall_verification_status === 'premium' ? 'verified' : 'check'} 
            size={16} 
            color={colors.white} 
          />
        </View>
      </View>

      <View style={styles.headerInfo}>
        <Text style={styles.name}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        
        <View style={styles.verificationRow}>
          <Text style={[
            styles.verificationText,
            { color: getVerificationColor(profile?.overall_verification_status || 'unverified') }
          ]}>
            {getVerificationText(profile?.overall_verification_status || 'unverified')}
          </Text>
          <Text style={styles.verificationScore}>
            {profile?.verification_score || 0}% complete
          </Text>
        </View>

        {profile?.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.lightGrey} />
            <Text style={styles.location}>{profile.location}</Text>
          </View>
        )}

        <Text style={styles.memberSince}>
          Member since {formatMemberSince(profile?.member_since || '')}
        </Text>
      </View>

      {profile?.allow_messages && (
        <TouchableOpacity style={styles.messageButton} onPress={handleSendMessage}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.white} />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderBadges = () => {
    if (!profile?.badges || profile.badges.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges & Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.badgesContainer}>
            {profile.badges.map((badge, index) => (
              <View key={index} style={[styles.badge, { borderColor: badge.color }]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                {badge.earnedAt && (
                  <Text style={styles.badgeDate}>
                    {formatDate(badge.earnedAt)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Profile Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile?.stats.completed_bookings || 0}</Text>
          <Text style={styles.statLabel}>Trips Completed</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile?.stats.reviews_received_count || 0}</Text>
          <Text style={styles.statLabel}>Reviews Received</Text>
        </View>
        
        {profile?.stats.average_rating_received && (
          <View style={styles.statCard}>
            <View style={styles.ratingContainer}>
              <Text style={styles.statNumber}>{profile.stats.average_rating_received}</Text>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
        )}
        
        {profile?.stats.vehicles_owned && profile.stats.vehicles_owned > 0 && (
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.stats.vehicles_owned}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderBio = () => {
    if (!profile?.bio && !profile?.interests?.length && !profile?.languages_spoken?.length && !profile?.fun_fact) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        {profile.languages_spoken && profile.languages_spoken.length > 0 && (
          <View style={styles.bioSection}>
            <Text style={styles.bioLabel}>Languages:</Text>
            <View style={styles.tagsContainer}>
              {profile.languages_spoken.map((language, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{language}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.bioSection}>
            <Text style={styles.bioLabel}>Interests:</Text>
            <View style={styles.tagsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {profile.fun_fact && (
          <View style={styles.bioSection}>
            <Text style={styles.bioLabel}>Fun Fact:</Text>
            <Text style={styles.funFact}>{profile.fun_fact}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderRecentTrips = () => {
    if (!profile?.recentTrips || profile.recentTrips.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {profile.recentTrips.map((trip, index) => (
          <View key={trip.id} style={styles.tripCard}>
            {trip.show_destination && (
              <Text style={styles.tripDestination}>{trip.destination}</Text>
            )}
            
            <View style={styles.tripDetails}>
              {trip.show_duration && (
                <Text style={styles.tripDetail}>
                  {trip.trip_duration_days} day{trip.trip_duration_days !== 1 ? 's' : ''}
                </Text>
              )}
              
              {trip.show_dates && (
                <Text style={styles.tripDetail}>
                  {formatDate(trip.trip_start_date)}
                </Text>
              )}
            </View>

            {trip.trip_rating && (
              <View style={styles.tripRating}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons
                    key={star}
                    name={star <= trip.trip_rating! ? 'star' : 'star-outline'}
                    size={14}
                    color="#F59E0B"
                  />
                ))}
              </View>
            )}

            {trip.trip_story && (
              <Text style={styles.tripStory} numberOfLines={3}>
                {trip.trip_story}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderRecentReviews = () => {
    if (!profile?.recentReviews || profile.recentReviews.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        {profile.recentReviews.map((review, index) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                {review.reviewer_photo ? (
                  <Image 
                    source={{ uri: review.reviewer_photo }} 
                    style={styles.reviewerPhoto} 
                  />
                ) : (
                  <View style={styles.reviewerPlaceholder}>
                    <MaterialIcons name="person" size={20} color={colors.lightGrey} />
                  </View>
                )}
                <View>
                  <Text style={styles.reviewerName}>
                    {review.reviewer_first_name} {review.reviewer_last_name}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {formatDate(review.created_at)}
                  </Text>
                </View>
              </View>

              <View style={styles.reviewRating}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons
                    key={star}
                    name={star <= review.rating ? 'star' : 'star-outline'}
                    size={14}
                    color="#F59E0B"
                  />
                ))}
              </View>
            </View>

            <Text style={styles.reviewText} numberOfLines={3}>
              {review.review_text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderVehicles = () => {
    if (!profile?.vehicles || profile.vehicles.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicles</Text>
        {profile.vehicles.map((vehicle, index) => (
          <TouchableOpacity 
            key={vehicle.id} 
            style={styles.vehicleCard}
            onPress={() => handleViewVehicle(vehicle)}
          >
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {vehicle.make} {vehicle.model} {vehicle.year}
              </Text>
              <Text style={styles.vehicleLocation}>{vehicle.location}</Text>
              
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehiclePrice}>${vehicle.daily_rate}/day</Text>
                
                {vehicle.average_rating && (
                  <View style={styles.vehicleRating}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {vehicle.average_rating.toFixed(1)} ({vehicle.total_reviews})
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={colors.lightGrey} />
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderHeader()}
      {renderBadges()}
      {renderStats()}
      {renderBio()}
      {renderRecentTrips()}
      {renderRecentReviews()}
      {renderVehicles()}
    </ScrollView>
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
    backgroundColor: colors.offWhite,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.lightGrey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.offWhite,
  },
  errorText: {
    ...typography.heading1,
    color: colors.lightGrey,
    marginVertical: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.heading1,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  verificationText: {
    ...typography.body,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  verificationScore: {
    ...typography.body,
    fontSize: 14,
    color: colors.lightGrey,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.body,
    color: colors.lightGrey,
    marginLeft: spacing.xs,
  },
  memberSince: {
    ...typography.body,
    fontSize: 14,
    color: colors.lightGrey,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  messageButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  badge: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    minWidth: 100,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  badgeName: {
    ...typography.body,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  badgeDate: {
    ...typography.body,
    fontSize: 10,
    color: colors.lightGrey,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.offWhite,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    ...typography.heading1,
    fontSize: 24,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body,
    fontSize: 12,
    color: colors.lightGrey,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bio: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  bioSection: {
    marginBottom: spacing.md,
  },
  bioLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    ...typography.body,
    fontSize: 12,
    color: colors.white,
  },
  funFact: {
    ...typography.body,
    fontStyle: 'italic',
    color: colors.lightGrey,
  },
  tripCard: {
    backgroundColor: colors.offWhite,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  tripDestination: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  tripDetail: {
    ...typography.body,
    fontSize: 14,
    color: colors.lightGrey,
  },
  tripRating: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  tripStory: {
    ...typography.body,
    fontSize: 14,
    color: colors.darkGrey,
  },
  reviewCard: {
    backgroundColor: colors.offWhite,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  reviewerPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  reviewerName: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 14,
  },
  reviewDate: {
    ...typography.body,
    fontSize: 12,
    color: colors.lightGrey,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewText: {
    ...typography.body,
    fontSize: 14,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  vehicleLocation: {
    ...typography.body,
    fontSize: 14,
    color: colors.lightGrey,
    marginBottom: spacing.xs,
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehiclePrice: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  vehicleRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.body,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
}); 