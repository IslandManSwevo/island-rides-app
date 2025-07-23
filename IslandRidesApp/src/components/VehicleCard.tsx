import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, vehicleCardStyles } from '../styles/theme';
import { Vehicle } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { vehicleFeatureService } from '../services/vehicleFeatureService';
import { StandardCard } from './templates/StandardCard';
import { GluestackCard } from './templates/GluestackCard';
import { AnimatedButton } from './AnimatedButton';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
  showAdvancedInfo?: boolean;
  compact?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = React.memo(({ 
  vehicle, 
  onPress, 
  showAdvancedInfo = true,
  compact = false 
}) => {
  // Mock social proof data - in real app this would come from props or API
  const socialProofData = useMemo(() => ({
    rating: 4.8,
    reviewCount: Math.floor(Math.random() * 200) + 50,
    recentBookings: Math.floor(Math.random() * 30) + 5,
    instantBooking: Math.random() > 0.3,
    availabilityStatus: Math.random() > 0.2 ? 'available' : 'limited'
  }), []);
  
  const urgencyIndicator = useMemo(() => {
    const hoursAgo = Math.floor(Math.random() * 12) + 1;
    return `Last booked ${hoursAgo}h ago`;
  }, []);
  
  // Animation values
  const cardScale = useSharedValue(1);
  const cardElevation = useSharedValue(2);
  const badgeScale = useSharedValue(0);
  
  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    shadowOpacity: interpolate(cardElevation.value, [2, 8], [0.1, 0.3]),
    elevation: cardElevation.value,
  }));
  
  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));
  
  // Badge entrance animation
  React.useEffect(() => {
    badgeScale.value = withSpring(1, { damping: 15 });
  }, [badgeScale]);
  
  const handleCardPressIn = useCallback(() => {
    cardScale.value = withSpring(0.98, { damping: 15 });
    cardElevation.value = withTiming(8, { duration: 150 });
  }, []);
  
  const handleCardPressOut = useCallback(() => {
    cardScale.value = withSpring(1, { damping: 15 });
    cardElevation.value = withTiming(2, { duration: 150 });
  }, []);
  const primaryPhoto = useMemo(() => 
    vehicle.photos?.find(p => p.isPrimary) || vehicle.photos?.[0], 
    [vehicle.photos]
  );
  
  const isPremium = useMemo(() => 
    vehicleFeatureService.isPremiumVehicle(vehicle), 
    [vehicle]
  );
  
  const conditionText = useMemo(() => 
    vehicle.conditionRating ? vehicleFeatureService.getVehicleConditionText(vehicle.conditionRating) : null,
    [vehicle.conditionRating]
  );

  const getFuelIcon = useCallback((fuelType?: string) => {
    switch (fuelType) {
      case 'electric': return '⚡';
      case 'hybrid': return '🔋';
      case 'diesel': return '🛢️';
      default: return '⛽';
    }
  }, []);

  const getTransmissionIcon = useCallback((transmissionType?: string) => {
    return transmissionType === 'manual' ? '🚗' : '⚙️';
  }, []);

  const renderRatingStars = useCallback((rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, { color: i <= rating ? colors.star : colors.lightGrey }]}>
          ★
        </Text>
      );
    }
    return stars;
  }, []);

  return (
    <AnimatedButton
      onPress={onPress}
      hapticType="light"
      style={[styles.cardContainer, animatedCardStyle]}
    >
      <GluestackCard
        variant="elevated"
        padding="none"
        margin="none"
        testID="vehicle-card"
        accessibilityLabel={`Vehicle: ${vehicle.make} ${vehicle.model} ${vehicle.year}`}
        accessibilityHint="Tap to view vehicle details"
      >
      {/* Vehicle Image */}
      {primaryPhoto && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: primaryPhoto.photoUrl }}
            style={[styles.vehicleImage, compact && styles.compactImage]}
            resizeMode="cover"
          />
          
          {/* Premium Badge */}
          {isPremium && (
            <View style={vehicleCardStyles.premiumBadge}>
              <Text style={vehicleCardStyles.premiumBadgeText}>PREMIUM</Text>
            </View>
          )}

          {/* Verification Status */}
          {vehicle.verificationStatus === 'verified' && (
            <View style={vehicleCardStyles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.verified} />
              <Text style={vehicleCardStyles.verifiedText}>Verified</Text>
            </View>
          )}
          
          {/* Availability Status */}
          <Animated.View style={[styles.availabilityBadge, socialProofData.availabilityStatus === 'limited' && styles.limitedBadge, animatedBadgeStyle]}>
            <View style={[styles.statusDot, socialProofData.availabilityStatus === 'limited' && styles.limitedDot]} />
            <Text style={[styles.availabilityText, socialProofData.availabilityStatus === 'limited' && styles.limitedText]}>
              {socialProofData.availabilityStatus === 'available' ? 'Available' : 'Limited'}
            </Text>
          </Animated.View>
          
          {/* Instant Booking Badge */}
          {socialProofData.instantBooking && (
            <Animated.View style={[styles.instantBadge, animatedBadgeStyle]}>
              <Ionicons name="flash" size={12} color={colors.warning} />
              <Text style={styles.instantText}>Instant</Text>
            </Animated.View>
          )}
        </View>
      )}

      <View style={styles.favoriteButton}>
        <FavoriteButton vehicleId={vehicle.id} />
      </View>

      <View style={[styles.cardContent, compact && styles.compactContent]}>
        <View style={styles.vehicleInfo}>
          <View style={styles.headerRow}>
            <Text style={[styles.vehicleName, compact && styles.compactVehicleName]}>
              {vehicle.make} {vehicle.model}
            </Text>
            <View style={[
              styles.driveBadge,
              vehicle.driveSide === 'LHD' ? styles.lhdBadge : styles.rhdBadge
            ]}>
              <Ionicons 
                name="car-outline" 
                size={12} 
                color={colors.white} 
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>{vehicle.driveSide}</Text>
            </View>
          </View>
          
          <Text style={[styles.vehicleYear, compact && styles.compactText]}>
            {vehicle.year} • {vehicle.vehicleType || 'Car'}
          </Text>
          <Text style={[styles.vehicleLocation, compact && styles.compactText]}>
            {vehicle.location}
          </Text>
          
          {/* Social Proof */}
          <View style={styles.socialProof}>
            <View style={styles.ratingSection}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.ratingText}>{socialProofData.rating}</Text>
              <Text style={styles.reviewCount}>({socialProofData.reviewCount})</Text>
            </View>
            
            <View style={styles.urgencyIndicator}>
              <Text style={styles.urgencyText}>{urgencyIndicator}</Text>
            </View>
          </View>

          {/* Advanced Info Section */}
          {showAdvancedInfo && !compact && (
            <View style={vehicleCardStyles.advancedInfo}>
              {/* Specs Row */}
              <View style={styles.specsRow}>
                {vehicle.seatingCapacity && (
                  <View style={styles.specItem}>
                    <Ionicons name="people-outline" size={14} color={colors.grey} />
                    <Text style={styles.specText}>{vehicle.seatingCapacity}</Text>
                  </View>
                )}
                
                {vehicle.fuelType && (
                  <View style={styles.specItem}>
                    <Text style={styles.specIcon}>{getFuelIcon(vehicle.fuelType)}</Text>
                    <Text style={styles.specText}>{vehicle.fuelType}</Text>
                  </View>
                )}
                
                {vehicle.transmissionType && (
                  <View style={styles.specItem}>
                    <Text style={styles.specIcon}>{getTransmissionIcon(vehicle.transmissionType)}</Text>
                    <Text style={styles.specText}>{vehicle.transmissionType}</Text>
                  </View>
                )}
              </View>

              {/* Condition Rating */}
              {vehicle.conditionRating && (
                <View style={styles.conditionRow}>
                  <Text style={styles.conditionLabel}>Condition:</Text>
                  <View style={styles.ratingContainer}>
                    {renderRatingStars(vehicle.conditionRating)}
                    <Text style={styles.conditionText}>({conditionText})</Text>
                  </View>
                </View>
              )}

              {/* Premium Features Preview */}
              {vehicle.features && vehicle.features.length > 0 && (
                <View style={styles.featuresPreview}>
                  {vehicle.features.slice(0, 3).map((feature, index) => (
                    <View key={feature.id} style={styles.featureTag}>
                      <Text style={styles.featureTagText}>{feature.name}</Text>
                    </View>
                  ))}
                  {vehicle.features.length > 3 && (
                    <View style={styles.featureTag}>
                      <Text style={styles.featureTagText}>+{vehicle.features.length - 3} more</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Additional Services */}
              <View style={styles.servicesRow}>
                {vehicle.deliveryAvailable && (
                  <View style={styles.serviceItem}>
                    <Ionicons name="car-outline" size={12} color={colors.verified} />
                    <Text style={styles.serviceText}>Delivery</Text>
                  </View>
                )}
                
                {vehicle.airportPickup && (
                  <View style={styles.serviceItem}>
                    <Ionicons name="airplane-outline" size={12} color={colors.primary} />
                    <Text style={styles.serviceText}>Airport</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Booking Activity */}
          <View style={styles.bookingActivity}>
            <View style={styles.activityItem}>
              <Ionicons name="people" size={12} color={colors.primary} />
              <Text style={styles.activityText}>🔥 {socialProofData.recentBookings} booked this week</Text>
            </View>
          </View>
          
          {/* Pricing */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceText, compact && styles.compactPrice]}>
                ${vehicle.dailyRate}
              </Text>
              <Text style={[styles.priceUnit, compact && styles.compactText]}>per day</Text>
            </View>
            
            {/* Additional pricing info */}
            {!compact && (vehicle.weeklyRate || vehicle.monthlyRate) && (
              <View style={styles.additionalPricing}>
                {vehicle.weeklyRate && (
                  <Text style={styles.additionalPriceText}>
                    ${vehicle.weeklyRate}/week
                  </Text>
                )}
                {vehicle.monthlyRate && (
                  <Text style={styles.additionalPriceText}>
                    ${vehicle.monthlyRate}/month
                  </Text>
                )}
              </View>
            )}

            {/* Rating and Reviews */}
            {vehicle.averageRating && vehicle.totalReviews && (
              <View style={styles.reviewsRow}>
                <View style={styles.ratingContainer}>
                  <Text style={styles.reviewsRatingText}>{vehicle.averageRating.toFixed(1)}</Text>
                  <Ionicons name="star" size={14} color={colors.star} />
                </View>
                <Text style={styles.reviewsText}>({vehicle.totalReviews} reviews)</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </View>
      </View>
    </GluestackCard>
    </AnimatedButton>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    shadowColor: colors.darkGrey,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Removed card styles - now handled by StandardCard
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  availabilityBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.verified + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  limitedBadge: {
    backgroundColor: colors.warning + '15',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.verified,
  },
  limitedDot: {
    backgroundColor: colors.warning,
  },
  availabilityText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.verified,
  },
  limitedText: {
    color: colors.warning,
  },
  instantBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  instantText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
  },
  socialProof: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  reviewCount: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  urgencyIndicator: {
    flex: 1,
    alignItems: 'flex-end',
  },
  urgencyText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.lightGrey,
    fontStyle: 'italic',
  },
  bookingActivity: {
    marginBottom: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activityText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  star: {
    fontSize: 14,
    marginRight: 2,
  },
  vehicleInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGrey,
    flex: 1,
  },
  driveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  lhdBadge: {
    backgroundColor: colors.primary,
  },
  rhdBadge: {
    backgroundColor: colors.error,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleYear: {
    ...typography.body,
    fontSize: 14,
    marginBottom: 2,
  },
  vehicleLocation: {
    ...typography.body,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  priceUnit: {
    ...typography.body,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  arrowContainer: {
    marginLeft: spacing.md,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
  },
  compactImage: {
    height: 150,
  },
  premiumBadge: {
    position: 'absolute' as const,
    top: 10,
    left: 10,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  verifiedBadge: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  verifiedText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600' as const,
    marginLeft: 2,
  },
  advancedInfo: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  specIcon: {
    marginRight: 4,
  },
  specText: {
    ...typography.body,
    fontSize: 14,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conditionLabel: {
    ...typography.body,
    fontSize: 14,
    marginRight: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionText: {
    ...typography.body,
    fontSize: 14,
  },
  featuresPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  featureTag: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 4,
    marginRight: 4,
  },
  featureTagText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  serviceText: {
    ...typography.body,
    fontSize: 14,
  },
  priceContainer: {
    marginBottom: spacing.md,
  },
  additionalPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  additionalPriceText: {
    ...typography.body,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  reviewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsRatingText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  reviewsText: {
    ...typography.body,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  // Removed compactCard styles - now handled by StandardCard
  compactContent: {
    padding: spacing.lg,
  },
  compactVehicleName: {
    fontSize: 16,
  },
  compactText: {
    fontSize: 14,
  },
  compactPrice: {
    fontSize: 18,
  },
});
