import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

export const VehicleDetailSkeleton: React.FC = () => {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Image Gallery Skeleton */}
      <View style={styles.galleryContainer}>
        <SkeletonBase width="100%" height={300} borderRadius={0} />
        
        {/* Gallery Indicators */}
        <View style={styles.galleryIndicators}>
          <SkeletonBase width={40} height={20} borderRadius={borderRadius.md} />
        </View>
        
        {/* Gallery Thumbnails */}
        <View style={styles.thumbnailsContainer}>
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBase 
              key={index}
              width={60} 
              height={60} 
              borderRadius={borderRadius.md}
            />
          ))}
        </View>
      </View>

      <View style={styles.infoContainer}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <SkeletonBase width="80%" height={28} style={styles.vehicleName} />
          <SkeletonBase width="60%" height={18} style={styles.vehicleYear} />
          <SkeletonBase width="70%" height={16} style={styles.location} />
          
          {/* Social Proof */}
          <View style={styles.socialProofRow}>
            <SkeletonBase width={100} height={20} />
            <SkeletonBase width={80} height={16} />
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <SkeletonBase width={100} height={20} style={styles.sectionTitle} />
          <SkeletonBase width="100%" height={16} style={styles.descriptionLine} />
          <SkeletonBase width="90%" height={16} style={styles.descriptionLine} />
          <SkeletonBase width="75%" height={16} />
        </View>

        {/* Specifications Section */}
        <View style={styles.section}>
          <SkeletonBase width={150} height={20} style={styles.sectionTitle} />
          <View style={styles.specsGrid}>
            {Array.from({ length: 6 }, (_, index) => (
              <View key={index} style={styles.specItem}>
                <SkeletonBase width={24} height={24} borderRadius={12} />
                <SkeletonBase width={80} height={16} />
              </View>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <SkeletonBase width={140} height={20} style={styles.sectionTitle} />
          <View style={styles.featuresGrid}>
            {Array.from({ length: 8 }, (_, index) => (
              <SkeletonBase 
                key={index}
                width={90} 
                height={32} 
                borderRadius={borderRadius.lg}
                style={styles.featureChip}
              />
            ))}
          </View>
        </View>

        {/* Delivery Options Section */}
        <View style={styles.section}>
          <SkeletonBase width={180} height={20} style={styles.sectionTitle} />
          <View style={styles.deliveryOption}>
            <SkeletonBase width={24} height={24} borderRadius={12} />
            <View style={styles.deliveryContent}>
              <SkeletonBase width={120} height={16} />
              <SkeletonBase width={200} height={14} />
            </View>
          </View>
          <View style={styles.deliveryOption}>
            <SkeletonBase width={24} height={24} borderRadius={12} />
            <View style={styles.deliveryContent}>
              <SkeletonBase width={100} height={16} />
              <SkeletonBase width={150} height={14} />
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <SkeletonBase width={80} height={20} style={styles.sectionTitle} />
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <SkeletonBase width={40} height={40} borderRadius={20} />
                <View style={styles.reviewInfo}>
                  <SkeletonBase width={100} height={16} />
                  <SkeletonBase width={80} height={14} />
                </View>
                <SkeletonBase width={60} height={16} />
              </View>
              <SkeletonBase width="100%" height={14} style={styles.reviewText} />
              <SkeletonBase width="80%" height={14} />
            </View>
          ))}
        </View>

        {/* Bottom Spacing for Sticky Bar */}
        <View style={styles.bottomSpacing} />
      </View>

      {/* Sticky Booking Bar Skeleton */}
      <View style={styles.stickyBookingBar}>
        <View style={styles.bookingBarContent}>
          <View style={styles.priceSection}>
            <SkeletonBase width={40} height={14} />
            <SkeletonBase width={80} height={24} />
            <SkeletonBase width={100} height={16} />
          </View>
          
          <View style={styles.bookingActions}>
            <SkeletonBase width={100} height={36} borderRadius={borderRadius.lg} />
            <SkeletonBase width={120} height={44} borderRadius={borderRadius.lg} />
          </View>
        </View>
        
        <SkeletonBase width="90%" height={16} style={styles.urgencyBanner} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  contentContainer: {
    paddingBottom: 160,
  },
  galleryContainer: {
    position: 'relative',
  },
  galleryIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },
  thumbnailsContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  infoContainer: {
    padding: spacing.lg,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  vehicleName: {
    marginBottom: spacing.xs,
  },
  vehicleYear: {
    marginBottom: spacing.xs,
  },
  location: {
    marginBottom: spacing.md,
  },
  socialProofRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  descriptionLine: {
    marginBottom: spacing.xs,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '45%',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureChip: {
    marginBottom: spacing.xs,
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
  reviewItem: {
    marginBottom: spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  reviewText: {
    marginBottom: spacing.xs,
  },
  bottomSpacing: {
    height: spacing.xl,
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
  bookingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  urgencyBanner: {
    alignSelf: 'center',
  },
});