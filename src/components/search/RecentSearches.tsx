/**
 * Recent Searches Component
 * Displays and manages recent search history with quick access
 */

import React, { useCallback, useMemo, useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { apiService } from '../../services/apiService';
import { useUnifiedAuth } from '../../context/UnifiedAuthContext';
import { analyticsService } from '../../services/analyticsService';
import { loggingService } from '../../services/LoggingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Performance monitoring
import { performanceMonitor } from '../../services/PerformanceMonitor';

export interface RecentSearch {
  id: string;
  query: string;
  island?: string;
  dateRange?: string;
  vehicleTypes?: string[];
  timestamp: string;
  resultCount?: number;
}

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSearchSelect: (search: RecentSearch) => void;
  onClearSearch: (searchId: string) => void;
  onClearAll: () => void;
  maxItems?: number;
  showClearAll?: boolean;
  enableBackendSync?: boolean;
}

// Memoized search item component for better performance
const SearchItem = memo<{
  item: RecentSearch;
  onSelect: (search: RecentSearch) => void;
  onClear: (searchId: string) => void;
  formatRelativeTime: (timestamp: string) => string;
}>(({ item, onSelect, onClear, formatRelativeTime }) => {
  const handlePress = useCallback(() => {
    performanceMonitor.recordMetric('recent_search_item_pressed', 1);
    onSelect(item);
  }, [item, onSelect]);

  const handleClear = useCallback(() => {
    onClear(item.id);
  }, [item.id, onClear]);

  return (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.searchIcon}>
        <Ionicons name="time-outline" size={20} color={colors.lightGrey} />
      </View>
      <View style={styles.searchContent}>
        <Text style={styles.searchQuery} numberOfLines={1}>
          {item.query}
        </Text>
        <Text style={styles.searchSummary} numberOfLines={1}>
          {item.island}
          {item.dateRange && ` • ${item.dateRange}`}
          {item.vehicleTypes && item.vehicleTypes.length > 0 && ` • ${item.vehicleTypes.join(', ')}`}
        </Text>
        <View style={styles.searchMeta}>
          <Text style={styles.searchTime}>{formatRelativeTime(item.timestamp)}</Text>
          {item.resultCount !== undefined && (
            <Text style={styles.resultCount}>
              {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleClear}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={16} color={colors.lightGrey} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

export const RecentSearches: React.FC<RecentSearchesProps> = memo(({
  searches,
  onSearchSelect,
  onClearSearch,
  onClearAll,
  maxItems = 5,
  showClearAll = true,
  enableBackendSync = true,
}) => {
  const { user } = useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [backendSearches, setBackendSearches] = useState<RecentSearch[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  // Sync with backend on mount and when user changes
  useEffect(() => {
    if (enableBackendSync && user) {
      syncWithBackend();
    }
  }, [user, enableBackendSync]);

  // Merge local and backend searches
  const mergedSearches = useMemo(() => {
    const combined = [...searches, ...backendSearches];
    const uniqueSearches = combined.reduce((acc, search) => {
      const existing = acc.find(s => s.query === search.query && s.island === search.island);
      if (!existing || new Date(search.timestamp) > new Date(existing.timestamp)) {
        return [...acc.filter(s => s.id !== existing?.id), search];
      }
      return acc;
    }, [] as RecentSearch[]);

    return uniqueSearches;
  }, [searches, backendSearches]);

  // Sort searches by timestamp and limit to maxItems
  const sortedSearches = useMemo(() => {
    return mergedSearches
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxItems);
  }, [mergedSearches, maxItems]);

  // Sync with backend
  const syncWithBackend = useCallback(async () => {
    if (!user || !enableBackendSync) return;

    try {
      setIsLoading(true);

      // Fetch recent searches from backend
      const response = await apiService.get('/user/recent-searches', {
        params: { limit: maxItems * 2 } // Get more to account for merging
      }) as { data?: { searches?: RecentSearch[] } };

      if (response.data?.searches) {
        setBackendSearches(response.data.searches);
        setLastSyncTime(Date.now());

        // Cache backend searches locally
        await AsyncStorage.setItem('cached_backend_searches', JSON.stringify({
          searches: response.data.searches,
          timestamp: Date.now(),
          userId: user.id,
        }));
      }
    } catch (error) {
      loggingService.warn('Failed to sync recent searches with backend', error as Error);

      // Try to load from cache
      try {
        const cached = await AsyncStorage.getItem('cached_backend_searches');
        if (cached) {
          const data = JSON.parse(cached);
          if (data.userId === user.id && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            setBackendSearches(data.searches);
          }
        }
      } catch (cacheError) {
        loggingService.warn('Failed to load cached backend searches', cacheError as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, enableBackendSync, maxItems]);

  // Save search to backend
  const saveSearchToBackend = useCallback(async (search: RecentSearch) => {
    if (!user || !enableBackendSync) return;

    try {
      await apiService.post('/user/recent-searches', {
        search: {
          query: search.query,
          island: search.island,
          dateRange: search.dateRange,
          vehicleTypes: search.vehicleTypes,
          resultCount: search.resultCount,
        }
      });

      // Track analytics
      analyticsService.trackEvent('recent_search_saved', {
        query: search.query,
        island: search.island,
        resultCount: search.resultCount,
      });
    } catch (error) {
      loggingService.warn('Failed to save search to backend', error as Error);
    }
  }, [user, enableBackendSync]);

  // Format relative time
  const formatRelativeTime = useCallback((timestamp: string) => {
    const now = new Date();
    const searchTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - searchTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }, []);

  // Enhanced search selection with analytics
  const handleSearchSelect = useCallback((search: RecentSearch) => {
    onSearchSelect(search);

    // Track analytics
    analyticsService.trackEvent('recent_search_selected', {
      query: search.query,
      island: search.island,
      age: Date.now() - new Date(search.timestamp).getTime(),
    });

    // Update search timestamp and save to backend
    const updatedSearch = {
      ...search,
      timestamp: new Date().toISOString(),
    };

    saveSearchToBackend(updatedSearch);
  }, [onSearchSelect, saveSearchToBackend]);

  // Handle clear all confirmation
  const handleClearAll = useCallback(async () => {
    Alert.alert(
      'Clear Search History',
      'Are you sure you want to clear all recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            onClearAll();

            // Clear backend searches if enabled
            if (enableBackendSync && user) {
              try {
                await apiService.delete('/user/recent-searches');
                setBackendSearches([]);
                await AsyncStorage.removeItem('cached_backend_searches');

                analyticsService.trackEvent('recent_searches_cleared', {
                  count: sortedSearches.length,
                });
              } catch (error) {
                loggingService.warn('Failed to clear backend searches', error as Error);
              }
            }
          }
        },
      ]
    );
  }, [onClearAll, enableBackendSync, user, sortedSearches.length]);

  // Handle individual search clear
  const handleClearSearch = useCallback((searchId: string, event: any) => {
    event.stopPropagation();
    onClearSearch(searchId);
  }, [onClearSearch]);

  // Optimized render function using memoized SearchItem
  const renderSearchItem = useCallback(({ item }: { item: RecentSearch }) => {
    return (
      <SearchItem
        item={item}
        onSelect={handleSearchSelect}
        onClear={(searchId) => handleClearSearch(searchId, { stopPropagation: () => {} })}
        formatRelativeTime={formatRelativeTime}
      />
    );
  }, [handleSearchSelect, handleClearSearch, formatRelativeTime]);

  if (sortedSearches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={48} color={colors.lightGrey} />
        <Text style={styles.emptyTitle}>No Recent Searches</Text>
        <Text style={styles.emptyDescription}>
          Your recent searches will appear here for quick access
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Searches</Text>
        {showClearAll && sortedSearches.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={sortedSearches}
        keyExtractor={(item) => item.id}
        renderItem={renderSearchItem}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
        getItemLayout={(_data, index) => ({
          length: 80, // Approximate item height
          offset: 80 * index,
          index,
        })}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  clearAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  searchContent: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  searchQuery: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginRight: spacing.sm,
  },
  searchTime: {
    fontSize: 12,
    color: colors.lightGrey,
  },
  searchSummary: {
    fontSize: 14,
    color: colors.darkGrey,
    marginBottom: 2,
  },
  resultCount: {
    fontSize: 12,
    color: colors.lightGrey,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.lightGrey,
    marginVertical: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGrey,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.lightGrey,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Performance optimized styles
  searchMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});

export default RecentSearches;
