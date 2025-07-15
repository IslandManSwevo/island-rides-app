import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../styles/Theme';
import { apiService } from '../../services/apiService';
import { notificationService } from '../../services/notificationService';

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

interface VehicleReviewsResponse {
  reviews: Review[];
  averageRating: number;
}

interface VehicleReviewsProps {
  vehicleId: number;
}

export const VehicleReviews: React.FC<VehicleReviewsProps> = ({ vehicleId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    fetchVehicleReviews();
  }, [vehicleId]);

  const fetchVehicleReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await apiService.get<VehicleReviewsResponse>(`/reviews/vehicle/${vehicleId}`);
      setReviews(response.reviews || []);
      setAverageRating(response.averageRating || 0);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      
      let errorMessage = 'Failed to load reviews';
      
      // Check for specific error types and HTTP status codes
      if (error?.response?.status) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Please log in to view reviews';
            break;
          case 403:
            errorMessage = 'You do not have permission to view these reviews';
            break;
          case 404:
            errorMessage = 'Vehicle reviews not found';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Failed to load reviews (Error ${error.response.status})`;
        }
      } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again';
      } else if (error?.code === 'TIMEOUT_ERROR' || error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again';
      } else if (error?.message) {
        errorMessage = `Failed to load reviews: ${error.message}`;
      }
      
      notificationService.error(errorMessage, { duration: 4000 });
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleToggleReviews = () => {
    setShowAllReviews(!showAllReviews);
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
              {review.user.first_name && review.user.first_name.length > 0 ? review.user.first_name.charAt(0) : '?'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {review.user.first_name} {review.user.last_name && review.user.last_name.length > 0 ? `${review.user.last_name.charAt(0)}.` : ''}
            </Text>
            <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
          </View>
        </View>
        {renderStars(review.rating)}
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );

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
          onPress={handleToggleReviews}
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

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.heading1,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    marginLeft: spacing.md,
    color: colors.darkGrey,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyReviewsText: {
    ...typography.heading1,
    marginTop: spacing.md,
  },
  emptyReviewsSubtext: {
    ...typography.body,
    color: colors.darkGrey,
    textAlign: 'center',
    marginTop: spacing.sm,
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
    marginBottom: spacing.lg,
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
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  userInitial: {
    ...typography.heading1,
    color: colors.white,
  },
  userDetails: {},
  userName: {
    ...typography.body,
    fontWeight: '600',
  },
  reviewDate: {
    ...typography.body,
    fontSize: 12,
    color: colors.darkGrey,
  },
  reviewComment: {
    ...typography.body,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  showMoreText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
});