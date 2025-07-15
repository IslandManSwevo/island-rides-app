import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerLoading from './ShimmerLoading';
import { borderRadius, spacing, shadows, colors } from '../styles/Theme';

const VehicleCardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Image skeleton */}
        <ShimmerLoading width={350} height={180} borderRadius={borderRadius.lg} />
        
        {/* Content skeleton */}
        <View style={styles.content}>
          {/* Title and year */}
          <View style={styles.header}>
            <ShimmerLoading width={200} height={24} borderRadius={borderRadius.sm} />
            <ShimmerLoading width={40} height={20} borderRadius={borderRadius.sm} />
          </View>
          
          {/* Description */}
          <ShimmerLoading width={350} height={16} borderRadius={borderRadius.sm} style={styles.description} />
          <ShimmerLoading width={280} height={16} borderRadius={borderRadius.sm} style={styles.description} />
          
          {/* Features */}
          <View style={styles.features}>
            <ShimmerLoading width={80} height={14} borderRadius={borderRadius.sm} />
            <ShimmerLoading width={80} height={14} borderRadius={borderRadius.sm} />
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <ShimmerLoading width={80} height={32} borderRadius={borderRadius.md} />
            <ShimmerLoading width={100} height={14} borderRadius={borderRadius.sm} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.large,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    marginBottom: spacing.xs,
  },
  features: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default VehicleCardSkeleton;
