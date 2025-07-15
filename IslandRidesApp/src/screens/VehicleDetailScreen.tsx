import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../styles/Theme';
import Button from '../components/Button';
import { Vehicle, VehicleAmenity } from '../types';
import { VehiclePhotoGallery } from '../components/VehiclePhotoGallery';
import { VehicleFeatureList } from '../components/VehicleFeatureList';
import { vehicleFeatureService } from '../services/vehicleFeatureService';
import { VehicleHeader } from '../components/vehicle/VehicleHeader';
import { VehicleSpecs } from '../components/vehicle/VehicleSpecs';
import { VehicleReviews } from '../components/vehicle/VehicleReviews';

type RootStackParamList = {
  VehicleDetail: { vehicle: Vehicle };
  Checkout: { vehicle: Vehicle };
};

type VehicleDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VehicleDetail'>;
type VehicleDetailScreenRouteProp = RouteProp<RootStackParamList, 'VehicleDetail'>;

interface VehicleDetailScreenProps {
  navigation: VehicleDetailScreenNavigationProp;
  route: VehicleDetailScreenRouteProp;
}

export const VehicleDetailScreen = ({ navigation, route }: VehicleDetailScreenProps) => {
  const { vehicle } = route.params;
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
    navigation.navigate('Checkout', { vehicle });
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
      <ScrollView>
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
          <Button
            title="Book Now"
            onPress={handleBookNow}
            disabled={!vehicle.available}
          />
        </View>
      </View>

    </ScrollView>
    </SafeAreaView>
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
});
