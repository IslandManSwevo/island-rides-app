import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Button } from '../components/Button';
import { Vehicle } from '../types';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { FavoriteButton } from '../components/FavoriteButton';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

export const VehicleDetailScreen = ({ navigation, route }: any) => {
  const { vehicle } = route.params;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const features = [
    'Air Conditioning',
    'Bluetooth',
    'GPS Navigation',
    'Backup Camera',
    'USB Charging',
    'Automatic Transmission'
  ];

  useEffect(() => {
    fetchVehicleReviews();
  }, []);

  const fetchVehicleReviews = async () => {
    try {
      setLoadingReviews(true);
      const response: any = await apiService.get(`/reviews/vehicle/${vehicle.id}`);
      setReviews(response.reviews || []);
      setAverageRating(response.averageRating || 0);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      notificationService.error('Failed to load reviews', { duration: 3000 });
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleBookNow = () => {
    navigation.navigate('Checkout', { vehicle });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? colors.warning : colors.lightGrey}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  const renderReviewItem = (review: Review) => (
    <View key={review.id} style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {review.user.first_name.charAt(0)}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {review.user.first_name} {review.user.last_name.charAt(0)}.
            </Text>
            <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
          </View>
        </View>
        {renderStars(review.rating)}
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );

  const renderReviewsSection = () => {
    if (loadingReviews) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        </View>
      );
    }

    if (reviews.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.emptyReviews}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.lightGrey} />
            <Text style={styles.emptyReviewsText}>No reviews yet</Text>
            <Text style={styles.emptyReviewsSubtext}>
              Be the first to share your experience with this vehicle
            </Text>
          </View>
        </View>
      );
    }

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

    return (
      <View style={styles.section}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={styles.ratingOverview}>
            {renderStars(averageRating, 20)}
            <Text style={styles.averageRating}>
              {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
            </Text>
          </View>
        </View>

        {displayedReviews.map(renderReviewItem)}

        {reviews.length > 2 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAllReviews(!showAllReviews)}
          >
            <Text style={styles.showMoreText}>
              {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
            </Text>
            <Ionicons
              name={showAllReviews ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.galleryContainer}>
        <Image 
          source={{ uri: `https://placehold.co/400x250/00B8D4/FFFFFF?text=${vehicle.make}+${vehicle.model}` }}
          style={styles.mainImage}
          resizeMode="cover"
        />
        <View style={styles.imageIndicator}>
          <Text style={styles.imageCount}>1 / 3</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.vehicleName}>
            {vehicle.make} {vehicle.model}
          </Text>
          <View style={styles.headerActions}>
            <FavoriteButton vehicleId={vehicle.id} size={24} style={styles.favoriteButton} />
            <View style={[
              styles.driveBadge,
              vehicle.drive_side === 'LHD' ? styles.lhdBadge : styles.rhdBadge
            ]}>
              <Ionicons 
                name="car-outline" 
                size={16} 
                color={colors.white} 
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>{vehicle.drive_side}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.vehicleYear}>{vehicle.year}</Text>
        <Text style={styles.vehicleLocation}>📍 {vehicle.location}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>${vehicle.daily_rate}</Text>
          <Text style={styles.priceUnit}>per day</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            Experience the perfect blend of comfort and performance with this {vehicle.year} {vehicle.make} {vehicle.model}. 
            Ideal for exploring the beautiful islands of the Bahamas with reliable transportation and modern amenities.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Drive Side:</Text>
            <Text style={styles.detailValue}>
              {vehicle.drive_side === 'LHD' ? 'Left-Hand Drive' : 'Right-Hand Drive'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Availability:</Text>
            <Text style={[styles.detailValue, { color: vehicle.available ? colors.primary : colors.error }]}>
              {vehicle.available ? 'Available' : 'Not Available'}
            </Text>
          </View>
        </View>

        {renderReviewsSection()}

        <View style={styles.bookingContainer}>
          <Button
            title="Book Now"
            onPress={handleBookNow}
            disabled={!vehicle.available}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  galleryContainer: {
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 250,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  imageCount: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    marginRight: spacing.sm,
  },
  vehicleName: {
    ...typography.heading1,
    fontSize: 24,
    flex: 1,
  },
  driveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  lhdBadge: {
    backgroundColor: colors.primary,
  },
  rhdBadge: {
    backgroundColor: '#E74C3C',
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleYear: {
    ...typography.body,
    fontSize: 16,
    marginBottom: 4,
  },
  vehicleLocation: {
    ...typography.body,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  priceText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  priceUnit: {
    ...typography.body,
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    lineHeight: 22,
  },
  featuresGrid: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  detailValue: {
    ...typography.body,
  },
  bookingContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  // Reviews styles
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageRating: {
    ...typography.body,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  reviewItem: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  userInitial: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 15,
  },
  reviewDate: {
    ...typography.body,
    fontSize: 13,
    color: colors.lightGrey,
  },
  reviewComment: {
    ...typography.body,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    marginLeft: spacing.sm,
    color: colors.lightGrey,
  },
  emptyReviews: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyReviewsText: {
    ...typography.subheading,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.lightGrey,
  },
  emptyReviewsSubtext: {
    ...typography.body,
    textAlign: 'center',
    color: colors.lightGrey,
    lineHeight: 20,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  showMoreText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
});
