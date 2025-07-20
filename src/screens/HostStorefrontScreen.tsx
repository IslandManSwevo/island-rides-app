import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import hostStorefrontService from '../services/hostStorefrontService';
import { vehicleService } from '../services/vehicleService';
import { notificationService } from '../services/notificationService';
import ErrorBoundary from '../components/ErrorBoundary';

interface HostProfile {
  id: number;
  first_name: string;
  last_name: string;
  profile_photo_url?: string;
  bio?: string;
  location?: string;
  member_since: string;
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
  stats: HostStats;
  vehicles: HostVehicle[];
  recentReviews: Review[];
}

interface Badge {
  type: string;
  name: string;
  icon: string;
  color: string;
  earnedAt: string;
  description: string;
}

interface HostStats {
  total_trips: number;
  reviews_received_count: number;
  average_rating_received: string;
  vehicles_owned: number;
  response_rate: number;
  response_time_hours: number;
  acceptance_rate: number;
}

interface HostVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  location: string;
  daily_rate: number;
  average_rating?: number;
  total_reviews?: number;
  photo_url?: string;
  available: boolean;
  listing_status: string;
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

type HostStorefrontScreenProps = StackScreenProps<RootStackParamList, typeof ROUTES.HOST_STOREFRONT>;

export const HostStorefrontScreen: React.FC<HostStorefrontScreenProps> = ({ 
  navigation, 
  route 
}) => {
  // Handle case where route params are undefined
  const hostId = route.params?.hostId;
  
  // If no hostId provided, redirect to appropriate screen
  React.useEffect(() => {
    if (!hostId) {
      notificationService.error('Host not found');
      navigation.goBack();
      return;
    }
  }, [hostId, navigation]);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState(5);

  useEffect(() => {
    if (hostId) {
      loadHostProfile();
    }
  }, [hostId]);

  const loadHostProfile = async (showLoader = true) => {
    if (!hostId) return;
    
    try {
      if (showLoader) setLoading(true);
      const data = await hostStorefrontService.getHostStorefront(hostId);
      setHostProfile(data);
    } catch (error) {
      console.error('Error loading host profile:', error);
      if ((error as any)?.response?.status === 404) {
        notificationService.error('Host not found or not verified');
        navigation.goBack();
      } else {
        notificationService.error('Failed to load host profile');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHostProfile(false);
  };

  const handleSendMessage = () => {
    if (!hostProfile) return;
    
    navigation.navigate(ROUTES.CHAT, {
      context: { participantId: hostProfile.id },
      title: `${hostProfile.first_name} ${hostProfile.last_name}`
    });
  };

  const handleViewVehicle = async (vehicle: HostVehicle) => {
    try {
      const fullVehicle = await vehicleService.getVehicleById(vehicle.id.toString());
      navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicle: fullVehicle.vehicle });
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      notificationService.error('Could not load vehicle details.');
    }
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
      case 'premium': return colors.premium;
      case 'verified': return colors.success;
      case 'partial': return colors.warning;
      default: return colors.lightGrey;
    }
  };

  const getVerificationText = (status: string) => {
    switch (status) {
      case 'premium': return 'Premium Verified Host';
      case 'verified': return 'Verified Host';
      case 'partial': return 'Partially Verified';
      default: return 'Unverified';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileImageContainer}>
        {hostProfile?.profile_photo_url ? (
          <Image 
            source={{ uri: hostProfile.profile_photo_url }} 
            style={styles.profileImage} 
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="person" size={60} color={colors.lightGrey} />
          </View>
        )}
        
        {/* Verified Host badge overlay */}
        <View style={[
          styles.verificationBadge,
          { backgroundColor: getVerificationColor(hostProfile?.overall_verification_status || 'unverified') }
        ]}>
          <MaterialIcons 
            name={hostProfile?.overall_verification_status === 'premium' ? 'verified' : 'check'} 
            size={16} 
            color={colors.white} 
          />
        </View>
      </View>

      <View style={styles.headerInfo}>
        <Text style={styles.name}>
          {hostProfile?.first_name} {hostProfile?.last_name}
        </Text>
        
        <View style={styles.verificationRow}>
          <Text style={[
            styles.verificationText,
            { color: getVerificationColor(hostProfile?.overall_verification_status || 'unverified') }
          ]}>
            {getVerificationText(hostProfile?.overall_verification_status || 'unverified')}
          </Text>
          <Text style={styles.verificationScore}>
            {hostProfile?.verification_score || 0}% complete
          </Text>
        </View>

        {hostProfile?.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.lightGrey} />
            <Text style={styles.location}>{hostProfile.location}</Text>
          </View>
        )}

        <Text style={styles.memberSince}>
          Host since {formatMemberSince(hostProfile?.member_since || '')}
        </Text>
      </View>

      {hostProfile?.allow_messages && (
        <TouchableOpacity style={styles.messageButton} onPress={handleSendMessage}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.white} />
          <Text style={styles.messageButtonText}>Message Host</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHostStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Host Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{hostProfile?.stats.total_trips || 0}</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{hostProfile?.stats.reviews_received_count || 0}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        
        {hostProfile?.stats.average_rating_received && (
          <View style={styles.statCard}>
            <View style={styles.ratingContainer}>
              <Text style={styles.statNumber}>{hostProfile.stats.average_rating_received}</Text>
              <Ionicons name="star" size={16} color={colors.star} />
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        )}
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{hostProfile?.stats.vehicles_owned || 0}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>

        {hostProfile?.stats.response_rate && (
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{hostProfile.stats.response_rate}%</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </View>
        )}

        {hostProfile?.stats.response_time_hours && (
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{hostProfile.stats.response_time_hours}h</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderBio = () => {
    if (!hostProfile?.bio) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This Host</Text>
        <Text style={styles.bio}>{hostProfile.bio}</Text>
      </View>
    );
  };

  const renderVehicles = () => {
    if (!hostProfile?.vehicles || hostProfile.vehicles.length === 0) return null;

    const activeVehicles = hostProfile.vehicles.filter(v => v.available && v.listing_status === 'active');

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Vehicles ({activeVehicles.length})</Text>
        <FlatList
          data={activeVehicles}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: vehicle }) => (
            <TouchableOpacity 
              style={styles.vehicleCard}
              onPress={() => handleViewVehicle(vehicle)}
            >
              {vehicle.photo_url ? (
                <Image source={{ uri: vehicle.photo_url }} style={styles.vehicleImage} />
              ) : (
                <View style={styles.vehiclePlaceholder}>
                  <MaterialIcons name="directions-car" size={40} color={colors.lightGrey} />
                </View>
              )}
              
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.vehicleLocation}>{vehicle.location}</Text>
                
                <View style={styles.vehicleFooter}>
                  <Text style={styles.vehiclePrice}>${vehicle.daily_rate}/day</Text>
                  {vehicle.average_rating && (
                    <View style={styles.vehicleRating}>
                      <Ionicons name="star" size={12} color={colors.star} />
                      <Text style={styles.ratingText}>{vehicle.average_rating}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.vehiclesList}
        />
      </View>
    );
  };

  const renderReviews = () => {
    if (!hostProfile?.recentReviews || hostProfile.recentReviews.length === 0) return null;

    const reviewsToShow = hostProfile.recentReviews.slice(0, visibleReviews);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        {reviewsToShow.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                {review.reviewer_photo ? (
                  <Image source={{ uri: review.reviewer_photo }} style={styles.reviewerPhoto} />
                ) : (
                  <View style={styles.reviewerPhotoPlaceholder}>
                    <MaterialIcons name="person" size={20} color={colors.lightGrey} />
                  </View>
                )}
                <View>
                  <Text style={styles.reviewerName}>
                    {review.reviewer_first_name} {review.reviewer_last_name}
                  </Text>
                  <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                </View>
              </View>
              
              <View style={styles.reviewRating}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < review.rating ? "star" : "star-outline"}
                    size={14}
                    color={colors.star}
                  />
                ))}
              </View>
            </View>
            
            <Text style={styles.reviewText}>{review.review_text}</Text>
          </View>
        ))}
        
        {hostProfile.recentReviews.length > visibleReviews && (
          <TouchableOpacity 
            style={styles.showMoreButton}
            onPress={() => setVisibleReviews(prev => prev + 5)}
          >
            <Text style={styles.showMoreText}>Show More Reviews</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading host profile...</Text>
      </View>
    );
  }

  if (!hostProfile) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Host Not Found</Text>
        <Text style={styles.errorMessage}>This host profile is not available or has been removed.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}
        {renderHostStats()}
        {renderBio()}
        {renderVehicles()}
        {renderReviews()}
      </ScrollView>
    </ErrorBoundary>
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
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    ...typography.heading3,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    ...typography.button,
    color: colors.white,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  verificationText: {
    ...typography.caption,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  verificationScore: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  memberSince: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  messageButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  messageButtonText: {
    ...typography.button,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    ...typography.heading3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bio: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  vehiclesList: {
    paddingRight: spacing.lg,
  },
  vehicleCard: {
    width: 200,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  vehicleImage: {
    width: '100%',
    height: 120,
  },
  vehiclePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    padding: spacing.md,
  },
  vehicleName: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  vehicleLocation: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  vehicleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehiclePrice: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '600',
  },
  vehicleRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  reviewCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
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
  reviewerPhotoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  reviewerName: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  reviewDate: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  showMoreText: {
    ...typography.button,
    color: colors.primary,
  },
});

export default HostStorefrontScreen;