import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Button } from '../components/Button';
import { Vehicle } from '../types';

export const VehicleDetailScreen = ({ navigation, route }: any) => {
  const { vehicle } = route.params;

  const features = [
    'Air Conditioning',
    'Bluetooth',
    'GPS Navigation',
    'Backup Camera',
    'USB Charging',
    'Automatic Transmission'
  ];

  const handleBookNow = () => {
    navigation.navigate('Checkout', { vehicle });
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
});
