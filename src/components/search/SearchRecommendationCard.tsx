import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { EnhancedVehicleRecommendation } from '../../services/recommendationEngine';

interface SearchRecommendationCardProps {
  recommendation: EnhancedVehicleRecommendation;
  onPress: () => void;
  onExplainPress?: () => void;
  showExplanation?: boolean;
}

export const SearchRecommendationCard: React.FC<SearchRecommendationCardProps> = ({
  recommendation,
  onPress,
  onExplainPress,
  showExplanation = true
}) => {
  const { vehicle, recommendationScore, isPersonalized, isTrending, isCollaborativeMatch } = recommendation;
  const recommendationReasons = recommendation.reasons || [];
  const displayScore = recommendation.score || recommendationScore;

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return colors.success;
    if (score >= 0.6) return colors.warning;
    return colors.text;
  };

  const getBadgeIcon = () => {
    if (isPersonalized) return 'person';
    if (isTrending) return 'trending-up';
    if (isCollaborativeMatch) return 'people';
    return 'star';
  };

  const getBadgeText = () => {
    if (isPersonalized) return 'For You';
    if (isTrending) return 'Trending';
    if (isCollaborativeMatch) return 'Popular';
    return 'Recommended';
  };

  const getBadgeColor = () => {
    if (isPersonalized) return colors.primary;
    if (isTrending) return colors.success;
    if (isCollaborativeMatch) return colors.warning;
    return colors.primary;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Vehicle Image */}
      <View style={styles.imageContainer}>
        {vehicle.photos && vehicle.photos.length > 0 ? (
          <Image source={{ uri: vehicle.photos[0].photoUrl }} style={styles.vehicleImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="car" size={40} color={colors.lightGrey} />
          </View>
        )}
        
        {/* Recommendation Badge */}
        <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
          <Ionicons name={getBadgeIcon() as any} size={12} color={colors.white} />
          <Text style={styles.badgeText}>{getBadgeText()}</Text>
        </View>

        {/* Recommendation Score */}
        <View style={[styles.scoreContainer, { backgroundColor: getScoreColor(displayScore) }]}>
          <Text style={styles.scoreText}>{Math.round(displayScore * 100)}</Text>
        </View>
      </View>

      {/* Vehicle Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.header}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.rating}>{vehicle.averageRating?.toFixed(1) || 'N/A'}</Text>
          </View>
        </View>

        <Text style={styles.vehicleType}>{vehicle.vehicleType}</Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${vehicle.dailyRate}</Text>
          <Text style={styles.priceUnit}>/day</Text>
        </View>

        {/* Recommendation Reasons */}
        {showExplanation && recommendationReasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            {recommendationReasons.slice(0, 2).map((reason, index) => (
              <View key={index} style={styles.reasonItem}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.reasonText} numberOfLines={1}>{reason}</Text>
              </View>
            ))}
            {recommendationReasons.length > 2 && (
              <TouchableOpacity onPress={onExplainPress} style={styles.moreReasonsButton}>
                <Text style={styles.moreReasonsText}>
                  +{recommendationReasons.length - 2} more reasons
                </Text>
                <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Vehicle Features */}
        <View style={styles.featuresContainer}>
          {vehicle.seatingCapacity && (
            <View style={styles.featureChip}>
              <Ionicons name="people" size={12} color={colors.primary} />
              <Text style={styles.featureText}>{vehicle.seatingCapacity} seats</Text>
            </View>
          )}
          {vehicle.fuelType && (
            <View style={styles.featureChip}>
              <Ionicons name="car" size={12} color={colors.primary} />
              <Text style={styles.featureText}>{vehicle.fuelType}</Text>
            </View>
          )}
          {vehicle.transmissionType && (
            <View style={styles.featureChip}>
              <Ionicons name="settings" size={12} color={colors.primary} />
              <Text style={styles.featureText}>{vehicle.transmissionType}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {vehicle.verificationStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.white} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  scoreContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  vehicleName: {
    ...typography.subheading,
    flex: 1,
    marginRight: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  vehicleType: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  price: {
    ...typography.heading3,
    color: colors.primary,
  },
  priceUnit: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  reasonsContainer: {
    marginBottom: spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reasonText: {
    ...typography.caption,
    color: colors.text,
    marginLeft: spacing.xs,
    flex: 1,
  },
  moreReasonsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  moreReasonsText: {
    ...typography.caption,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  instantBookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  instantBookingText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  verifiedText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});