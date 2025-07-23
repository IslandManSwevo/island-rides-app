import React, { Suspense, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../styles/theme';

interface LazyScreenWrapperProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
  screenName?: string;
}

/**
 * Loading fallback component for lazy-loaded screens
 */
const DefaultLoadingFallback: React.FC<{ screenName?: string }> = ({ screenName }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>
      {screenName ? `Loading ${screenName}...` : 'Loading...'}
    </Text>
  </View>
);

/**
 * Wrapper component for lazy-loaded screens with error boundary
 */
export const LazyScreenWrapper: React.FC<LazyScreenWrapperProps> = ({
  component: Component,
  fallback,
  screenName,
  ...props
}) => {
  const LoadingFallback = fallback || <DefaultLoadingFallback screenName={screenName} />;

  return (
    <Suspense fallback={LoadingFallback}>
      <Component {...props} />
    </Suspense>
  );
};

/**
 * Higher-order component to create lazy-loaded screens
 */
export const createLazyScreen = <P extends object>(
  importFunction: () => Promise<{ default: ComponentType<P> }>,
  screenName?: string,
  fallback?: React.ReactNode
) => {
  const LazyComponent = React.lazy(importFunction);
  
  return (props: P) => (
    <LazyScreenWrapper
      component={LazyComponent}
      fallback={fallback}
      screenName={screenName}
      {...props}
    />
  );
};

/**
 * Preload a lazy component (useful for prefetching)
 */
export const preloadLazyScreen = (
  importFunction: () => Promise<{ default: ComponentType<any> }>
): void => {
  // Trigger the import to start loading the component
  importFunction().catch((error) => {
    console.warn('Failed to preload lazy screen:', error);
  });
};

/**
 * Hook to preload screens based on user navigation patterns
 */
export const useScreenPreloader = () => {
  const preloadScreen = React.useCallback((
    importFunction: () => Promise<{ default: ComponentType<any> }>
  ) => {
    // Add a small delay to avoid blocking the main thread
    setTimeout(() => {
      preloadLazyScreen(importFunction);
    }, 100);
  }, []);

  return { preloadScreen };
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default LazyScreenWrapper;
