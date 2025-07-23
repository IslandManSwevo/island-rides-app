import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { VehicleCardSkeleton } from './VehicleCardSkeleton';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface SearchResultsSkeletonProps {
  itemCount?: number;
  compact?: boolean;
  showHeader?: boolean;
}

export const SearchResultsSkeleton: React.FC<SearchResultsSkeletonProps> = ({
  itemCount = 6,
  compact = false,
  showHeader = true,
}) => {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Search Results Header */}
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <SkeletonBase width={120} height={20} />
            <SkeletonBase width={80} height={16} />
          </View>
          
          {/* Filter Summary */}
          <View style={styles.filterSummary}>
            <SkeletonBase width={60} height={24} borderRadius={borderRadius.lg} />
            <SkeletonBase width={70} height={24} borderRadius={borderRadius.lg} />
            <SkeletonBase width={50} height={24} borderRadius={borderRadius.lg} />
          </View>
        </View>
      )}

      {/* Vehicle Cards */}
      {Array.from({ length: itemCount }, (_, index) => (
        <VehicleCardSkeleton 
          key={`skeleton-${index}`} 
          compact={compact}
        />
      ))}
      
      {/* Load More Skeleton */}
      <View style={styles.loadMoreContainer}>
        <SkeletonBase 
          width="50%" 
          height={44} 
          borderRadius={borderRadius.lg}
        />
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
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  filterSummary: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});