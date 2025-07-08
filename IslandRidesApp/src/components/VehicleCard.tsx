import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Vehicle } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { vehicleFeatureService } from '../services/vehicleFeatureService';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
  showAdvancedInfo?: boolean;
  compact?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ 
  vehicle, 
  onPress, 
  showAdvancedInfo = true,
  compact = false 
}) => {
  const primaryPhoto = vehicle.photos?.find(p => p.isPrimary) || vehicle.photos?.[0];
  const isPremium = vehicleFeatureService.isPremiumVehicle(vehicle);
  const conditionText = vehicle.conditionRating ? vehicleFeatureService.getVehicleConditionText(vehicle.conditionRating) : null;
  const verificationStatus = vehicleFeatureService.getVerificationStatusText(vehicle.verificationStatus);
  const verificationColor = vehicleFeatureService.getVerificationStatusColor(vehicle.verificationStatus);

  const getFuelIcon = (fuelType?: string) => {
    switch (fuelType) {
      case 'electric': return '⚡';
      case 'hybrid': return '🔋';
      case 'diesel': return '🛢️';
      default: return '⛽';
    }
  };

  const getTransmissionIcon = (transmissionType?: string) => {
    return transmissionType === 'manual' ? '🚗' : '⚙️';
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, { color: i <= rating ? '#F59E0B' : '#E5E7EB' }]}>
          ★
        </Text>
      );
    }
    return stars;
  };

  return (
    <TouchableOpacity style={[styles.card, compact && styles.compactCard]} onPress={onPress}>
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
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          )}

          {/* Verification Status */}
          {vehicle.verificationStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
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

          {/* Advanced Info Section */}
          {showAdvancedInfo && !compact && (
            <View style={styles.advancedInfo}>
              {/* Specs Row */}
              <View style={styles.specsRow}>
                {vehicle.seatingCapacity && (
                  <View style={styles.specItem}>
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
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
                    <Ionicons name="car-outline" size={12} color="#10B981" />
                    <Text style={styles.serviceText}>Delivery</Text>
                  </View>
                )}
                
                {vehicle.airportPickup && (
                  <View style={styles.serviceItem}>
                    <Ionicons name="airplane-outline" size={12} color="#3B82F6" />
                    <Text style={styles.serviceText}>Airport</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
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
                  <Text style={styles.ratingText}>{vehicle.averageRating.toFixed(1)}</Text>
                  <Ionicons name="star" size={14} color="#F59E0B" />
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
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
    backgroundColor: '#E74C3C',
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
    shadowColor: '#000',
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
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 4,
  },
  premiumBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 4,
  },
  verifiedText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  advancedInfo: {
    marginBottom: spacing.md,
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
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  reviewsText: {
    ...typography.body,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  compactCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
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
  star: {
    fontSize: 14,
    marginRight: 2,
  },
});
