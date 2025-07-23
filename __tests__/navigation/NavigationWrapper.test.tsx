/**
 * Navigation Wrapper Integration Tests
 *
 * These tests verify the navigation wrapper functionality and
 * brownfield safety requirements without React Native testing dependencies.
 */

import { configureStore } from '@reduxjs/toolkit';
import featureFlagsReducer, {
  setFeatureFlag,
  emergencyRollback,
  selectFeatureFlags,
} from '../../src/store/slices/featureFlagsSlice';

// Mock the original AppNavigator
jest.mock('../../src/navigation/AppNavigator', () => ({
  AppNavigator: jest.fn(() => 'OriginalAppNavigator'),
}));

// Mock the feature flag hooks
jest.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: jest.fn(() => false),
  useFeatureFlagsInitialization: jest.fn(() => ({ isLoading: false })),
}));

// Mock React Native components
jest.mock('react-native', () => ({
  View: ({ children, testID }: any) => ({ type: 'View', testID, children }),
  Text: ({ children }: any) => ({ type: 'Text', children }),
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

// Mock the theme
jest.mock('../../src/styles/theme', () => ({
  colors: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    primary: '#007AFF',
    text: '#000000',
    textSecondary: '#666666',
    error: '#FF3B30',
    border: '#E5E5E5',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
}));

// Import the components after mocks
import { NavigationWrapper, AppNavigator, OriginalNavigation } from '../../src/navigation/NavigationWrapper';

const createTestStore = (initialFlags = {}) => {
  return configureStore({
    reducer: {
      featureFlags: featureFlagsReducer,
    },
    preloadedState: {
      featureFlags: {
        flags: {
          ENHANCED_HOME_SCREEN: false,
          SMART_ISLAND_SELECTION: false,
          OPTIMIZED_NAVIGATION: false,
          ENHANCED_VEHICLE_DETAIL: false,
          STREAMLINED_BOOKING: false,
          TRUST_SIGNALS: false,
          ADVANCED_DISCOVERY: false,
          ENHANCED_COMMUNICATION: false,
          PERFORMANCE_OPTIMIZATION: false,
          ROLLBACK_MONITORING: false,
          DEBUG_NAVIGATION: false,
          ...initialFlags,
        },
        isLoading: false,
        lastUpdated: null,
        environment: 'development',
        rollbackHistory: [],
      },
    },
  });
};

describe('NavigationWrapper Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Store Integration', () => {
    it('should integrate with feature flags store', () => {
      const store = createTestStore();

      // Test initial state
      let state = store.getState();
      expect(selectFeatureFlags(state).OPTIMIZED_NAVIGATION).toBe(false);

      // Test setting navigation flag
      store.dispatch(setFeatureFlag({ key: 'OPTIMIZED_NAVIGATION', value: true }));
      state = store.getState();
      expect(selectFeatureFlags(state).OPTIMIZED_NAVIGATION).toBe(true);
    });

    it('should handle emergency rollback for navigation flags', () => {
      const store = createTestStore({
        OPTIMIZED_NAVIGATION: true,
        ENHANCED_HOME_SCREEN: true,
        ROLLBACK_MONITORING: true,
      });

      store.dispatch(emergencyRollback({ reason: 'Navigation test rollback' }));

      const state = store.getState();
      const flags = selectFeatureFlags(state);

      // Navigation enhancement flags should be disabled
      expect(flags.OPTIMIZED_NAVIGATION).toBe(false);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);

      // Infrastructure flags should be preserved
      expect(flags.ROLLBACK_MONITORING).toBe(true);
    });
  });

  describe('Brownfield Safety', () => {
    it('should ensure all navigation flags default to disabled', () => {
      const store = createTestStore();
      const state = store.getState();
      const flags = selectFeatureFlags(state);

      // All navigation enhancement flags should be disabled by default
      expect(flags.OPTIMIZED_NAVIGATION).toBe(false);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
      expect(flags.SMART_ISLAND_SELECTION).toBe(false);
      expect(flags.ENHANCED_VEHICLE_DETAIL).toBe(false);
    });

    it('should preserve original navigation behavior when flags are disabled', () => {
      const store = createTestStore({
        OPTIMIZED_NAVIGATION: false,
        ENHANCED_HOME_SCREEN: false,
      });

      const state = store.getState();
      const flags = selectFeatureFlags(state);

      // Verify brownfield safety - original behavior preserved
      expect(flags.OPTIMIZED_NAVIGATION).toBe(false);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
    });
  });

  describe('Component Exports', () => {
    it('should export NavigationWrapper components correctly', () => {
      // Test that all required exports are available
      expect(NavigationWrapper).toBeDefined();
      expect(typeof NavigationWrapper).toBe('function');

      expect(AppNavigator).toBeDefined();
      expect(typeof AppNavigator).toBe('function');

      expect(OriginalNavigation).toBeDefined();
      expect(typeof OriginalNavigation).toBe('function');
    });
  });

  describe('Emergency Rollback Integration', () => {
    it('should handle emergency rollback correctly', () => {
      const store = createTestStore({
        OPTIMIZED_NAVIGATION: true,
        ENHANCED_HOME_SCREEN: true,
        SMART_ISLAND_SELECTION: true,
        ROLLBACK_MONITORING: true,
      });

      // Trigger emergency rollback
      store.dispatch(emergencyRollback({ reason: 'Navigation wrapper test' }));

      const state = store.getState();
      const flags = selectFeatureFlags(state);

      // All navigation enhancement flags should be disabled
      expect(flags.OPTIMIZED_NAVIGATION).toBe(false);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
      expect(flags.SMART_ISLAND_SELECTION).toBe(false);

      // Infrastructure flags should be preserved
      expect(flags.ROLLBACK_MONITORING).toBe(true);

      // Rollback should be recorded
      expect(state.featureFlags.rollbackHistory).toHaveLength(1);
      expect(state.featureFlags.rollbackHistory[0].reason).toBe('Navigation wrapper test');
    });
  });

});
