/**
 * Virtualized List Component
 * High-performance list component for large datasets with optimized rendering
 */

import React, { useMemo, useCallback, memo, useRef, useState, useEffect } from 'react';
import {
  FlatList,
  VirtualizedList as RNVirtualizedList,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ListRenderItem,
  ViewToken,
} from 'react-native';
import { performanceMonitor } from '../../services/PerformanceMonitor';
import { analyticsService } from '../../services/analyticsService';
import { loggingService } from '../../services/LoggingService';

export interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  itemHeight?: number;
  estimatedItemSize?: number;
  numColumns?: number;
  horizontal?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ItemSeparatorComponent?: React.ComponentType<any> | null;
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  viewabilityConfig?: any;
  // Performance optimization props
  removeClippedSubviews?: boolean;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  initialNumToRender?: number;
  windowSize?: number;
  getItemLayout?: (data: T[] | null | undefined, index: number) => { length: number; offset: number; index: number };
  // Advanced props
  enableVirtualization?: boolean;
  debug?: boolean;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;
  onMomentumScrollBegin?: () => void;
  onMomentumScrollEnd?: () => void;
}

interface PerformanceMetrics {
  renderTime: number;
  scrollPerformance: number;
  memoryUsage: number;
  viewableItemsCount: number;
  totalItemsCount: number;
}

export function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  itemHeight,
  estimatedItemSize = 100,
  numColumns = 1,
  horizontal = false,
  onEndReached,
  onEndReachedThreshold = 0.1,
  refreshing = false,
  onRefresh,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  onViewableItemsChanged,
  viewabilityConfig,
  removeClippedSubviews = true,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  initialNumToRender = 10,
  windowSize = 21,
  getItemLayout,
  enableVirtualization = true,
  debug = false,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
  ...props
}: VirtualizedListProps<T>) {
  const flatListRef = useRef<FlatList<T>>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
    viewableItemsCount: 0,
    totalItemsCount: data.length,
  });
  
  const renderStartTime = useRef(Date.now());
  const scrollStartTime = useRef(0);
  const isScrolling = useRef(false);

  // Optimized item layout calculation
  const optimizedGetItemLayout = useMemo(() => {
    if (getItemLayout) return getItemLayout;
    
    if (itemHeight) {
      return (_data: T[] | null | undefined, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }
    
    return undefined;
  }, [getItemLayout, itemHeight]);

  // Memoized render item with performance tracking
  const memoizedRenderItem = useCallback<ListRenderItem<T>>((info) => {
    const itemRenderStart = Date.now();
    
    const result = renderItem(info);
    
    const itemRenderTime = Date.now() - itemRenderStart;
    if (itemRenderTime > 16) { // 16ms = 60fps threshold
      performanceMonitor.recordMetric('slow_item_render', itemRenderTime);
      
      if (debug) {
        loggingService.warn('Slow item render detected', {
          index: info.index,
          renderTime: itemRenderTime,
        });
      }
    }
    
    return result;
  }, [renderItem, debug]);

  // Enhanced viewability change handler
  const handleViewableItemsChanged = useCallback((info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      viewableItemsCount: info.viewableItems.length,
    }));

    // Track viewability analytics
    analyticsService.trackEvent('list_viewability_changed', {
      viewableCount: info.viewableItems.length,
      changedCount: info.changed.length,
      totalItems: data.length,
    });

    onViewableItemsChanged?.(info);
  }, [onViewableItemsChanged, data.length]);

  // Optimized viewability config
  const optimizedViewabilityConfig = useMemo(() => {
    return viewabilityConfig || {
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 100,
      waitForInteraction: true,
    };
  }, [viewabilityConfig]);

  // Scroll performance tracking
  const handleScrollBeginDrag = useCallback(() => {
    scrollStartTime.current = Date.now();
    isScrolling.current = true;
    onScrollBeginDrag?.();
  }, [onScrollBeginDrag]);

  const handleScrollEndDrag = useCallback(() => {
    if (isScrolling.current) {
      const scrollDuration = Date.now() - scrollStartTime.current;
      setPerformanceMetrics(prev => ({
        ...prev,
        scrollPerformance: scrollDuration,
      }));
      
      performanceMonitor.recordMetric('scroll_duration', scrollDuration);
      isScrolling.current = false;
    }
    onScrollEndDrag?.();
  }, [onScrollEndDrag]);

  const handleMomentumScrollBegin = useCallback(() => {
    onMomentumScrollBegin?.();
  }, [onMomentumScrollBegin]);

  const handleMomentumScrollEnd = useCallback(() => {
    if (isScrolling.current) {
      const scrollDuration = Date.now() - scrollStartTime.current;
      performanceMonitor.recordMetric('momentum_scroll_duration', scrollDuration);
      isScrolling.current = false;
    }
    onMomentumScrollEnd?.();
  }, [onMomentumScrollEnd]);

  // Track render performance
  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    setPerformanceMetrics(prev => ({
      ...prev,
      renderTime,
      totalItemsCount: data.length,
    }));
    
    performanceMonitor.recordMetric('virtualized_list_render_time', renderTime);
    
    if (debug) {
      loggingService.info('VirtualizedList render metrics', {
        renderTime,
        itemCount: data.length,
        enableVirtualization,
      });
    }
  }, [data.length, debug, enableVirtualization]);

  // Memory usage monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        if (memory) {
          setPerformanceMetrics(prev => ({
            ...prev,
            memoryUsage: memory.usedJSHeapSize,
          }));
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Performance warning for large datasets
  useEffect(() => {
    if (data.length > 1000 && !enableVirtualization) {
      loggingService.warn('Large dataset detected without virtualization', {
        itemCount: data.length,
        recommendation: 'Enable virtualization for better performance',
      });
    }
  }, [data.length, enableVirtualization]);

  // Render performance debug info
  const renderDebugInfo = () => {
    if (!debug) return null;

    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Items: {performanceMetrics.totalItemsCount} | 
          Visible: {performanceMetrics.viewableItemsCount} | 
          Render: {performanceMetrics.renderTime}ms
        </Text>
      </View>
    );
  };

  // Choose between FlatList and VirtualizedList based on data size and configuration
  if (enableVirtualization && data.length > 100) {
    return (
      <View style={[styles.container, style]}>
        {renderDebugInfo()}
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={memoizedRenderItem}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          horizontal={horizontal}
          onEndReached={onEndReached}
          onEndReachedThreshold={onEndReachedThreshold}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={ListEmptyComponent}
          ItemSeparatorComponent={ItemSeparatorComponent}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={optimizedViewabilityConfig}
          // Performance optimizations
          removeClippedSubviews={removeClippedSubviews}
          maxToRenderPerBatch={maxToRenderPerBatch}
          updateCellsBatchingPeriod={updateCellsBatchingPeriod}
          initialNumToRender={initialNumToRender}
          windowSize={windowSize}
          getItemLayout={optimizedGetItemLayout}
          // Scroll handlers
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollBegin={handleMomentumScrollBegin}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          {...props}
        />
      </View>
    );
  }

  // Fallback to regular FlatList for smaller datasets
  return (
    <View style={[styles.container, style]}>
      {renderDebugInfo()}
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={memoizedRenderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        horizontal={horizontal}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        ItemSeparatorComponent={ItemSeparatorComponent}
        style={style}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={optimizedViewabilityConfig}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        {...props}
      />
    </View>
  );
}

// Memoized version for better performance
export const MemoizedVirtualizedList = memo(VirtualizedList) as typeof VirtualizedList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    zIndex: 1000,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default MemoizedVirtualizedList;
