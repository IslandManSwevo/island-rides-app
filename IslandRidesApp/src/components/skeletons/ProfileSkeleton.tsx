import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

export const ProfileSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {/* Avatar */}
        <SkeletonBase 
          width={80} 
          height={80} 
          borderRadius={40}
          style={styles.avatarSkeleton}
        />
        
        {/* Name and Email */}
        <View style={styles.userInfo}>
          <SkeletonBase 
            width={150} 
            height={24} 
            borderRadius={4}
            style={styles.nameSkeleton}
          />
          <SkeletonBase 
            width={200} 
            height={16} 
            borderRadius={4}
            style={styles.emailSkeleton}
          />
        </View>
        
        {/* Edit Button */}
        <SkeletonBase 
          width={80} 
          height={32} 
          borderRadius={16}
          style={styles.editButtonSkeleton}
        />
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <SkeletonBase 
            width={40} 
            height={32} 
            borderRadius={4}
            style={styles.statNumberSkeleton}
          />
          <SkeletonBase 
            width={60} 
            height={14} 
            borderRadius={4}
            style={styles.statLabelSkeleton}
          />
        </View>
        
        <View style={styles.statItem}>
          <SkeletonBase 
            width={40} 
            height={32} 
            borderRadius={4}
            style={styles.statNumberSkeleton}
          />
          <SkeletonBase 
            width={60} 
            height={14} 
            borderRadius={4}
            style={styles.statLabelSkeleton}
          />
        </View>
        
        <View style={styles.statItem}>
          <SkeletonBase 
            width={40} 
            height={32} 
            borderRadius={4}
            style={styles.statNumberSkeleton}
          />
          <SkeletonBase 
            width={60} 
            height={14} 
            borderRadius={4}
            style={styles.statLabelSkeleton}
          />
        </View>
      </View>

      {/* Recent Bookings Section */}
      <View style={styles.bookingsSection}>
        <SkeletonBase 
          width={140} 
          height={20} 
          borderRadius={4}
          style={styles.sectionTitleSkeleton}
        />
        
        {/* Booking Cards */}
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.bookingCard}>
            {/* Booking Header */}
            <View style={styles.bookingHeader}>
              <SkeletonBase 
                width={180} 
                height={18} 
                borderRadius={4}
                style={styles.vehicleNameSkeleton}
              />
              <SkeletonBase 
                width={80} 
                height={24} 
                borderRadius={12}
                style={styles.statusBadgeSkeleton}
              />
            </View>
            
            {/* Booking Details */}
            <View style={styles.bookingDetails}>
              <SkeletonBase 
                width="100%" 
                height={16} 
                borderRadius={4}
                style={styles.detailLineSkeleton}
              />
              <SkeletonBase 
                width="80%" 
                height={16} 
                borderRadius={4}
                style={styles.detailLineSkeleton}
              />
              <SkeletonBase 
                width="60%" 
                height={16} 
                borderRadius={4}
                style={styles.detailLineSkeleton}
              />
            </View>
            
            {/* Action Button (for some cards) */}
            {index === 0 && (
              <View style={styles.bookingActions}>
                <SkeletonBase 
                  width={120} 
                  height={32} 
                  borderRadius={16}
                  style={styles.actionButtonSkeleton}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Menu Options */}
      <View style={styles.menuSection}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <SkeletonBase 
                width={24} 
                height={24} 
                borderRadius={12}
                style={styles.menuIconSkeleton}
              />
              <SkeletonBase 
                width={120} 
                height={18} 
                borderRadius={4}
                style={styles.menuTextSkeleton}
              />
            </View>
            <SkeletonBase 
              width={20} 
              height={20} 
              borderRadius={10}
              style={styles.chevronSkeleton}
            />
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
  profileHeader: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  avatarSkeleton: {
    marginBottom: spacing.md,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nameSkeleton: {
    marginBottom: spacing.xs,
  },
  emailSkeleton: {
    marginBottom: 0,
  },
  editButtonSkeleton: {
    marginTop: spacing.sm,
  },
  statsSection: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumberSkeleton: {
    marginBottom: spacing.xs,
  },
  statLabelSkeleton: {
    marginBottom: 0,
  },
  bookingsSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  sectionTitleSkeleton: {
    marginBottom: spacing.lg,
  },
  bookingCard: {
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vehicleNameSkeleton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadgeSkeleton: {
    marginLeft: spacing.sm,
  },
  bookingDetails: {
    gap: spacing.xs,
  },
  detailLineSkeleton: {
    marginBottom: spacing.xs,
  },
  bookingActions: {
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  actionButtonSkeleton: {
    marginTop: 0,
  },
  menuSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconSkeleton: {
    marginRight: spacing.md,
  },
  menuTextSkeleton: {
    flex: 1,
  },
  chevronSkeleton: {
    marginLeft: spacing.sm,
  },
});