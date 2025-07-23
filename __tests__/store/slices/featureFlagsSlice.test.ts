import featureFlagsReducer, {
  NavigationFeatureFlags,
  FeatureFlagsState,
  setFeatureFlags,
  setFeatureFlag,
  emergencyRollback,
  loadEnvironmentFlags,
  setLoading,
  resetToDefaults,
  clearRollbackHistory,
  selectFeatureFlags,
  selectFeatureFlag,
  selectFeatureFlagsLoading,
  selectHasActiveEnhancements,
} from '../../../src/store/slices/featureFlagsSlice';

describe('featureFlagsSlice', () => {
  const initialState: FeatureFlagsState = {
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
    },
    isLoading: false,
    lastUpdated: null,
    environment: 'development',
    rollbackHistory: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return the initial state', () => {
      expect(featureFlagsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should have all flags disabled by default', () => {
      const state = featureFlagsReducer(undefined, { type: 'unknown' });
      
      Object.values(state.flags).forEach(flag => {
        expect(flag).toBe(false);
      });
    });
  });

  describe('setFeatureFlags', () => {
    it('should set multiple feature flags', () => {
      const flagsToSet: Partial<NavigationFeatureFlags> = {
        ENHANCED_HOME_SCREEN: true,
        SMART_ISLAND_SELECTION: true,
      };

      const action = setFeatureFlags(flagsToSet);
      const state = featureFlagsReducer(initialState, action);

      expect(state.flags.ENHANCED_HOME_SCREEN).toBe(true);
      expect(state.flags.SMART_ISLAND_SELECTION).toBe(true);
      expect(state.flags.OPTIMIZED_NAVIGATION).toBe(false); // Should remain unchanged
      expect(state.lastUpdated).toBeTruthy();
    });

    it('should update lastUpdated timestamp', () => {
      const action = setFeatureFlags({ ENHANCED_HOME_SCREEN: true });
      const state = featureFlagsReducer(initialState, action);

      expect(state.lastUpdated).toBeTruthy();
      expect(new Date(state.lastUpdated!).getTime()).toBeCloseTo(Date.now(), -3);
    });
  });

  describe('setFeatureFlag', () => {
    it('should set a single feature flag', () => {
      const action = setFeatureFlag({ key: 'ENHANCED_HOME_SCREEN', value: true });
      const state = featureFlagsReducer(initialState, action);

      expect(state.flags.ENHANCED_HOME_SCREEN).toBe(true);
      expect(state.lastUpdated).toBeTruthy();
    });

    it('should disable a feature flag', () => {
      const stateWithFlag = {
        ...initialState,
        flags: { ...initialState.flags, ENHANCED_HOME_SCREEN: true },
      };

      const action = setFeatureFlag({ key: 'ENHANCED_HOME_SCREEN', value: false });
      const state = featureFlagsReducer(stateWithFlag, action);

      expect(state.flags.ENHANCED_HOME_SCREEN).toBe(false);
    });
  });

  describe('emergencyRollback', () => {
    it('should disable all enhancement flags', () => {
      const stateWithFlags = {
        ...initialState,
        flags: {
          ...initialState.flags,
          ENHANCED_HOME_SCREEN: true,
          SMART_ISLAND_SELECTION: true,
          OPTIMIZED_NAVIGATION: true,
          ROLLBACK_MONITORING: true,
          DEBUG_NAVIGATION: true,
        },
      };

      const action = emergencyRollback({ reason: 'Test rollback' });
      const state = featureFlagsReducer(stateWithFlags, action);

      // Enhancement flags should be disabled
      expect(state.flags.ENHANCED_HOME_SCREEN).toBe(false);
      expect(state.flags.SMART_ISLAND_SELECTION).toBe(false);
      expect(state.flags.OPTIMIZED_NAVIGATION).toBe(false);

      // Infrastructure flags should be preserved
      expect(state.flags.ROLLBACK_MONITORING).toBe(true);
      expect(state.flags.DEBUG_NAVIGATION).toBe(true);
    });

    it('should record rollback in history', () => {
      const previousFlags = {
        ...initialState.flags,
        ENHANCED_HOME_SCREEN: true,
        SMART_ISLAND_SELECTION: true,
      };

      const stateWithFlags = {
        ...initialState,
        flags: previousFlags,
      };

      const action = emergencyRollback({ reason: 'Test rollback' });
      const state = featureFlagsReducer(stateWithFlags, action);

      expect(state.rollbackHistory).toHaveLength(1);
      expect(state.rollbackHistory[0]).toMatchObject({
        flags: previousFlags,
        reason: 'Test rollback',
      });
      expect(state.rollbackHistory[0].timestamp).toBeTruthy();
    });
  });

  describe('loadEnvironmentFlags', () => {
    it('should load environment-specific flags', () => {
      const environmentFlags: Partial<NavigationFeatureFlags> = {
        ROLLBACK_MONITORING: true,
        DEBUG_NAVIGATION: true,
      };

      const action = loadEnvironmentFlags({
        flags: environmentFlags,
        environment: 'development',
      });

      const state = featureFlagsReducer(initialState, action);

      expect(state.flags.ROLLBACK_MONITORING).toBe(true);
      expect(state.flags.DEBUG_NAVIGATION).toBe(true);
      expect(state.environment).toBe('development');
      expect(state.lastUpdated).toBeTruthy();
    });

    it('should merge with existing flags', () => {
      const stateWithFlags = {
        ...initialState,
        flags: { ...initialState.flags, ENHANCED_HOME_SCREEN: true },
      };

      const action = loadEnvironmentFlags({
        flags: { ROLLBACK_MONITORING: true },
        environment: 'staging',
      });

      const state = featureFlagsReducer(stateWithFlags, action);

      expect(state.flags.ENHANCED_HOME_SCREEN).toBe(true); // Should be preserved
      expect(state.flags.ROLLBACK_MONITORING).toBe(true); // Should be added
      expect(state.environment).toBe('staging');
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const action = setLoading(true);
      const state = featureFlagsReducer(initialState, action);

      expect(state.isLoading).toBe(true);
    });

    it('should clear loading state', () => {
      const loadingState = { ...initialState, isLoading: true };
      const action = setLoading(false);
      const state = featureFlagsReducer(loadingState, action);

      expect(state.isLoading).toBe(false);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all flags to default state', () => {
      const stateWithFlags = {
        ...initialState,
        flags: {
          ...initialState.flags,
          ENHANCED_HOME_SCREEN: true,
          SMART_ISLAND_SELECTION: true,
          ROLLBACK_MONITORING: true,
        },
      };

      const action = resetToDefaults();
      const state = featureFlagsReducer(stateWithFlags, action);

      Object.values(state.flags).forEach(flag => {
        expect(flag).toBe(false);
      });
      expect(state.lastUpdated).toBeTruthy();
    });
  });

  describe('clearRollbackHistory', () => {
    it('should clear rollback history', () => {
      const stateWithHistory = {
        ...initialState,
        rollbackHistory: [
          {
            timestamp: new Date().toISOString(),
            flags: { ENHANCED_HOME_SCREEN: true },
            reason: 'Test rollback',
          },
        ],
      };

      const action = clearRollbackHistory();
      const state = featureFlagsReducer(stateWithHistory, action);

      expect(state.rollbackHistory).toHaveLength(0);
    });
  });

  describe('Selectors', () => {
    const mockState = {
      featureFlags: {
        ...initialState,
        flags: {
          ...initialState.flags,
          ENHANCED_HOME_SCREEN: true,
          ROLLBACK_MONITORING: true,
        },
        isLoading: true,
      },
    };

    it('should select all feature flags', () => {
      const flags = selectFeatureFlags(mockState);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(true);
      expect(flags.ROLLBACK_MONITORING).toBe(true);
      expect(flags.SMART_ISLAND_SELECTION).toBe(false);
    });

    it('should select individual feature flag', () => {
      const isEnabled = selectFeatureFlag('ENHANCED_HOME_SCREEN')(mockState);
      const isDisabled = selectFeatureFlag('SMART_ISLAND_SELECTION')(mockState);

      expect(isEnabled).toBe(true);
      expect(isDisabled).toBe(false);
    });

    it('should select loading state', () => {
      const isLoading = selectFeatureFlagsLoading(mockState);
      expect(isLoading).toBe(true);
    });

    it('should detect active enhancements', () => {
      const hasActive = selectHasActiveEnhancements(mockState);
      expect(hasActive).toBe(true);

      const stateWithoutEnhancements = {
        featureFlags: {
          ...initialState,
          flags: { ...initialState.flags, ROLLBACK_MONITORING: true },
        },
      };

      const hasNoActive = selectHasActiveEnhancements(stateWithoutEnhancements);
      expect(hasNoActive).toBe(false);
    });
  });

  describe('Brownfield Safety', () => {
    it('should ensure all enhancement flags default to false', () => {
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

      const state = featureFlagsReducer(undefined, { type: 'unknown' });

      enhancementFlags.forEach(flag => {
        expect(state.flags[flag]).toBe(false);
      });
    });

    it('should preserve infrastructure flags during emergency rollback', () => {
      const stateWithInfrastructure = {
        ...initialState,
        flags: {
          ...initialState.flags,
          ENHANCED_HOME_SCREEN: true,
          ROLLBACK_MONITORING: true,
          DEBUG_NAVIGATION: true,
        },
      };

      const action = emergencyRollback({ reason: 'Safety test' });
      const state = featureFlagsReducer(stateWithInfrastructure, action);

      expect(state.flags.ENHANCED_HOME_SCREEN).toBe(false);
      expect(state.flags.ROLLBACK_MONITORING).toBe(true);
      expect(state.flags.DEBUG_NAVIGATION).toBe(true);
    });
  });
});
