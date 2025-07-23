import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface VehicleCardSkeletonProps {
  compact?: boolean;
}

export const VehicleCardSkeleton: React.FC<VehicleCardSkeletonProps> = ({ 
  compact = false 
}) => {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Vehicle Image Skeleton */}
      <View style={[styles.imageContainer, compact && styles.compactImageContainer]}>
        <SkeletonBase
          width="100%"
          height={compact ? 120 : 200}
          borderRadius={borderRadius.md}
        />
        
        {/* Badge Skeletons */}
        <View style={styles.badgeContainer}>
          <SkeletonBase width={60} height={20} borderRadius={borderRadius.sm} />
          <SkeletonBase width={45} height={20} borderRadius={borderRadius.sm} />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={[styles.content, compact && styles.compactContent]}>
        <View style={styles.vehicleInfo}>
          {/* Vehicle Name */}
          <SkeletonBase 
            width="70%" 
            height={compact ? 16 : 20} 
            style={styles.vehicleName}
          />
          
          {/* Vehicle Year & Type */}
          <SkeletonBase 
            width="50%" 
            height={14} 
            style={styles.vehicleDetails}
          />
          
          {/* Location */}
          <SkeletonBase 
            width="60%" 
            height={14} 
            style={styles.location}
          />
          
          {/* Social Proof Row */}
          <View style={styles.socialProofRow}>
            <SkeletonBase width={80} height={16} />
            <SkeletonBase width={60} height={12} />
          </View>

          {/* Advanced Info (if not compact) */}
          {!compact && (
            <>
              {/* Specs Row */}
              <View style={styles.specsRow}>
                <SkeletonBase width={40} height={24} borderRadius={borderRadius.md} />
                <SkeletonBase width={50} height={24} borderRadius={borderRadius.md} />
                <SkeletonBase width={45} height={24} borderRadius={borderRadius.md} />
              </View>
              
              {/* Features Preview */}
              <View style={styles.featuresRow}>
                <SkeletonBase width={60} height={20} borderRadius={borderRadius.lg} />
                <SkeletonBase width={70} height={20} borderRadius={borderRadius.lg} />
                <SkeletonBase width={50} height={20} borderRadius={borderRadius.lg} />
              </View>
              
              {/* Booking Activity */}
              <SkeletonBase width="80%" height={16} style={styles.bookingActivity} />
            </>
          )}
          
          {/* Price */}
          <View style={styles.priceRow}>
            <SkeletonBase 
              width={compact ? 60 : 80} 
              height={compact ? 18 : 24} 
            />
            <SkeletonBase width={40} height={14} />
          </View>
        </View>
        
        {/* Arrow */}
        <SkeletonBase width={20} height={20} borderRadius={10} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.darkGrey,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactContainer: {
    margin: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  compactImageContainer: {
    // Compact specific styles if needed
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    gap: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  compactContent: {
    padding: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    marginBottom: spacing.xs,
  },
  vehicleDetails: {
    marginBottom: spacing.xs,
  },
  location: {
    marginBottom: spacing.sm,
  },
  socialProofRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  specsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  bookingActivity: {
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
});