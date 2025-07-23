/**
 * Feature Flags Integration Tests
 *
 * These tests verify the integration between feature flag hooks,
 * Redux store, and configuration without requiring React Native
 * testing library dependencies.
 */

import { configureStore } from '@reduxjs/toolkit';
import featureFlagsReducer, {
  setFeatureFlag,
  setFeatureFlags,
  emergencyRollback,
  selectFeatureFlags,
  selectFeatureFlag,
  selectHasActiveEnhancements,
} from '../../src/store/slices/featureFlagsSlice';
import {
  getEnvironmentFlags,
  getFeatureFlagsConfig,
  getEmergencyRollbackConfig,
} from '../../src/config/featureFlags';

// Test store setup for integration testing
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

describe('Feature Flags Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Store Integration', () => {
    it('should integrate feature flags with Redux store', () => {
      const store = createTestStore();

      // Test initial state
      let state = store.getState();
      expect(selectFeatureFlags(state).ENHANCED_HOME_SCREEN).toBe(false);

      // Test setting a flag
      store.dispatch(setFeatureFlag({ key: 'ENHANCED_HOME_SCREEN', value: true }));
      state = store.getState();
      expect(selectFeatureFlags(state).ENHANCED_HOME_SCREEN).toBe(true);
    });

    it('should handle multiple flag updates', () => {
      const store = createTestStore();

      store.dispatch(setFeatureFlags({
        ENHANCED_HOME_SCREEN: true,
        SMART_ISLAND_SELECTION: true,
      }));

      const state = store.getState();
      expect(selectFeatureFlags(state).ENHANCED_HOME_SCREEN).toBe(true);
      expect(selectFeatureFlags(state).SMART_ISLAND_SELECTION).toBe(true);
      expect(selectFeatureFlags(state).OPTIMIZED_NAVIGATION).toBe(false);
    });

    it('should handle emergency rollback correctly', () => {
      const store = createTestStore({
        ENHANCED_HOME_SCREEN: true,
        SMART_ISLAND_SELECTION: true,
        ROLLBACK_MONITORING: true,
        DEBUG_NAVIGATION: true,
      });

      store.dispatch(emergencyRollback({ reason: 'Test rollback' }));

      const state = store.getState();
      const flags = selectFeatureFlags(state);

      // Enhancement flags should be disabled
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
      expect(flags.SMART_ISLAND_SELECTION).toBe(false);

      // Infrastructure flags should be preserved
      expect(flags.ROLLBACK_MONITORING).toBe(true);
      expect(flags.DEBUG_NAVIGATION).toBe(true);
    });
  });

  describe('Configuration Integration', () => {
    it('should integrate with environment configuration', () => {
      const devFlags = getEnvironmentFlags('development');
      const prodFlags = getEnvironmentFlags('production');

      // Development should have monitoring and debug enabled
      expect(devFlags.ROLLBACK_MONITORING).toBe(true);
      expect(devFlags.DEBUG_NAVIGATION).toBe(true);

      // Production should have monitoring enabled but debug disabled
      expect(prodFlags.ROLLBACK_MONITORING).toBe(true);
      expect(prodFlags.DEBUG_NAVIGATION).toBe(false);

      // Both should have enhancement flags disabled by default
      expect(devFlags.ENHANCED_HOME_SCREEN).toBe(false);
      expect(prodFlags.ENHANCED_HOME_SCREEN).toBe(false);
    });

    it('should provide emergency rollback configuration', () => {
      const rollbackConfig = getEmergencyRollbackConfig();

      // All enhancement flags should be disabled
      expect(rollbackConfig.ENHANCED_HOME_SCREEN).toBe(false);
      expect(rollbackConfig.SMART_ISLAND_SELECTION).toBe(false);
      expect(rollbackConfig.OPTIMIZED_NAVIGATION).toBe(false);

      // Monitoring should be enabled
      expect(rollbackConfig.ROLLBACK_MONITORING).toBe(true);
      expect(rollbackConfig.DEBUG_NAVIGATION).toBe(false);
    });
  });

  describe('Selector Integration', () => {
    it('should detect active enhancements correctly', () => {
      // Test with no enhancements
      const storeNoEnhancements = createTestStore({
        ROLLBACK_MONITORING: true, // Infrastructure flag
      });

      let state = storeNoEnhancements.getState();
      expect(selectHasActiveEnhancements(state)).toBe(false);

      // Test with enhancements
      const storeWithEnhancements = createTestStore({
        ENHANCED_HOME_SCREEN: true,
        ROLLBACK_MONITORING: true,
      });

      state = storeWithEnhancements.getState();
      expect(selectHasActiveEnhancements(state)).toBe(true);
    });

    it('should select individual flags correctly', () => {
      const store = createTestStore({
        ENHANCED_HOME_SCREEN: true,
        SMART_ISLAND_SELECTION: false,
      });

      const state = store.getState();
      expect(selectFeatureFlag('ENHANCED_HOME_SCREEN')(state)).toBe(true);
      expect(selectFeatureFlag('SMART_ISLAND_SELECTION')(state)).toBe(false);
    });
  });

  describe('Brownfield Safety', () => {
    it('should ensure all flags start disabled', () => {
      const store = createTestStore();
      const state = store.getState();
      const flags = selectFeatureFlags(state);

      // All enhancement flags should be disabled by default
      const enhancementFlags = [
        'ENHANCED_HOME_SCREEN',
        'SMART_ISLAND_SELECTION',
        'OPTIMIZED_NAVIGATION',
        'ENHANCED_VEHICLE_DETAIL',
        'STREAMLINED_BOOKING',
        'TRUST_SIGNALS',
        'ADVANCED_DISCOVERY',
        'ENHANCED_COMMUNICATION',
        'PERFORMANCE_OPTIMIZATION',
      ] as const;

      enhancementFlags.forEach(flag => {
        expect(flags[flag]).toBe(false);
      });
    });

    it('should handle emergency rollback preserving infrastructure', () => {
      const store = createTestStore({
        ENHANCED_HOME_SCREEN: true,
        SMART_ISLAND_SELECTION: true,
        ROLLBACK_MONITORING: true,
        DEBUG_NAVIGATION: true,
      });

      store.dispatch(emergencyRollback({ reason: 'Safety test' }));

      const state = store.getState();
      const flags = selectFeatureFlags(state);

      // Enhancement flags should be disabled
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
      expect(flags.SMART_ISLAND_SELECTION).toBe(false);

      // Infrastructure flags should be preserved
      expect(flags.ROLLBACK_MONITORING).toBe(true);
      expect(flags.DEBUG_NAVIGATION).toBe(true);

      // Rollback should be recorded
      expect(state.featureFlags.rollbackHistory).toHaveLength(1);
    });

    it('should integrate configuration with store safely', () => {
      const devConfig = getFeatureFlagsConfig('development');
      const prodConfig = getFeatureFlagsConfig('production');

      // Both environments should have safe defaults
      expect(devConfig.ENHANCED_HOME_SCREEN).toBe(false);
      expect(prodConfig.ENHANCED_HOME_SCREEN).toBe(false);

      // Infrastructure flags should be appropriate for environment
      expect(devConfig.ROLLBACK_MONITORING).toBe(true);
      expect(prodConfig.ROLLBACK_MONITORING).toBe(true);
    });
  });

});
