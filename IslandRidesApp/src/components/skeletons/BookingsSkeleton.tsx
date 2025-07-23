import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface BookingsSkeletonProps {
  itemCount?: number;
}

export const BookingsSkeleton: React.FC<BookingsSkeletonProps> = ({ 
  itemCount = 4 
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <SkeletonBase 
            width={40} 
            height={32} 
            borderRadius={4}
            style={styles.statNumberSkeleton}
          />
          <SkeletonBase 
            width={80} 
            height={14} 
            borderRadius={4}
            style={styles.statLabelSkeleton}
          />
        </View>
        
        <View style={styles.statCard}>
          <SkeletonBase 
            width={40} 
            height={32} 
            borderRadius={4}
            style={styles.statNumberSkeleton}
          />
          <SkeletonBase 
            width={80} 
            height={14} 
            borderRadius={4}
            style={styles.statLabelSkeleton}
          />
        </View>
        
        <View style={styles.statCard}>
          <SkeletonBase 
            width={40} 
            height={32} 
            borderRadius={4}
            style={styles.statNumberSkeleton}
          />
          <SkeletonBase 
            width={80} 
            height={14} 
            borderRadius={4}
            style={styles.statLabelSkeleton}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBase 
            key={index}
            width={80} 
            height={36} 
            borderRadius={18}
            style={styles.filterTabSkeleton}
          />
        ))}
      </View>

      {/* Booking Cards */}
      <View style={styles.bookingsContainer}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <View key={index} style={styles.bookingCard}>
            {/* Booking Header */}
            <View style={styles.bookingHeader}>
              <View style={styles.vehicleInfo}>
                <SkeletonBase 
                  width={180} 
                  height={20} 
                  borderRadius={4}
                  style={styles.vehicleNameSkeleton}
                />
                <SkeletonBase 
                  width={60} 
                  height={16} 
                  borderRadius={4}
                  style={styles.vehicleYearSkeleton}
                />
              </View>
              <SkeletonBase 
                width={80} 
                height={28} 
                borderRadius={14}
                style={styles.statusBadgeSkeleton}
              />
            </View>

            {/* Booking Details */}
            <View style={styles.bookingDetails}>
              <View style={styles.detailRow}>
                <SkeletonBase 
                  width={16} 
                  height={16} 
                  borderRadius={8}
                  style={styles.iconSkeleton}
                />
                <SkeletonBase 
                  width={200} 
                  height={16} 
                  borderRadius={4}
                  style={styles.detailTextSkeleton}
                />
              </View>
              
              <View style={styles.detailRow}>
                <SkeletonBase 
                  width={16} 
                  height={16} 
                  borderRadius={8}
                  style={styles.iconSkeleton}
                />
                <SkeletonBase 
                  width={150} 
                  height={16} 
                  borderRadius={4}
                  style={styles.detailTextSkeleton}
                />
              </View>
              
              <View style={styles.detailRow}>
                <SkeletonBase 
                  width={16} 
                  height={16} 
                  borderRadius={8}
                  style={styles.iconSkeleton}
                />
                <SkeletonBase 
                  width={80} 
                  height={16} 
                  borderRadius={4}
                  style={styles.detailTextSkeleton}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.bookingActions}>
              <SkeletonBase 
                width={100} 
                height={36} 
                borderRadius={18}
                style={styles.actionButtonSkeleton}
              />
              {index % 2 === 0 && ( // Show cancel button for some cards
                <SkeletonBase 
                  width={80} 
                  height={36} 
                  borderRadius={18}
                  style={styles.actionButtonSkeleton}
                />
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  statsSection: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumberSkeleton: {
    marginBottom: spacing.xs,
  },
  statLabelSkeleton: {
    marginBottom: 0,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterTabSkeleton: {
    marginRight: 0,
  },
  bookingsContainer: {
    paddingHorizontal: spacing.lg,
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  vehicleNameSkeleton: {
    marginBottom: spacing.xs,
  },
  vehicleYearSkeleton: {
    marginBottom: 0,
  },
  statusBadgeSkeleton: {
    marginLeft: spacing.sm,
  },
  bookingDetails: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSkeleton: {
    marginRight: spacing.sm,
  },
  detailTextSkeleton: {
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  actionButtonSkeleton: {
    marginLeft: 0,
  },
});