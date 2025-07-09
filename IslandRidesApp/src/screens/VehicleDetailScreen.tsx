import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Button } from '../components/Button';
import { Vehicle } from '../types';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { FavoriteButton } from '../components/FavoriteButton';
import { VehiclePhotoGallery } from '../components/VehiclePhotoGallery';
import { VehicleFeatureList } from '../components/VehicleFeatureList';
import { vehicleFeatureService } from '../services/vehicleFeatureService';

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

interface VehicleAmenity {
  id: number;
  icon?: string;
  name: string;
  isAvailable?: boolean;
}

export const VehicleDetailScreen = ({ navigation, route }: any) => {
  const { vehicle } = route.params;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    specs: true,
    features: true,
    amenities: false,
    maintenance: false,
  });

  // Default features for vehicles without feature data (legacy support)
  const defaultFeatures = [
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

  const handleToggleReviews = () => {
    setShowAllReviews(!showAllReviews);
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
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

  const renderVehicleSpecs = () => {
    if (!expandedSections.specs) return null;

    return (
      <View style={styles.specsGrid}>
        {vehicle.vehicleType && (
          <View style={styles.specItem}>
            <Ionicons name="car-outline" size={20} color={colors.primary} />
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>Type</Text>
              <Text style={styles.specValue}>{vehicle.vehicleType}</Text>
            </View>
          </View>
        )}

        {vehicle.seatingCapacity && (
          <View style={styles.specItem}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>Seating</Text>
              <Text style={styles.specValue}>{vehicle.seatingCapacity} passengers</Text>
            </View>
          </View>
        )}

        {vehicle.fuelType && (
          <View style={styles.specItem}>
            <Ionicons name="flash-outline" size={20} color={colors.primary} />
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>Fuel Type</Text>
              <Text style={styles.specValue}>{vehicle.fuelType}</Text>
            </View>
          </View>
        )}

        {vehicle.transmissionType && (
          <View style={styles.specItem}>
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>Transmission</Text>
              <Text style={styles.specValue}>{vehicle.transmissionType}</Text>
            </View>
          </View>
        )}

        {vehicle.engineType && (
          <View style={styles.specItem}>
            <Ionicons name="hardware-chip-outline" size={20} color={colors.primary} />
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>Engine</Text>
              <Text style={styles.specValue}>{vehicle.engineType}</Text>
            </View>
          </View>
        )}

        {vehicle.doors && (
          <View style={styles.specItem}>
            <Ionicons name="exit-outline" size={20} color={colors.primary} />
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>Doors</Text>
              <Text style={styles.specValue}>{vehicle.doors} doors</Text>
            </View>
          </View>
        )}

        {vehicle.color && (
          <View style={styles.specItem}>
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>Color</Text>
              <Text style={styles.specValue}>{vehicle.color}</Text>
            </View>
          </View>
        )}

        {vehicle.mileage && (
          <View style={styles.specItem}>
            <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>Mileage</Text>
              <Text style={styles.specValue}>{vehicle.mileage.toLocaleString()} miles</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderConditionRating = () => {
    if (!vehicle.conditionRating) return null;

    const conditionText = vehicleFeatureService.getVehicleConditionText(vehicle.conditionRating);
    
    return (
      <View style={styles.conditionSection}>
        <Text style={styles.conditionTitle}>Vehicle Condition</Text>
        <View style={styles.conditionContent}>
          {renderStars(vehicle.conditionRating, 18)}
          <Text style={styles.conditionText}>
            {vehicle.conditionRating}/5 - {conditionText}
          </Text>
        </View>
        {vehicle.lastInspectionDate && (
          <Text style={styles.inspectionText}>
            Last inspected: {formatDate(vehicle.lastInspectionDate)}
          </Text>
        )}
      </View>
    );
  };

  const renderVerificationStatus = () => {
    if (!vehicle.verificationStatus) return null;

    const statusText = vehicleFeatureService.getVerificationStatusText(vehicle.verificationStatus);
    const statusColor = vehicleFeatureService.getVerificationStatusColor(vehicle.verificationStatus);

    return (
      <View style={styles.verificationSection}>
        <View style={styles.verificationHeader}>
          <Ionicons 
            name={vehicle.verificationStatus === 'verified' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color={statusColor} 
          />
          <Text style={[styles.verificationText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
        {vehicle.verificationNotes && (
          <Text style={styles.verificationNotes}>{vehicle.verificationNotes}</Text>
        )}
      </View>
    );
  };

  const renderPricingDetails = () => {
    return (
      <View style={styles.pricingSection}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Daily Rate</Text>
          <Text style={styles.priceValue}>${vehicle.dailyRate}</Text>
        </View>

        {vehicle.weeklyRate && (
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Weekly Rate</Text>
            <Text style={styles.priceValue}>${vehicle.weeklyRate}</Text>
          </View>
        )}

        {vehicle.monthlyRate && (
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Monthly Rate</Text>
            <Text style={styles.priceValue}>${vehicle.monthlyRate}</Text>
          </View>
        )}

        {vehicle.securityDeposit && (
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Security Deposit</Text>
            <Text style={styles.priceValue}>${vehicle.securityDeposit}</Text>
          </View>
        )}

        {vehicle.minimumRentalDays && vehicle.minimumRentalDays > 1 && (
          <Text style={styles.rentalNote}>
            Minimum rental: {vehicle.minimumRentalDays} days
          </Text>
        )}
      </View>
    );
  };

  const renderDeliveryOptions = () => {
    const hasDeliveryOptions = vehicle.deliveryAvailable || vehicle.airportPickup;
    
    if (!hasDeliveryOptions) return null;

    return (
      <View style={styles.deliverySection}>
        <Text style={styles.sectionTitle}>Delivery & Pickup Options</Text>
        
        {vehicle.deliveryAvailable && (
          <View style={styles.deliveryOption}>
            <Ionicons name="car-outline" size={20} color="#10B981" />
            <View style={styles.deliveryContent}>
              <Text style={styles.deliveryTitle}>Vehicle Delivery</Text>
              <Text style={styles.deliveryDescription}>
                Available within {vehicle.deliveryRadius || 10}km radius
                {vehicle.deliveryFee && vehicle.deliveryFee > 0 && (
                  <Text> - ${vehicle.deliveryFee} fee</Text>
                )}
              </Text>
            </View>
          </View>
        )}

        {vehicle.airportPickup && (
          <View style={styles.deliveryOption}>
            <Ionicons name="airplane-outline" size={20} color="#3B82F6" />
            <View style={styles.deliveryContent}>
              <Text style={styles.deliveryTitle}>Airport Pickup</Text>
              <Text style={styles.deliveryDescription}>
                Available at airports
                {vehicle.airportPickupFee && vehicle.airportPickupFee > 0 && (
                  <Text> - ${vehicle.airportPickupFee} fee</Text>
                )}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderExpandableSection = (title: string, key: string, children: React.ReactNode, count?: number) => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(key)}
      >
        <Text style={styles.sectionTitle}>
          {title}
          {count !== undefined && <Text style={styles.sectionCount}> ({count})</Text>}
        </Text>
        <Ionicons
          name={expandedSections[key] ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
      {expandedSections[key] && children}
    </View>
  );

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

  return (
    <ScrollView style={styles.container}>
      {/* Photo Gallery */}
      {vehicle.photos && vehicle.photos.length > 0 ? (
        <VehiclePhotoGallery 
          photos={vehicle.photos}
          height={300}
          showThumbnails={false}
          enableFullscreen={true}
        />
      ) : (
        <View style={styles.galleryContainer}>
          <Image 
            source={{ uri: `https://placehold.co/400x300/00B8D4/FFFFFF?text=${encodeURIComponent(vehicle.make)}+${encodeURIComponent(vehicle.model)}` }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          <View style={styles.imageIndicator}>
            <Text style={styles.imageCount}>1 / 1</Text>
          </View>
        </View>
      )}

      <View style={styles.infoContainer}>
        {/* Header Section */}
        <View style={styles.headerRow}>
          <Text style={styles.vehicleName}>
            {vehicle.make} {vehicle.model}
          </Text>
          <View style={styles.headerActions}>
            <FavoriteButton vehicleId={vehicle.id} size={24} style={styles.favoriteButton} />
            <View style={[
              styles.driveBadge,
              (vehicle.driveSide || vehicle.drive_side) === 'LHD' ? styles.lhdBadge : styles.rhdBadge
            ]}>
              <Ionicons 
                name="car-outline" 
                size={16} 
                color={colors.white} 
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>{vehicle.driveSide || vehicle.drive_side}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.vehicleYear}>
          {vehicle.year} • {vehicle.vehicleType || 'Car'}
        </Text>
        <Text style={styles.vehicleLocation}>📍 {vehicle.location}</Text>

        {/* Verification Status */}
        {renderVerificationStatus()}

        {/* Condition Rating */}
        {renderConditionRating()}

        {/* Pricing */}
        {renderPricingDetails()}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {vehicle.description || 
            `Experience the perfect blend of comfort and performance with this ${vehicle.year} ${vehicle.make} ${vehicle.model}. 
            Ideal for exploring the beautiful islands of the Bahamas with reliable transportation and modern amenities.`}
          </Text>
        </View>

        {/* Vehicle Specifications */}
        {renderExpandableSection('Vehicle Specifications', 'specs', renderVehicleSpecs())}

        {/* Features */}
        {vehicle.features && vehicle.features.length > 0 ? (
          renderExpandableSection(
            'Features & Amenities', 
            'features', 
            <VehicleFeatureList 
              features={vehicle.features}
              showCategories={true}
              showPremiumBadges={true}
              showAdditionalCosts={true}
              interactive={false}
            />,
            vehicle.features.length
          )
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              {defaultFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Amenities */}
        {vehicle.amenities && vehicle.amenities.length > 0 && (
          renderExpandableSection(
            'Vehicle Amenities',
            'amenities',
            <View style={styles.amenitiesGrid}>
              {vehicle.amenities.map((amenity: VehicleAmenity, index: number) => (
                <View key={amenity.id || index} style={styles.amenityItem}>
                  <Text style={styles.amenityIcon}>{amenity.icon || '•'}</Text>
                  <Text style={styles.amenityText}>{amenity.name}</Text>
                  {amenity.isAvailable === false && (
                    <Text style={styles.unavailableText}>(Not Available)</Text>
                  )}
                </View>
              ))}
            </View>,
            vehicle.amenities.length
          )
        )}

        {/* Delivery Options */}
        {renderDeliveryOptions()}

        {/* Maintenance & Safety */}
        {(vehicle.lastMaintenanceDate || vehicle.nextMaintenanceDate || vehicle.safetyFeatures) && (
          renderExpandableSection(
            'Maintenance & Safety',
            'maintenance',
            <View style={styles.maintenanceSection}>
              {vehicle.lastMaintenanceDate && (
                <View style={styles.maintenanceItem}>
                  <Ionicons name="build-outline" size={20} color={colors.primary} />
                  <Text style={styles.maintenanceText}>
                    Last maintenance: {formatDate(vehicle.lastMaintenanceDate)}
                  </Text>
                </View>
              )}
              {vehicle.nextMaintenanceDate && (
                <View style={styles.maintenanceItem}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={styles.maintenanceText}>
                    Next maintenance: {formatDate(vehicle.nextMaintenanceDate)}
                  </Text>
                </View>
              )}
              {vehicle.safetyFeatures && vehicle.safetyFeatures.length > 0 && (
                <View style={styles.safetyFeaturesContainer}>
                  <Text style={styles.safetyTitle}>Safety Features:</Text>
                  {vehicle.safetyFeatures.map((feature: string, index: number) => (
                    <View key={index} style={styles.safetyFeatureItem}>
                      <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                      <Text style={styles.safetyFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        )}

        {/* Reviews */}
        {renderReviewsSection()}

        {/* Booking */}
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
  specsGrid: {
    gap: spacing.sm,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  specValue: {
    ...typography.body,
  },
  conditionSection: {
    marginBottom: spacing.lg,
  },
  conditionTitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
  },
  conditionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  inspectionText: {
    ...typography.body,
    marginLeft: spacing.sm,
    color: colors.lightGrey,
  },
  verificationSection: {
    marginBottom: spacing.lg,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  verificationText: {
    ...typography.body,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  verificationNotes: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.lightGrey,
  },
  pricingSection: {
    marginBottom: spacing.lg,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  priceValue: {
    ...typography.body,
  },
  rentalNote: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.lightGrey,
  },
  deliverySection: {
    marginBottom: spacing.lg,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deliveryContent: {
    flex: 1,
  },
  deliveryTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  deliveryDescription: {
    ...typography.body,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  sectionCount: {
    ...typography.body,
    fontWeight: '600',
  },
  amenitiesGrid: {
    gap: spacing.sm,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  amenityIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  amenityText: {
    ...typography.body,
    flex: 1,
  },
  unavailableText: {
    ...typography.body,
    fontSize: 12,
    color: colors.error,
    fontStyle: 'italic',
  },
  maintenanceSection: {
    gap: spacing.sm,
  },
  maintenanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  maintenanceText: {
    ...typography.body,
    marginLeft: spacing.sm,
    flex: 1,
  },
  safetyFeaturesContainer: {
    marginTop: spacing.md,
  },
  safetyTitle: {
    ...typography.subheading,
    marginBottom: spacing.sm,
  },
  safetyFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  safetyFeatureText: {
    ...typography.body,
    marginLeft: spacing.xs,
  },
});
