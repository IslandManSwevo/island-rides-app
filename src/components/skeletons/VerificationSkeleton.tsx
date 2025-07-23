import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBase } from './SkeletonBase';
import { colors, spacing, borderRadius } from '../../styles/theme';

export const VerificationSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonBase width={180} height={24} style={styles.title} />
        <SkeletonBase width="100%" height={16} style={styles.subtitle} />
        <SkeletonBase width="100%" height={16} style={styles.subtitleLine2} />
        
        {/* Verification Score */}
        <View style={styles.scoreContainer}>
          <SkeletonBase width={120} height={16} />
          <SkeletonBase width={40} height={20} />
        </View>
      </View>

      {/* Verification Items */}
      <View style={styles.verificationList}>
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.verificationItem}>
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <SkeletonBase width={24} height={24} borderRadius={12} />
                <View style={styles.itemText}>
                  <SkeletonBase width={120} height={18} />
                  <SkeletonBase width={80} height={14} style={styles.itemDescription} />
                </View>
              </View>
              <SkeletonBase width={60} height={16} />
            </View>
            
            {/* Document Upload Section */}
            <View style={styles.documentSection}>
              <SkeletonBase width="100%" height={100} borderRadius={8} style={styles.documentPreview} />
              <View style={styles.uploadButtons}>
                <SkeletonBase width={100} height={36} borderRadius={18} />
                <SkeletonBase width={80} height={36} borderRadius={18} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <SkeletonBase width={140} height={20} style={styles.progressTitle} />
        <SkeletonBase width="100%" height={8} borderRadius={4} style={styles.progressBar} />
        <View style={styles.progressStats}>
          <SkeletonBase width={80} height={14} />
          <SkeletonBase width={60} height={14} />
        </View>
      </View>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <SkeletonBase width={160} height={20} style={styles.benefitsTitle} />
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.benefitItem}>
            <SkeletonBase width={20} height={20} borderRadius={10} />
            <SkeletonBase width={200} height={16} style={styles.benefitText} />
          </View>
        ))}
      </View>

      {/* Action Button */}
      <View style={styles.actionSection}>
        <SkeletonBase width="100%" height={48} borderRadius={24} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginBottom: spacing.xs,
  },
  subtitleLine2: {
    marginBottom: spacing.md,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  verificationList: {
    padding: spacing.lg,
  },
  verificationItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  itemDescription: {
    marginTop: spacing.xs,
  },
  documentSection: {
    marginTop: spacing.md,
  },
  documentPreview: {
    marginBottom: spacing.md,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  progressTitle: {
    marginBottom: spacing.md,
  },
  progressBar: {
    marginBottom: spacing.sm,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  benefitsSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  benefitsTitle: {
    marginBottom: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  benefitText: {
    marginLeft: spacing.md,
  },
  actionSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
});