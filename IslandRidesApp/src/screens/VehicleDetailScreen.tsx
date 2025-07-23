import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { StandardButton } from '../components/templates/StandardButton';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';
import { Vehicle, VehicleAmenity } from '../types';
import { VehiclePhotoGallery } from '../components/VehiclePhotoGallery';
import { VehicleFeatureList } from '../components/VehicleFeatureList';
import { vehicleFeatureService } from '../services/vehicleFeatureService';
import { VehicleHeader } from '../components/vehicle/VehicleHeader';
import { VehicleSpecs } from '../components/vehicle/VehicleSpecs';
import { VehicleReviews } from '../components/vehicle/VehicleReviews';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type VehicleDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VehicleDetail'>;
type VehicleDetailScreenRouteProp = RouteProp<RootStackParamList, 'VehicleDetail'>;

interface VehicleDetailScreenProps {
  navigation: VehicleDetailScreenNavigationProp;
  route: VehicleDetailScreenRouteProp;
}

export const VehicleDetailScreen = ({ navigation, route }: VehicleDetailScreenProps) => {
  const { getMetrics, resetMetrics } = usePerformanceMonitoring('VehicleDetailScreen', {
    slowRenderThreshold: 16,
    enableLogging: __DEV__,
    trackMemory: true,
  });
  
  const { vehicle } = route.params;
  
  // Handle case where vehicle is not provided
  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Vehicle not found</Text>
          <StandardButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
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

  const handleBookNow = useCallback(() => {
    navigation.navigate(ROUTES.CHECKOUT, { 
      vehicle, 
      startDate: new Date().toISOString(), 
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
    });
  }, [navigation, vehicle]);

  const toggleSection = useCallback((sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  const renderVehicleSpecs = () => {
    if (!expandedSections.specs) return null;

    return <VehicleSpecs vehicle={vehicle} />;
  };

  const renderDeliveryOptions = () => {
    const hasDeliveryOptions = vehicle.deliveryAvailable || vehicle.airportPickup;
    
    if (!hasDeliveryOptions) return null;

    return (
      <View style={styles.deliverySection}>
        <Text style={styles.sectionTitle}>Delivery & Pickup Options</Text>
        
        {vehicle.deliveryAvailable && (
          <View style={styles.deliveryOption}>
            <Ionicons name="car-outline" size={20} color={colors.verified} />
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
            <Ionicons name="airplane-outline" size={20} color={colors.info} />
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
        style={styles.detailRow}
        onPress={() => toggleSection(key)}
      >
        <Text style={styles.sectionTitle}>
          {title}
          {count !== undefined && <Text> ({count})</Text>}
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

  const renderReviewsSection = () => {
    return <VehicleReviews vehicleId={vehicle.id} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent}>
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
        <VehicleHeader vehicle={vehicle} />

        <Text style={styles.vehicleYear}>
          {vehicle.year} • {vehicle.vehicleType || 'Car'}
        </Text>
        <Text style={styles.vehicleLocation}>📍 {vehicle.location}</Text>



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
                  <Text style={styles.amenityIcon}>•</Text>
                  <Text style={styles.amenityText}>{amenity.amenityName}</Text>
                  {!amenity.isStandard && (
                    <Text style={styles.unavailableText}>(Additional Cost: ${amenity.additionalCost})</Text>
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
                      <Ionicons name="shield-checkmark" size={16} color={colors.verified} />
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
          <StandardButton
            title="Book Now"
            onPress={handleBookNow}
            disabled={!vehicle.available}
            fullWidth
          />
        </View>
      </View>

    </ScrollView>
    
    {/* Sticky Booking Bar */}
    {vehicle.available && (
      <View style={styles.stickyBookingBar}>
        <View style={styles.bookingBarContent}>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.priceValue}>${vehicle.dailyRate}/day</Text>
            <View style={styles.socialProof}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.ratingText}>4.8</Text>
              <Text style={styles.reviewCount}>(124)</Text>
            </View>
          </View>
          
          <View style={styles.bookingActions}>
            <TouchableOpacity style={styles.availabilityButton}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.availabilityText}>Select Dates</Text>
            </TouchableOpacity>
            
            <StandardButton
              title="Book Now"
              onPress={handleBookNow}
              variant="primary"
              style={styles.stickyBookButton}
            />
          </View>
        </View>
        
        {/* Urgency Indicator */}
        <View style={styles.urgencyBanner}>
          <Ionicons name="flash" size={16} color={colors.warning} />
          <Text style={styles.urgencyText}>🔥 19 people booked today</Text>
          <Text style={styles.urgencySubtext}>Last booking 2 hours ago</Text>
        </View>
      </View>
    )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollContent: {
    paddingBottom: 160, // Space for sticky booking bar
  },
  stickyBookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    shadowColor: colors.darkGrey,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bookingBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.lightGrey,
    marginBottom: 2,
  },
  priceValue: {
    ...typography.heading2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  reviewCount: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  bookingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  availabilityText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  stickyBookButton: {
    minWidth: 120,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  urgencyText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.warning,
    flex: 1,
  },
  urgencySubtext: {
    ...typography.caption,
    color: colors.lightGrey,
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
    backgroundColor: colors.overlay,
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
    backgroundColor: colors.error,
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



  deliverySection: {
    marginBottom: spacing.lg,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deliveryContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  deliveryTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  deliveryDescription: {
    ...typography.body,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.heading3,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    minWidth: 120,
  },
});
