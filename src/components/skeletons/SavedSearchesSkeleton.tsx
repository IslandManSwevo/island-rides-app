import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface SavedSearchesSkeletonProps {
  itemCount?: number;
}

export const SavedSearchesSkeleton: React.FC<SavedSearchesSkeletonProps> = ({ 
  itemCount = 4 
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Statistics Card */}
      <View style={styles.statisticsCard}>
        <SkeletonBase 
          width={150} 
          height={20} 
          borderRadius={4}
          style={styles.statisticsTitleSkeleton}
        />
        
        <View style={styles.statisticsGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.statItem}>
              <SkeletonBase 
                width={30} 
                height={24} 
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
          ))}
        </View>
        
        {/* Top Search */}
        <View style={styles.topSearchContainer}>
          <SkeletonBase 
            width={120} 
            height={14} 
            borderRadius={4}
            style={styles.topSearchLabelSkeleton}
          />
          <SkeletonBase 
            width={180} 
            height={16} 
            borderRadius={4}
            style={styles.topSearchNameSkeleton}
          />
          <SkeletonBase 
            width={80} 
            height={14} 
            borderRadius={4}
            style={styles.topSearchMatchesSkeleton}
          />
        </View>
      </View>

      {/* Search Items */}
      <View style={styles.searchesContainer}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <View key={index} style={styles.searchItem}>
            {/* Search Header */}
            <View style={styles.searchHeader}>
              <View style={styles.searchTitleContainer}>
                <SkeletonBase 
                  width={160} 
                  height={18} 
                  borderRadius={4}
                  style={styles.searchTitleSkeleton}
                />
                <SkeletonBase 
                  width={220} 
                  height={14} 
                  borderRadius={4}
                  style={styles.searchSummarySkeleton}
                />
              </View>
              
              <View style={styles.searchActions}>
                <SkeletonBase 
                  width={32} 
                  height={32} 
                  borderRadius={16}
                  style={styles.actionButtonSkeleton}
                />
                <SkeletonBase 
                  width={32} 
                  height={32} 
                  borderRadius={16}
                  style={styles.actionButtonSkeleton}
                />
              </View>
            </View>
            
            {/* Search Stats */}
            <View style={styles.searchStats}>
              <View style={styles.statItemSmall}>
                <SkeletonBase 
                  width={16} 
                  height={16} 
                  borderRadius={8}
                  style={styles.iconSkeleton}
                />
                <SkeletonBase 
                  width={80} 
                  height={14} 
                  borderRadius={4}
                  style={styles.statValueSkeleton}
                />
              </View>
              
              <View style={styles.statItemSmall}>
                <SkeletonBase 
                  width={16} 
                  height={16} 
                  borderRadius={8}
                  style={styles.iconSkeleton}
                />
                <SkeletonBase 
                  width={100} 
                  height={14} 
                  borderRadius={4}
                  style={styles.statValueSkeleton}
                />
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.searchItemActions}>
              <SkeletonBase 
                width={100} 
                height={36} 
                borderRadius={18}
                style={styles.primaryButtonSkeleton}
              />
              <SkeletonBase 
                width={80} 
                height={36} 
                borderRadius={18}
                style={styles.secondaryButtonSkeleton}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Recent Alerts Section */}
      <View style={styles.alertsSection}>
        <SkeletonBase 
          width={120} 
          height={20} 
          borderRadius={4}
          style={styles.sectionTitleSkeleton}
        />
        
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.alertItem}>
            <View style={styles.alertHeader}>
              <SkeletonBase 
                width={24} 
                height={24} 
                borderRadius={12}
                style={styles.alertIconSkeleton}
              />
              <View style={styles.alertContent}>
                <SkeletonBase 
                  width={180} 
                  height={16} 
                  borderRadius={4}
                  style={styles.alertTitleSkeleton}
                />
                <SkeletonBase 
                  width={140} 
                  height={14} 
                  borderRadius={4}
                  style={styles.alertTimeSkeleton}
                />
              </View>
              <SkeletonBase 
                width={20} 
                height={20} 
                borderRadius={10}
                style={styles.chevronSkeleton}
              />
            </View>
            
            <SkeletonBase 
              width="100%" 
              height={14} 
              borderRadius={4}
              style={styles.alertDescriptionSkeleton}
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
  statisticsCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statisticsTitleSkeleton: {
    marginBottom: spacing.lg,
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumberSkeleton: {
    marginBottom: spacing.xs,
  },
  statLabelSkeleton: {
    marginBottom: 0,
  },
  topSearchContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  topSearchLabelSkeleton: {
    marginBottom: spacing.xs,
  },
  topSearchNameSkeleton: {
    marginBottom: spacing.xs,
  },
  topSearchMatchesSkeleton: {
    marginBottom: 0,
  },
  searchesContainer: {
    paddingHorizontal: spacing.lg,
  },
  searchItem: {
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
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  searchTitleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  searchTitleSkeleton: {
    marginBottom: spacing.xs,
  },
  searchSummarySkeleton: {
    marginBottom: 0,
  },
  searchActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButtonSkeleton: {
    marginLeft: 0,
  },
  searchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItemSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconSkeleton: {
    marginRight: spacing.sm,
  },
  statValueSkeleton: {
    flex: 1,
  },
  searchItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  primaryButtonSkeleton: {
    flex: 1,
  },
  secondaryButtonSkeleton: {
    flex: 1,
  },
  alertsSection: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitleSkeleton: {
    marginBottom: spacing.lg,
  },
  alertItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertIconSkeleton: {
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleSkeleton: {
    marginBottom: spacing.xs,
  },
  alertTimeSkeleton: {
    marginBottom: 0,
  },
  chevronSkeleton: {
    marginLeft: spacing.sm,
  },
  alertDescriptionSkeleton: {
    marginTop: spacing.xs,
  },
});