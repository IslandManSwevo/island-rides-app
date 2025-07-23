import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFeatureFlag, useEnhancedNavigation } from '../../hooks/useFeatureFlags';
import { colors, spacing } from '../../styles/theme';
import { smartIslandSelectionService, SmartIslandRecommendation } from '../../services/SmartIslandSelectionService';
import { locationService } from '../../services/LocationService';
import { Island } from '../../types';

/**
 * Smart Island Selector Component
 * 
 * This component provides intelligent island selection with location-based
 * recommendations, distance calculations, and enhanced user experience.
 * 
 * BROWNFIELD SAFETY:
 * - Only renders when SMART_ISLAND_SELECTION feature flag is enabled
 * - Falls back gracefully to basic island list when disabled
 * - Preserves all existing island selection patterns
 * - Can be instantly rolled back via Epic 1 procedures
 */

interface SmartIslandSelectorProps {
  onIslandSelect: (island: string) => void;
  selectedIsland?: string;
  showDistances?: boolean;
  showRecommendationReasons?: boolean;
  maxRecommendations?: number;
}

export const SmartIslandSelector: React.FC<SmartIslandSelectorProps> = ({
  onIslandSelect,
  selectedIsland,
  showDistances = true,
  showRecommendationReasons = true,
  maxRecommendations = 5,
}) => {
  // Feature flag checks
  const isSmartSelectionEnabled = useFeatureFlag('SMART_ISLAND_SELECTION');
  const { actions } = useEnhancedNavigation();

  // State management
  const [recommendations, setRecommendations] = useState<SmartIslandRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Early return if feature flag is disabled (brownfield safety)
  if (!isSmartSelectionEnabled) {
    actions.logNavigationEvent('smart_island_selection_disabled', {
      flag: 'SMART_ISLAND_SELECTION',
      fallback: 'basic_island_list'
    });
    return null; // This will cause parent to show basic island selection
  }

  // Load smart recommendations
  const loadSmartRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      actions.logNavigationEvent('smart_island_recommendations_loading_start');

      // Try to get user location
      const locationData = await locationService.getCurrentLocation();
      if (locationData) {
        setUserLocation(locationData.coords);
        setLocationPermissionStatus('granted');
        actions.logNavigationEvent('user_location_obtained', {
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude
        });
      } else {
        setLocationPermissionStatus('denied');
        actions.logNavigationEvent('user_location_denied');
      }

      // Get smart recommendations
      const smartRecommendations = await smartIslandSelectionService.getSmartRecommendations(
        locationData?.coords,
        maxRecommendations
      );

      setRecommendations(smartRecommendations);
      actions.logNavigationEvent('smart_island_recommendations_loaded', {
        count: smartRecommendations.length,
        hasLocation: !!locationData
      });

    } catch (error) {
      console.error('Failed to load smart recommendations:', error);
      actions.logNavigationEvent('smart_island_recommendations_error', { error: error.message });
      
      // Show user-friendly error
      Alert.alert(
        'Location Services',
        'Unable to get location-based recommendations. Showing popular destinations instead.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [actions, maxRecommendations]);

  const handleIslandSelect = async (recommendation: SmartIslandRecommendation) => {
    try {
      actions.logNavigationEvent('smart_island_selected', {
        island: recommendation.island,
        distance: recommendation.distance,
        confidence: recommendation.confidence,
        isCurrentLocation: recommendation.isCurrentLocation
      });

      // Record the selection for future recommendations
      await smartIslandSelectionService.recordIslandSearch(recommendation.island);

      // Call parent handler with display island ID
      onIslandSelect(recommendation.islandOption.id);

    } catch (error) {
      console.error('Error handling island selection:', error);
      // Still proceed with selection even if recording fails
      onIslandSelect(recommendation.islandOption.id);
    }
  };

  const requestLocationPermission = async () => {
    try {
      actions.logNavigationEvent('location_permission_requested');
      
      const locationData = await locationService.getCurrentLocation();
      if (locationData) {
        setUserLocation(locationData.coords);
        setLocationPermissionStatus('granted');
        
        // Reload recommendations with location
        await loadSmartRecommendations();
        
        actions.logNavigationEvent('location_permission_granted');
      } else {
        setLocationPermissionStatus('denied');
        actions.logNavigationEvent('location_permission_denied');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermissionStatus('denied');
    }
  };

  // Load recommendations on component mount
  useEffect(() => {
    loadSmartRecommendations();
  }, [loadSmartRecommendations]);

  const renderLocationPrompt = () => {
    if (locationPermissionStatus !== 'denied' || userLocation) return null;

    return (
      <View style={styles.locationPrompt}>
        <View style={styles.locationPromptContent}>
          <Ionicons name="location-outline" size={24} color={colors.primary} />
          <Text style={styles.locationPromptTitle}>Enable Location for Better Recommendations</Text>
          <Text style={styles.locationPromptText}>
            We can show you islands near your location with travel times and distances.
          </Text>
          <TouchableOpacity
            style={styles.locationPromptButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.locationPromptButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRecommendationCard = (recommendation: SmartIslandRecommendation) => {
    const isSelected = selectedIsland === recommendation.islandOption.id;
    
    return (
      <TouchableOpacity
        key={recommendation.island}
        style={[
          styles.recommendationCard,
          isSelected && styles.selectedCard,
          recommendation.isCurrentLocation && styles.currentLocationCard
        ]}
        onPress={() => handleIslandSelect(recommendation)}
        testID={`smart-island-${recommendation.island}`}
      >
        {/* Island Header */}
        <View style={styles.cardHeader}>
          <View style={styles.islandTitleContainer}>
            <Text style={styles.islandEmoji}>{recommendation.islandOption.emoji}</Text>
            <View style={styles.islandTitleText}>
              <Text style={styles.islandName}>{recommendation.islandOption.name}</Text>
              <Text style={styles.islandDescription}>{recommendation.islandOption.description}</Text>
            </View>
          </View>
          
          {/* Confidence Badge */}
          <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(recommendation.confidence) }]}>
            <Text style={styles.confidenceText}>
              {Math.round(recommendation.confidence * 100)}%
            </Text>
          </View>
        </View>

        {/* Distance and Travel Time */}
        {showDistances && userLocation && (
          <View style={styles.distanceContainer}>
            <View style={styles.distanceItem}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.distanceText}>
                {recommendation.distance < 1000 
                  ? `${recommendation.distance.toFixed(0)} km away`
                  : 'Distance unknown'
                }
              </Text>
            </View>
            
            <View style={styles.distanceItem}>
              <Ionicons name="time" size={16} color={colors.secondary} />
              <Text style={styles.distanceText}>
                ~{recommendation.travelTime} min travel
              </Text>
            </View>
          </View>
        )}

        {/* Special Indicators */}
        <View style={styles.indicatorsContainer}>
          {recommendation.isCurrentLocation && (
            <View style={styles.indicator}>
              <Ionicons name="location" size={14} color={colors.success} />
              <Text style={styles.indicatorText}>Current Location</Text>
            </View>
          )}
          
          {recommendation.isPreviouslyVisited && (
            <View style={styles.indicator}>
              <Ionicons name="checkmark-circle" size={14} color={colors.info} />
              <Text style={styles.indicatorText}>Previously Visited</Text>
            </View>
          )}
        </View>

        {/* Recommendation Reasons */}
        {showRecommendationReasons && recommendation.reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            {recommendation.reasons.slice(0, 2).map((reason, index) => (
              <Text key={index} style={styles.reasonText}>
                • {reason}
              </Text>
            ))}
          </View>
        )}

        {/* Island Features */}
        <View style={styles.featuresContainer}>
          {recommendation.islandOption.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return colors.success;
    if (confidence >= 0.6) return colors.warning;
    return colors.textSecondary;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding the best islands for you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="smart-island-selector">
      {renderLocationPrompt()}
      
      <View style={styles.header}>
        <Text style={styles.title}>
          {userLocation ? 'Recommended for You' : 'Popular Destinations'}
        </Text>
        <Text style={styles.subtitle}>
          {userLocation 
            ? 'Based on your location and preferences'
            : 'Enable location for personalized recommendations'
          }
        </Text>
      </View>

      <ScrollView 
        style={styles.recommendationsContainer}
        showsVerticalScrollIndicator={false}
      >
        {recommendations.map(renderRecommendationCard)}
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = {
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  locationPrompt: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationPromptContent: {
    alignItems: 'center',
  },
  locationPromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  locationPromptText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  locationPromptButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  locationPromptButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recommendationsContainer: {
    paddingHorizontal: spacing.lg,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  currentLocationCard: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  islandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  islandEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  islandTitleText: {
    flex: 1,
  },
  islandName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  islandDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surface,
  },
  distanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  distanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGrey,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  indicatorText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  reasonsContainer: {
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  featureText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
};

export default SmartIslandSelector;
