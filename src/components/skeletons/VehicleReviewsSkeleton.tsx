import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface VehicleReviewsSkeletonProps {
  reviewCount?: number;
}

export const VehicleReviewsSkeleton: React.FC<VehicleReviewsSkeletonProps> = ({ 
  reviewCount = 2 
}) => {
  return (
    <View style={styles.section}>
      {/* Section Title */}
      <SkeletonBase 
        width={80} 
        height={24} 
        borderRadius={4}
        style={styles.titleSkeleton}
      />
      
      {/* Rating Overview */}
      <View style={styles.ratingOverview}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <SkeletonBase 
              key={star}
              width={20} 
              height={20} 
              borderRadius={10}
              style={styles.starSkeleton}
            />
          ))}
        </View>
        <SkeletonBase 
          width={120} 
          height={16} 
          borderRadius={4}
          style={styles.ratingTextSkeleton}
        />
      </View>

      {/* Review Items */}
      {Array.from({ length: reviewCount }).map((_, index) => (
        <View key={index} style={styles.reviewItem}>
          {/* Review Header */}
          <View style={styles.reviewHeader}>
            <View style={styles.reviewUserInfo}>
              {/* User Avatar */}
              <SkeletonBase 
                width={40} 
                height={40} 
                borderRadius={20}
                style={styles.avatarSkeleton}
              />
              
              {/* User Details */}
              <View style={styles.userDetails}>
                <SkeletonBase 
                  width={100} 
                  height={16} 
                  borderRadius={4}
                  style={styles.userNameSkeleton}
                />
                <SkeletonBase 
                  width={80} 
                  height={14} 
                  borderRadius={4}
                  style={styles.dateSkeleton}
                />
              </View>
            </View>
            
            {/* Review Stars */}
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <SkeletonBase 
                  key={star}
                  width={16} 
                  height={16} 
                  borderRadius={8}
                  style={styles.reviewStarSkeleton}
                />
              ))}
            </View>
          </View>
          
          {/* Review Comment */}
          <View style={styles.commentContainer}>
            <SkeletonBase 
              width="100%" 
              height={16} 
              borderRadius={4}
              style={styles.commentLineSkeleton}
            />
            <SkeletonBase 
              width="85%" 
              height={16} 
              borderRadius={4}
              style={styles.commentLineSkeleton}
            />
            <SkeletonBase 
              width="60%" 
              height={16} 
              borderRadius={4}
              style={styles.commentLineSkeleton}
            />
          </View>
        </View>
      ))}
      
      {/* Show More Button */}
      <View style={styles.showMoreButton}>
        <SkeletonBase 
          width={140} 
          height={20} 
          borderRadius={4}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  titleSkeleton: {
    marginBottom: spacing.md,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starSkeleton: {
    marginRight: 2,
  },
  ratingTextSkeleton: {
    marginLeft: spacing.sm,
  },
  reviewItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSkeleton: {
    marginRight: spacing.sm,
  },
  userDetails: {
    flex: 1,
  },
  userNameSkeleton: {
    marginBottom: spacing.xs,
  },
  dateSkeleton: {
    marginBottom: 0,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewStarSkeleton: {
    marginRight: 2,
  },
  commentContainer: {
    gap: spacing.xs,
  },
  commentLineSkeleton: {
    marginBottom: spacing.xs,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
});