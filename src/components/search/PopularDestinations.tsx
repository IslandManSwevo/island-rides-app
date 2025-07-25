/**
 * Popular Destinations Component
 * Displays trending and popular destinations with quick selection
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { analyticsService, PopularDestination as AnalyticsDestination } from '../../services/analyticsService';
import { loggingService } from '../../services/LoggingService';

const { width: screenWidth } = Dimensions.get('window');

export interface PopularDestination {
  id: string;
  name: string;
  description: string;
  image?: string;
  vehicleCount: number;
  averagePrice: number;
  rating: number;
  trending?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface PopularDestinationsProps {
  destinations?: PopularDestination[];
  onDestinationSelect: (destination: PopularDestination) => void;
  layout?: 'horizontal' | 'grid';
  showTrending?: boolean;
  maxItems?: number;
  enableAnalytics?: boolean;
  refreshInterval?: number; // in minutes
}

export const PopularDestinations: React.FC<PopularDestinationsProps> = React.memo(({
  destinations: propDestinations,
  onDestinationSelect,
  layout = 'horizontal',
  showTrending = true,
  maxItems = 6,
  enableAnalytics = true,
  refreshInterval = 30, // 30 minutes
}) => {
  const [analyticsDestinations, setAnalyticsDestinations] = useState<AnalyticsDestination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Load analytics-driven destinations
  const loadAnalyticsDestinations = useCallback(async () => {
    if (!enableAnalytics) return;

    try {
      setIsLoading(true);
      const destinations = await analyticsService.getPopularDestinations(maxItems);
      setAnalyticsDestinations(destinations);
      setLastRefresh(Date.now());

      loggingService.info('Popular destinations loaded from analytics', {
        count: destinations.length,
        trending: destinations.filter(d => d.trending).length
      });
    } catch (error) {
      loggingService.warn('Failed to load analytics destinations', error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enableAnalytics, maxItems]);

  // Auto-refresh destinations
  useEffect(() => {
    loadAnalyticsDestinations();

    const interval = setInterval(() => {
      const timeSinceLastRefresh = Date.now() - lastRefresh;
      if (timeSinceLastRefresh > refreshInterval * 60 * 1000) {
        loadAnalyticsDestinations();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [loadAnalyticsDestinations, lastRefresh, refreshInterval]);

  // Convert analytics destinations to component format
  const convertedAnalyticsDestinations = useMemo(() => {
    return analyticsDestinations.map(dest => ({
      id: dest.id,
      name: dest.name,
      description: dest.description,
      image: dest.image,
      vehicleCount: dest.vehicleCount,
      averagePrice: dest.averagePrice,
      rating: dest.rating,
      trending: dest.trending,
      coordinates: dest.coordinates,
    }));
  }, [analyticsDestinations]);

  // Use analytics destinations if available, otherwise use props
  const destinations = enableAnalytics && analyticsDestinations.length > 0
    ? convertedAnalyticsDestinations
    : (propDestinations || []);
  // Filter and sort destinations
  const processedDestinations = useMemo(() => {
    let filtered = destinations;
    
    if (showTrending) {
      // Sort by trending first, then by rating
      filtered = filtered.sort((a, b) => {
        if (a.trending && !b.trending) return -1;
        if (!a.trending && b.trending) return 1;
        return b.rating - a.rating;
      });
    } else {
      // Sort by rating
      filtered = filtered.sort((a, b) => b.rating - a.rating);
    }
    
    return filtered.slice(0, maxItems);
  }, [destinations, showTrending, maxItems]);

  // Calculate item dimensions based on layout
  const itemDimensions = useMemo(() => {
    if (layout === 'grid') {
      const itemWidth = (screenWidth - spacing.lg * 3) / 2;
      return { width: itemWidth, height: 180 };
    } else {
      return { width: 280, height: 160 };
    }
  }, [layout]);

  // Format price
  const formatPrice = useCallback((price: number) => {
    return `$${price}/day`;
  }, []);

  // Enhanced destination selection with analytics
  const handleDestinationSelect = useCallback((destination: PopularDestination) => {
    onDestinationSelect(destination);

    // Track analytics
    analyticsService.trackDestinationSelection(
      destination.id,
      destination.name,
      'popular',
    );

    analyticsService.trackEvent('popular_destination_selected', {
      destinationId: destination.id,
      destinationName: destination.name,
      trending: destination.trending,
      rating: destination.rating,
      averagePrice: destination.averagePrice,
      layout,
      position: processedDestinations.findIndex(d => d.id === destination.id),
    });
  }, [onDestinationSelect, layout, processedDestinations]);

  // Render destination item
  const renderDestinationItem = useCallback(({ item }: { item: PopularDestination }) => {
    return (
      <TouchableOpacity
        style={[
          styles.destinationItem,
          { width: itemDimensions.width, height: itemDimensions.height },
          layout === 'grid' && styles.gridItem,
        ]}
        onPress={() => handleDestinationSelect(item)}
        activeOpacity={0.8}
      >
        {/* Background Image */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.destinationImage} />
          ) : (
            <View style={[styles.destinationImage, styles.placeholderImage]}>
              <Ionicons name="location" size={32} color={colors.white} />
            </View>
          )}
          
          {/* Trending Badge */}
          {item.trending && (
            <View style={styles.trendingBadge}>
              <Ionicons name="trending-up" size={12} color={colors.white} />
              <Text style={styles.trendingText}>Trending</Text>
            </View>
          )}
          
          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
        
        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.destinationDescription} numberOfLines={1}>
              {item.description}
            </Text>
            
            <View style={styles.destinationStats}>
              <View style={styles.statItem}>
                <Ionicons name="car" size={14} color={colors.white} />
                <Text style={styles.statText}>{item.vehicleCount} vehicles</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.priceText}>from {formatPrice(item.averagePrice)}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [itemDimensions, layout, handleDestinationSelect, formatPrice]);

  if (processedDestinations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {showTrending ? 'Popular Destinations' : 'Top Destinations'}
        </Text>
        <View style={styles.headerActions}>
          {showTrending && (
            <View style={styles.trendingIndicator}>
              <Ionicons name="trending-up" size={16} color={colors.primary} />
              <Text style={styles.trendingLabel}>Trending</Text>
            </View>
          )}
          {enableAnalytics && (
            <TouchableOpacity
              onPress={loadAnalyticsDestinations}
              style={styles.refreshButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="refresh" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <FlatList
        data={processedDestinations}
        keyExtractor={(item) => item.id}
        renderItem={renderDestinationItem}
        horizontal={layout === 'horizontal'}
        numColumns={layout === 'grid' ? 2 : 1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          layout === 'grid' && styles.gridContainer,
        ]}
        ItemSeparatorComponent={() => (
          <View style={layout === 'horizontal' ? styles.horizontalSeparator : styles.verticalSeparator} />
        )}
        scrollEnabled={layout === 'horizontal'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  trendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  trendingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
  },
  gridContainer: {
    paddingHorizontal: spacing.lg,
  },
  destinationItem: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridItem: {
    marginBottom: spacing.md,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  destinationImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + 'CC',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  trendingText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 2,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.black + 'CC',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 2,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.md,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  destinationDescription: {
    fontSize: 12,
    color: colors.white + 'CC',
    marginBottom: spacing.xs,
  },
  destinationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: colors.white + 'CC',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  horizontalSeparator: {
    width: spacing.md,
  },
  verticalSeparator: {
    height: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '10',
  },
});

export default PopularDestinations;
