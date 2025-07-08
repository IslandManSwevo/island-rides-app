import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { VehicleFeature, VehicleFeatureCategory } from '../types';
import { vehicleFeatureService } from '../services/vehicleFeatureService';

interface VehicleFeatureListProps {
  features: VehicleFeature[];
  style?: any;
  showCategories?: boolean;
  showPremiumBadges?: boolean;
  showAdditionalCosts?: boolean;
  interactive?: boolean;
  onFeaturePress?: (feature: VehicleFeature) => void;
  compact?: boolean;
  maxVisibleFeatures?: number;
}

export const VehicleFeatureList: React.FC<VehicleFeatureListProps> = ({
  features,
  style,
  showCategories = true,
  showPremiumBadges = true,
  showAdditionalCosts = false,
  interactive = false,
  onFeaturePress,
  compact = false,
  maxVisibleFeatures,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  if (!features || features.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noFeaturesText}>No features listed</Text>
      </View>
    );
  }

  const featuresByCategory = vehicleFeatureService.formatFeaturesByCategory(features);
  const categoryNames = Object.keys(featuresByCategory);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handleFeaturePress = (feature: VehicleFeature) => {
    if (interactive && onFeaturePress) {
      onFeaturePress(feature);
    } else if (feature.description) {
      Alert.alert(feature.name, feature.description);
    }
  };

  const getFeatureIcon = (iconName: string) => {
    // Map icon names to actual icons/emojis
    const iconMap: Record<string, string> = {
      'snowflake': '❄️',
      'fire': '🔥',
      'badge': '🏆',
      'maximize': '⚡',
      'sun': '☀️',
      'bluetooth': '📶',
      'navigation': '🧭',
      'usb': '🔌',
      'camera': '📷',
      'smartphone': '📱',
      'volume-2': '🔊',
      'shield': '🛡️',
      'disc': '🛞',
      'settings': '⚙️',
      'eye': '👁️',
      'alert-triangle': '⚠️',
      'zap': '⚡',
      'truck': '🚛',
      'gauge': '📊',
      'key': '🔑',
      'power': '🔋',
      'lightbulb': '💡',
      'circle': '⭕',
      'package': '📦',
      'square': '⬛',
    };
    return iconMap[iconName] || '✨';
  };

  const renderFeatureItem = (feature: VehicleFeature, index: number) => (
    <TouchableOpacity
      key={feature.id}
      style={[
        styles.featureItem,
        compact && styles.compactFeatureItem,
        interactive && styles.interactiveFeatureItem,
      ]}
      onPress={() => handleFeaturePress(feature)}
      disabled={!interactive && !feature.description}
    >
      <View style={styles.featureContent}>
        <View style={styles.featureIconContainer}>
          <Text style={styles.featureIcon}>
            {getFeatureIcon(feature.iconName)}
          </Text>
        </View>
        
        <View style={styles.featureTextContainer}>
          <View style={styles.featureNameRow}>
            <Text style={[styles.featureName, compact && styles.compactFeatureName]}>
              {feature.name}
            </Text>
            
            {showPremiumBadges && feature.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>
          
          {!compact && feature.description && (
            <Text style={styles.featureDescription} numberOfLines={2}>
              {feature.description}
            </Text>
          )}
          
          {showAdditionalCosts && feature.additionalCost && feature.additionalCost > 0 && (
            <Text style={styles.additionalCost}>
              +${feature.additionalCost}/day
            </Text>
          )}
        </View>

        {feature.isIncluded !== undefined && (
          <View style={styles.inclusionIndicator}>
            <Text style={[
              styles.inclusionText,
              feature.isIncluded ? styles.includedText : styles.notIncludedText
            ]}>
              {feature.isIncluded ? '✓' : '✕'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCategorySection = (categoryName: string, categoryFeatures: VehicleFeature[]) => {
    const isExpanded = expandedCategories[categoryName] !== false; // Default to expanded
    const displayFeatures = maxVisibleFeatures && !showAllFeatures 
      ? categoryFeatures.slice(0, maxVisibleFeatures)
      : categoryFeatures;

    return (
      <View key={categoryName} style={styles.categorySection}>
        {showCategories && (
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => toggleCategory(categoryName)}
          >
            <Text style={styles.categoryTitle}>{categoryName}</Text>
            <View style={styles.categoryMeta}>
              <Text style={styles.categoryCount}>
                {categoryFeatures.length} feature{categoryFeatures.length !== 1 ? 's' : ''}
              </Text>
              <Text style={[styles.expandIcon, { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }]}>
                ⌄
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {isExpanded && (
          <View style={styles.featuresContainer}>
            {displayFeatures.map((feature, index) => renderFeatureItem(feature, index))}
            
            {maxVisibleFeatures && !showAllFeatures && categoryFeatures.length > maxVisibleFeatures && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllFeatures(true)}
              >
                <Text style={styles.showMoreText}>
                  Show {categoryFeatures.length - maxVisibleFeatures} more features
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCompactList = () => {
    const allFeatures = showAllFeatures || !maxVisibleFeatures 
      ? features 
      : features.slice(0, maxVisibleFeatures);

    return (
      <View style={[styles.container, style]}>
        <View style={styles.compactGrid}>
          {allFeatures.map((feature, index) => renderFeatureItem(feature, index))}
        </View>
        
        {maxVisibleFeatures && !showAllFeatures && features.length > maxVisibleFeatures && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAllFeatures(true)}
          >
            <Text style={styles.showMoreText}>
              +{features.length - maxVisibleFeatures} more features
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (compact) {
    return renderCompactList();
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {categoryNames.map(categoryName => 
          renderCategorySection(categoryName, featuresByCategory[categoryName])
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noFeaturesText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  featuresContainer: {
    paddingHorizontal: 4,
  },
  featureItem: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compactFeatureItem: {
    padding: 8,
    marginBottom: 6,
    marginRight: 8,
    flex: 1,
    minWidth: '45%',
  },
  interactiveFeatureItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  compactFeatureName: {
    fontSize: 14,
  },
  premiumBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  additionalCost: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  inclusionIndicator: {
    marginLeft: 12,
  },
  inclusionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  includedText: {
    color: '#10b981',
  },
  notIncludedText: {
    color: '#ef4444',
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  showMoreButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  showMoreText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
}); 