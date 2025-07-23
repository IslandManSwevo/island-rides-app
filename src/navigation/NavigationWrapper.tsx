import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFeatureFlag, useFeatureFlagsInitialization } from '../hooks/useFeatureFlags';
import { colors, spacing } from '../styles/theme';

// Import original navigation (preserved as fallback)
import { AppNavigator as OriginalAppNavigator } from './AppNavigator';

// Import enhanced navigation components
import { EnhancedAppNavigator } from './EnhancedAppNavigator';

/**
 * NavigationWrapper - Feature Flag Controlled Navigation
 * 
 * This wrapper component provides feature flag controlled navigation
 * while preserving the original AppNavigator as the default fallback.
 * 
 * CRITICAL BROWNFIELD SAFETY:
 * - Original AppNavigator is NEVER modified
 * - All feature flags default to FALSE (disabled)
 * - Emergency rollback returns to original navigation instantly
 * - Zero impact on existing navigation functionality
 */

interface NavigationWrapperProps {
  // Future props for enhanced navigation components
  testID?: string;
}

/**
 * Enhanced Navigation Component (Epic 2 Implementation)
 *
 * This component renders the enhanced navigation experience when
 * feature flags are enabled. It provides enhanced home screen,
 * smart island selection, and optimized navigation flows.
 */
const EnhancedNavigationComponent: React.FC = () => {
  const isEnhancedHomeEnabled = useFeatureFlag('ENHANCED_HOME_SCREEN');
  const isOptimizedNavigationEnabled = useFeatureFlag('OPTIMIZED_NAVIGATION');

  // If enhanced features are enabled, use the enhanced navigator
  if (isOptimizedNavigationEnabled || isEnhancedHomeEnabled) {
    return (
      <View style={styles.enhancedContainer} testID="enhanced-navigation">
        {__DEV__ && (
          <View style={styles.enhancementIndicator}>
            <Text style={styles.enhancedText}>
              🚀 Enhanced Navigation Active
            </Text>
            <Text style={styles.enhancedSubtext}>
              Features: {[
                isEnhancedHomeEnabled && 'Enhanced Home',
                isOptimizedNavigationEnabled && 'Optimized Navigation'
              ].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
        <EnhancedAppNavigator />
      </View>
    );
  }

  // Fallback to original navigation with enhanced wrapper
  return (
    <View style={styles.enhancedContainer} testID="enhanced-navigation-fallback">
      <OriginalAppNavigator />
    </View>
  );
};

/**
 * Navigation Wrapper Component
 * 
 * Uses feature flags to conditionally render enhanced vs original navigation.
 * Ensures brownfield safety by defaulting to original navigation.
 */
export const NavigationWrapper: React.FC<NavigationWrapperProps> = ({ 
  testID = 'navigation-wrapper' 
}) => {
  // Initialize feature flags on app startup
  const { isLoading: flagsLoading } = useFeatureFlagsInitialization();
  
  // Check if optimized navigation is enabled
  const isOptimizedNavigationEnabled = useFeatureFlag('OPTIMIZED_NAVIGATION');
  
  // Show loading state while feature flags are initializing
  if (flagsLoading) {
    return (
      <View style={styles.loadingContainer} testID={`${testID}-loading`}>
        <Text style={styles.loadingText}>Initializing navigation...</Text>
      </View>
    );
  }

  // Log navigation mode for debugging (development only)
  if (__DEV__) {
    console.log('🧭 NavigationWrapper: Navigation mode:', {
      isOptimizedNavigationEnabled,
      mode: isOptimizedNavigationEnabled ? 'enhanced' : 'original',
    });
  }

  // Conditional navigation rendering based on feature flags
  return (
    <View style={styles.container} testID={testID}>
      {isOptimizedNavigationEnabled ? (
        <EnhancedNavigationComponent />
      ) : (
        <OriginalAppNavigator />
      )}
    </View>
  );
};

/**
 * Legacy Navigation Wrapper (Backward Compatibility)
 * 
 * This ensures that any existing imports of AppNavigator
 * continue to work without modification while providing
 * the feature flag wrapper functionality.
 */
export const AppNavigator: React.FC = () => {
  return <NavigationWrapper testID="app-navigator-wrapper" />;
};

/**
 * Direct access to original navigation for emergency rollback
 * 
 * This export allows direct access to the original navigation
 * for emergency scenarios or testing purposes.
 */
export const OriginalNavigation = OriginalAppNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  enhancedContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  enhancementIndicator: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  enhancedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surface,
    textAlign: 'center',
  },
  enhancedSubtext: {
    fontSize: 10,
    color: colors.surface,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 2,
  },
});

// Default export maintains compatibility
export default NavigationWrapper;
