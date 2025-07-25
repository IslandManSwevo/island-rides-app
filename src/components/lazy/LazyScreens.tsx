/**
 * Lazy-loaded Screen Components
 * Implements code splitting for major screens to reduce initial bundle size
 */

import React, { Suspense } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/theme';
import { bundleOptimizationService } from '../../services/bundleOptimizationService';
import { performanceMonitor } from '../../services/PerformanceMonitor';

// Loading component for lazy screens
const LazyLoadingComponent: React.FC<{ screenName?: string }> = ({ screenName }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>
      {screenName ? `Loading ${screenName}...` : 'Loading...'}
    </Text>
  </View>
);

// Error boundary for lazy loading failures
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
    performanceMonitor.recordMetric('lazy_load_error', 1);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || (() => (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load screen</Text>
          <Text style={styles.errorSubtext}>Please try again</Text>
        </View>
      ));
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

// HOC for wrapping lazy components with performance tracking
const withLazyPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      const startTime = Date.now();
      
      return () => {
        const renderTime = Date.now() - startTime;
        bundleOptimizationService.trackComponentRender(componentName, renderTime);
      };
    }, []);

    return <Component {...props} ref={ref} />;
  });
};

// Lazy-loaded Search Screen
export const LazySearchScreen = bundleOptimizationService.createLazyComponent(
  () => import('../../screens/SearchScreen').then(module => ({
    default: withLazyPerformanceTracking(module.default, 'SearchScreen')
  })),
  'SearchScreen'
);

// Lazy-loaded Search Results Screen
export const LazySearchResultsScreen = bundleOptimizationService.createLazyComponent(
  () => import('../../screens/SearchResultsScreen').then(module => ({
    default: withLazyPerformanceTracking(module.default, 'SearchResultsScreen')
  })),
  'SearchResultsScreen'
);

// Lazy-loaded Vehicle Detail Screen
export const LazyVehicleDetailScreen = bundleOptimizationService.createLazyComponent(
  () => import('../../screens/VehicleDetailScreen').then(module => ({
    default: withLazyPerformanceTracking(module.default, 'VehicleDetailScreen')
  })),
  'VehicleDetailScreen'
);

// Lazy-loaded Booking Screen
export const LazyBookingScreen = bundleOptimizationService.createLazyComponent(
  () => import('../../screens/BookingScreen').then(module => ({
    default: withLazyPerformanceTracking(module.default, 'BookingScreen')
  })),
  'BookingScreen'
);

// Lazy-loaded Profile Screen
export const LazyProfileScreen = bundleOptimizationService.createLazyComponent(
  () => import('../../screens/ProfileScreen').then(module => ({
    default: withLazyPerformanceTracking(module.default, 'ProfileScreen')
  })),
  'ProfileScreen'
);

// Lazy-loaded Map Components
export const LazyEnhancedVehicleMap = bundleOptimizationService.createLazyComponent(
  () => import('../map/EnhancedVehicleMap').then(module => ({
    default: withLazyPerformanceTracking(module.default, 'EnhancedVehicleMap')
  })),
  'EnhancedVehicleMap'
);

export const LazyRoutePlanningPanel = bundleOptimizationService.createLazyComponent(
  () => import('../map/RoutePlanningPanel').then(module => ({
    default: withLazyPerformanceTracking(module.default, 'RoutePlanningPanel')
  })),
  'RoutePlanningPanel'
);

// Wrapper component for lazy screens with error boundary and loading
export const LazyScreenWrapper: React.FC<{
  children: React.ReactNode;
  screenName?: string;
  fallback?: React.ComponentType;
}> = ({ children, screenName, fallback }) => (
  <LazyErrorBoundary fallback={fallback}>
    <Suspense fallback={<LazyLoadingComponent screenName={screenName} />}>
      {children}
    </Suspense>
  </LazyErrorBoundary>
);

// Preload functions for better UX
export const preloadSearchScreens = () => {
  bundleOptimizationService.preloadComponent(
    () => import('../../screens/SearchScreen'),
    'SearchScreen',
    1000 // 1 second delay
  );
  
  bundleOptimizationService.preloadComponent(
    () => import('../../screens/SearchResultsScreen'),
    'SearchResultsScreen',
    2000 // 2 second delay
  );
};

export const preloadVehicleScreens = () => {
  bundleOptimizationService.preloadComponent(
    () => import('../../screens/VehicleDetailScreen'),
    'VehicleDetailScreen',
    1500
  );
  
  bundleOptimizationService.preloadComponent(
    () => import('../../screens/BookingScreen'),
    'BookingScreen',
    3000
  );
};

export const preloadMapComponents = () => {
  bundleOptimizationService.preloadComponent(
    () => import('../map/EnhancedVehicleMap'),
    'EnhancedVehicleMap',
    2000
  );
  
  bundleOptimizationService.preloadComponent(
    () => import('../map/RoutePlanningPanel'),
    'RoutePlanningPanel',
    4000
  );
};

// Preload based on user navigation patterns
export const preloadBasedOnRoute = (currentRoute: string) => {
  switch (currentRoute) {
    case 'Home':
      preloadSearchScreens();
      break;
    case 'Search':
      preloadVehicleScreens();
      preloadMapComponents();
      break;
    case 'SearchResults':
      preloadVehicleScreens();
      break;
    case 'VehicleDetail':
      bundleOptimizationService.preloadComponent(
        () => import('../../screens/BookingScreen'),
        'BookingScreen',
        1000
      );
      break;
    default:
      // Preload commonly used screens
      preloadSearchScreens();
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.darkGrey,
    textAlign: 'center',
  },
});
