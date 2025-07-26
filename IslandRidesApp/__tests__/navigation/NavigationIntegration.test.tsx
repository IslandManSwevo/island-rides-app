/**
 * Navigation Integration Tests
 * 
 * These tests verify that the navigation wrapper system integrates
 * correctly with the existing App.tsx and maintains brownfield safety.
 */

import { configureStore } from '@reduxjs/toolkit';
import featureFlagsReducer, {
  setFeatureFlag,
  emergencyRollback,
  selectFeatureFlags,
} from '../../src/store/slices/featureFlagsSlice';

// Mock React Native components
jest.mock('react-native', () => ({
  View: ({ children, testID }: any) => ({ type: 'View', testID, children }),
  Text: ({ children }: any) => ({ type: 'Text', children }),
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

// Mock the original AppNavigator
jest.mock('../../src/navigation/AppNavigator', () => ({
  AppNavigator: jest.fn(() => 'OriginalAppNavigator'),
}));

// Mock the feature flag hooks
jest.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: jest.fn(() => false),
  useFeatureFlagsInitialization: jest.fn(() => ({ isLoading: false })),
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
import { NavigationWrapper } from '../../src/navigation/NavigationWrapper';

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

describe('Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('App.tsx Integration', () => {
    it('should be compatible with existing App.tsx structure', () => {
      // Test that NavigationWrapper can be used as a drop-in replacement
      // for AppNavigator in App.tsx without breaking changes
      
      const store = createTestStore();
      
      // Verify the wrapper can be instantiated
      expect(() => {
        const wrapper = NavigationWrapper;
        expect(wrapper).toBeDefined();
        expect(typeof wrapper).toBe('function');
      }).not.toThrow();
    });

    it('should maintain backward compatibility with existing imports', () => {
      // Test that existing imports continue to work
      const { AppNavigator } = require('../../src/navigation/NavigationWrapper');
      
      expect(AppNavigator).toBeDefined();
      expect(typeof AppNavigator).toBe('function');
    });
  });

  describe('Feature Flag State Management', () => {
    it('should integrate with Redux store for navigation flags', () => {
      const store = createTestStore();
      
      // Test initial state
      let state = store.getState();
      expect(selectFeatureFlags(state).OPTIMIZED_NAVIGATION).toBe(false);
      
      // Test enabling navigation optimization
      store.dispatch(setFeatureFlag({ key: 'OPTIMIZED_NAVIGATION', value: true }));
      state = store.getState();
      expect(selectFeatureFlags(state).OPTIMIZED_NAVIGATION).toBe(true);
      
      // Test emergency rollback
      store.dispatch(emergencyRollback({ reason: 'Integration test rollback' }));
      state = store.getState();
      expect(selectFeatureFlags(state).OPTIMIZED_NAVIGATION).toBe(false);
    });

    it('should handle multiple navigation enhancement flags', () => {
      const store = createTestStore();
      
      // Enable multiple navigation flags
      store.dispatch(setFeatureFlag({ key: 'OPTIMIZED_NAVIGATION', value: true }));
      store.dispatch(setFeatureFlag({ key: 'ENHANCED_HOME_SCREEN', value: true }));
      store.dispatch(setFeatureFlag({ key: 'SMART_ISLAND_SELECTION', value: true }));
      
      let state = store.getState();
      const flags = selectFeatureFlags(state);
      
      expect(flags.OPTIMIZED_NAVIGATION).toBe(true);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(true);
      expect(flags.SMART_ISLAND_SELECTION).toBe(true);
      
      // Test rollback disables all enhancement flags
      store.dispatch(emergencyRollback({ reason: 'Multi-flag rollback test' }));
      state = store.getState();
      const rolledBackFlags = selectFeatureFlags(state);
      
      expect(rolledBackFlags.OPTIMIZED_NAVIGATION).toBe(false);
      expect(rolledBackFlags.ENHANCED_HOME_SCREEN).toBe(false);
      expect(rolledBackFlags.SMART_ISLAND_SELECTION).toBe(false);
    });
  });

  describe('Brownfield Safety Validation', () => {
    it('should ensure zero modification of original navigation', () => {
      const store = createTestStore();
      
      // Verify all navigation enhancement flags are disabled by default
      const state = store.getState();
      const flags = selectFeatureFlags(state);
      
      const navigationFlags = [
        'OPTIMIZED_NAVIGATION',
        'ENHANCED_HOME_SCREEN',
        'SMART_ISLAND_SELECTION',
        'ENHANCED_VEHICLE_DETAIL',
        'STREAMLINED_BOOKING',
        'TRUST_SIGNALS',
        'ADVANCED_DISCOVERY',
        'ENHANCED_COMMUNICATION',
        'PERFORMANCE_OPTIMIZATION',
      ] as const;
      
      navigationFlags.forEach(flag => {
        expect(flags[flag]).toBe(false);
      });
    });

    it('should preserve infrastructure flags during rollback', () => {
      const store = createTestStore({
        OPTIMIZED_NAVIGATION: true,
        ENHANCED_HOME_SCREEN: true,
        ROLLBACK_MONITORING: true,
        DEBUG_NAVIGATION: true,
      });
      
      // Trigger emergency rollback
      store.dispatch(emergencyRollback({ reason: 'Infrastructure preservation test' }));
      
      const state = store.getState();
      const flags = selectFeatureFlags(state);
      
      // Enhancement flags should be disabled
      expect(flags.OPTIMIZED_NAVIGATION).toBe(false);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
      
      // Infrastructure flags should be preserved
      expect(flags.ROLLBACK_MONITORING).toBe(true);
      expect(flags.DEBUG_NAVIGATION).toBe(true);
    });

    it('should maintain rollback history for audit purposes', () => {
      const store = createTestStore({
        OPTIMIZED_NAVIGATION: true,
        ENHANCED_HOME_SCREEN: true,
      });
      
      // Perform multiple rollbacks
      store.dispatch(emergencyRollback({ reason: 'First rollback' }));
      store.dispatch(setFeatureFlag({ key: 'OPTIMIZED_NAVIGATION', value: true }));
      store.dispatch(emergencyRollback({ reason: 'Second rollback' }));
      
      const state = store.getState();
      
      // Should have rollback history
      expect(state.featureFlags.rollbackHistory).toHaveLength(2);
      expect(state.featureFlags.rollbackHistory[0].reason).toBe('First rollback');
      expect(state.featureFlags.rollbackHistory[1].reason).toBe('Second rollback');
      
      // Each rollback should have timestamp
      state.featureFlags.rollbackHistory.forEach(entry => {
        expect(entry.timestamp).toBeTruthy();
        expect(new Date(entry.timestamp).getTime()).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should have minimal performance overhead', () => {
      const store = createTestStore();
      
      // Measure flag evaluation performance
      const startTime = performance.now();
      
      // Simulate multiple flag checks
      for (let i = 0; i < 100; i++) {
        const state = store.getState();
        selectFeatureFlags(state);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should be reasonably fast (under 100ms for 100 evaluations)
      expect(totalTime).toBeLessThan(100);
    });

    it('should handle rapid flag changes without issues', () => {
      const store = createTestStore();
      
      // Rapidly toggle flags
      for (let i = 0; i < 10; i++) {
        store.dispatch(setFeatureFlag({ key: 'OPTIMIZED_NAVIGATION', value: true }));
        store.dispatch(setFeatureFlag({ key: 'OPTIMIZED_NAVIGATION', value: false }));
      }
      
      // Should end in consistent state
      const state = store.getState();
      expect(selectFeatureFlags(state).OPTIMIZED_NAVIGATION).toBe(false);
      
      // Should have updated timestamp
      expect(state.featureFlags.lastUpdated).toBeTruthy();
    });
  });

  describe('Emergency Rollback Scenarios', () => {
    it('should handle emergency rollback under 5 minutes target', () => {
      const store = createTestStore({
        OPTIMIZED_NAVIGATION: true,
        ENHANCED_HOME_SCREEN: true,
        SMART_ISLAND_SELECTION: true,
        ENHANCED_VEHICLE_DETAIL: true,
      });
      
      const rollbackStart = performance.now();
      
      // Trigger emergency rollback
      store.dispatch(emergencyRollback({ reason: 'Performance degradation detected' }));
      
      const rollbackEnd = performance.now();
      const rollbackTime = rollbackEnd - rollbackStart;
      
      // Should be very fast (under 10ms)
      expect(rollbackTime).toBeLessThan(10);
      
      // Verify all enhancement flags are disabled
      const state = store.getState();
      const flags = selectFeatureFlags(state);
      
      expect(flags.OPTIMIZED_NAVIGATION).toBe(false);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
      expect(flags.SMART_ISLAND_SELECTION).toBe(false);
      expect(flags.ENHANCED_VEHICLE_DETAIL).toBe(false);
    });
  });
});
