import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../styles/theme';
import { VehicleFeature, VehicleFeatureCategory } from '../types';

interface FeaturesFilterProps {
  features: number[];
  availableFeatures: VehicleFeature[];
  featureCategories: VehicleFeatureCategory[];
  loadingFeatures: boolean;
  onToggleFeature: (featureId: number) => void;
}

const FeaturesFilter: React.FC<FeaturesFilterProps> = React.memo(({ features, availableFeatures, featureCategories, loadingFeatures, onToggleFeature }) => {
  // Convert features array to Set for O(1) lookup performance
  const featuresSet = useMemo(() => new Set(features), [features]);

  const renderFeatureChip = useCallback((feature: VehicleFeature) => {
    const isSelected = featuresSet.has(feature.id);
    const accessibilityLabel = `${feature.name}${feature.isPremium ? ', premium feature' : ''}${isSelected ? ', selected' : ', not selected'}`;
    
    return (
      <TouchableOpacity
        key={feature.id}
        style={[
          styles.featureChip,
          isSelected && styles.featureChipSelected
        ]}
        onPress={() => onToggleFeature(feature.id)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Text style={[
          styles.featureChipText,
          featuresSet.has(feature.id) && styles.featureChipTextSelected
        ]}>
          {feature.name}
        </Text>
        {feature.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>★</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [featuresSet, onToggleFeature]);

  const renderCategorySection = useCallback((category: VehicleFeatureCategory) => {
    const categoryFeatures = availableFeatures.filter(f => f.categoryId === category.id);
    if (categoryFeatures.length === 0) return null;
    
    return (
      <View key={category.id} style={styles.featureCategorySection}>
        <Text style={styles.featureCategoryTitle}>{category.name}</Text>
        <View style={styles.featuresGrid}>
          {categoryFeatures.map(renderFeatureChip)}
        </View>
      </View>
    );
  }, [availableFeatures, renderFeatureChip]);

  if (loadingFeatures || availableFeatures.length === 0) {
    return null;
  }

  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>
        Features ({features.length} selected)
      </Text>
      <ScrollView 
        style={styles.featuresScrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {featureCategories.map(renderCategorySection)}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.darkGrey,
  },
  featuresScrollView: {
    maxHeight: 250,
  },
  featureCategorySection: {
    marginBottom: spacing.md,
  },
  featureCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGrey,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  featureChipText: {
    fontSize: 14,
    color: colors.text,
  },
  featureChipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  premiumBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.star,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default FeaturesFilter;