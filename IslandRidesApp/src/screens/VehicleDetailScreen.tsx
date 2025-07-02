import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { Vehicle } from '../types';
import { colors, typography, spacing, borderRadius } from '../styles/theme';

interface VehicleDetailScreenProps {
  route: any;
  navigation: any;
}

const { width: screenWidth } = Dimensions.get('window');

export const VehicleDetailScreen: React.FC<VehicleDetailScreenProps> = ({ route, navigation }) => {
  const { vehicle }: { vehicle: Vehicle } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getVehicleImages = (vehicleId: number): string[] => {
    const imageMap: { [key: number]: string[] } = {
      1: [
        'https://placehold.co/400x300/00B8D4/FFFFFF?text=Toyota+Camry+Front',
        'https://placehold.co/400x300/0097A7/FFFFFF?text=Toyota+Camry+Side',
        'https://placehold.co/400x300/00ACC1/FFFFFF?text=Toyota+Camry+Interior',
      ],
      2: [
        'https://placehold.co/400x300/00B8D4/FFFFFF?text=Honda+Civic+Front',
        'https://placehold.co/400x300/0097A7/FFFFFF?text=Honda+Civic+Side',
        'https://placehold.co/400x300/00ACC1/FFFFFF?text=Honda+Civic+Interior',
      ],
      3: [
        'https://placehold.co/400x300/00B8D4/FFFFFF?text=BMW+X3+Front',
        'https://placehold.co/400x300/0097A7/FFFFFF?text=BMW+X3+Side',
        'https://placehold.co/400x300/00ACC1/FFFFFF?text=BMW+X3+Interior',
      ],
      4: [
        'https://placehold.co/400x300/00B8D4/FFFFFF?text=Nissan+Altima+Front',
        'https://placehold.co/400x300/0097A7/FFFFFF?text=Nissan+Altima+Side',
        'https://placehold.co/400x300/00ACC1/FFFFFF?text=Nissan+Altima+Interior',
      ],
      5: [
        'https://placehold.co/400x300/00B8D4/FFFFFF?text=Ford+Mustang+Front',
        'https://placehold.co/400x300/0097A7/FFFFFF?text=Ford+Mustang+Side',
        'https://placehold.co/400x300/00ACC1/FFFFFF?text=Ford+Mustang+Interior',
      ],
      6: [
        'https://placehold.co/400x300/00B8D4/FFFFFF?text=Jeep+Wrangler+Front',
        'https://placehold.co/400x300/0097A7/FFFFFF?text=Jeep+Wrangler+Side',
        'https://placehold.co/400x300/00ACC1/FFFFFF?text=Jeep+Wrangler+Interior',
      ],
    };
    return imageMap[vehicleId] || ['https://placehold.co/400x300/00B8D4/FFFFFF?text=Vehicle+Photo'];
  };

  const getDefaultFeatures = (): string[] => {
    return [
      'Air Conditioning',
      'Bluetooth Connectivity',
      'GPS Navigation',
      'Automatic Transmission',
      'Power Windows',
      'USB Charging Ports',
    ];
  };

  const images = vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos : getVehicleImages(vehicle.id);
  const features = vehicle.features && vehicle.features.length > 0 ? vehicle.features : getDefaultFeatures();

  const handleBookNow = () => {
    Alert.alert(
      'Booking Feature',
      'Booking functionality will be implemented in the next phase. This vehicle is available for $' + vehicle.daily_rate + '/day.',
      [{ text: 'OK' }]
    );
  };

  const renderImageGallery = () => (
    <View style={styles.imageGallery}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentImageIndex(index);
        }}
      >
        {images.map((imageUrl, index) => (
          <Image
            key={index}
            source={{ uri: imageUrl }}
            style={styles.galleryImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      <View style={styles.imageIndicator}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              index === currentImageIndex && styles.indicatorDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderImageGallery()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.vehicleTitle}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.location}>📍 {vehicle.location}</Text>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.price}>${vehicle.daily_rate}</Text>
            <Text style={styles.priceUnit}>per day</Text>
          </View>
        </View>

        {vehicle.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{vehicle.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureText}>✓ {feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Make:</Text>
              <Text style={styles.detailValue}>{vehicle.make}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Model:</Text>
              <Text style={styles.detailValue}>{vehicle.model}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Year:</Text>
              <Text style={styles.detailValue}>{vehicle.year}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{vehicle.location}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <LinearGradient
        colors={[colors.primary, colors.gradientLight]}
        style={styles.bookingSection}
      >
        <View style={styles.bookingContent}>
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingPrice}>${vehicle.daily_rate}/day</Text>
            <Text style={styles.bookingSubtext}>Best rate guaranteed</Text>
          </View>
          <Button
            title="Book Now"
            onPress={handleBookNow}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  imageGallery: {
    height: 300,
    position: 'relative',
  },
  galleryImage: {
    width: screenWidth,
    height: 300,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey + '30',
  },
  titleSection: {
    flex: 1,
  },
  vehicleTitle: {
    ...typography.heading1,
    fontSize: 24,
    color: colors.darkGrey,
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.body,
    color: colors.lightGrey,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 12,
    color: colors.lightGrey,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey + '30',
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.darkGrey,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.darkGrey,
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    width: '50%',
    marginBottom: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.darkGrey,
  },
  detailsContainer: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.body,
    color: colors.lightGrey,
    fontWeight: '500',
  },
  detailValue: {
    ...typography.body,
    color: colors.darkGrey,
    fontWeight: '600',
  },
  bookingSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bookingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  bookingSubtext: {
    fontSize: 12,
    color: colors.white,
  },
});
