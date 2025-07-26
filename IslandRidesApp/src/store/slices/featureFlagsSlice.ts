import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Navigation Feature Flags for KeyLo App
 * 
 * This slice manages feature flags for navigation components to enable
 * safe rollback capabilities during navigation optimization.
 * 
 * CRITICAL: All flags default to FALSE (disabled) to preserve existing behavior.
 * Only enable flags after thorough testing and validation.
 */

export interface NavigationFeatureFlags {
  // Epic 2: Core Navigation Enhancement flags
  ENHANCED_HOME_SCREEN: boolean;
  SMART_ISLAND_SELECTION: boolean;
  OPTIMIZED_NAVIGATION: boolean;
  
  // Epic 3: Booking Flow Optimization flags
  ENHANCED_VEHICLE_DETAIL: boolean;
  STREAMLINED_BOOKING: boolean;
  TRUST_SIGNALS: boolean;
  
  // Epic 4: Advanced Features flags
  ADVANCED_DISCOVERY: boolean;
  ENHANCED_COMMUNICATION: boolean;
  PERFORMANCE_OPTIMIZATION: boolean;
  
  // Infrastructure flags
  ROLLBACK_MONITORING: boolean;
  DEBUG_NAVIGATION: boolean;
}

export interface FeatureFlagsState {
  flags: NavigationFeatureFlags;
  isLoading: boolean;
  lastUpdated: string | null;
  environment: 'development' | 'staging' | 'production';
  rollbackHistory: Array<{
    timestamp: string;
    flags: Partial<NavigationFeatureFlags>;
    reason: string;
  }>;
}

/**
 * Default feature flags - ALL DISABLED for brownfield safety
 * 
 * IMPORTANT: These defaults ensure existing navigation behavior
 * is preserved until flags are explicitly enabled.
 */
const defaultFlags: NavigationFeatureFlags = {
  // Epic 2 flags - disabled by default
  ENHANCED_HOME_SCREEN: false,
  SMART_ISLAND_SELECTION: false,
  OPTIMIZED_NAVIGATION: false,
  
  // Epic 3 flags - disabled by default
  ENHANCED_VEHICLE_DETAIL: false,
  STREAMLINED_BOOKING: false,
  TRUST_SIGNALS: false,
  
  // Epic 4 flags - disabled by default
  ADVANCED_DISCOVERY: false,
  ENHANCED_COMMUNICATION: false,
  PERFORMANCE_OPTIMIZATION: false,
  
  // Infrastructure flags - can be enabled for monitoring
  ROLLBACK_MONITORING: false,
  DEBUG_NAVIGATION: false,
};

const initialState: FeatureFlagsState = {
  flags: defaultFlags,
  isLoading: false,
  lastUpdated: null,
  environment: 'development',
  rollbackHistory: [],
};

const featureFlagsSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    /**
     * Set multiple feature flags at once
     * Used for bulk updates and rollback scenarios
     */
    setFeatureFlags: (state, action: PayloadAction<Partial<NavigationFeatureFlags>>) => {
      state.flags = { ...state.flags, ...action.payload };
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Set a single feature flag
     * Used for individual flag toggles
     */
    setFeatureFlag: (
      state,
      action: PayloadAction<{ key: keyof NavigationFeatureFlags; value: boolean }>
    ) => {
      const { key, value } = action.payload;
      state.flags[key] = value;
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Emergency rollback - disable all navigation enhancement flags
     * Preserves only infrastructure flags for monitoring
     */
    emergencyRollback: (state, action: PayloadAction<{ reason: string }>) => {
      const previousFlags = { ...state.flags };
      
      // Disable all enhancement flags, keep infrastructure flags
      state.flags = {
        ...defaultFlags,
        ROLLBACK_MONITORING: state.flags.ROLLBACK_MONITORING,
        DEBUG_NAVIGATION: state.flags.DEBUG_NAVIGATION,
      };
      
      // Record rollback in history
      state.rollbackHistory.push({
        timestamp: new Date().toISOString(),
        flags: previousFlags,
        reason: action.payload.reason,
      });
      
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Load feature flags from environment configuration
     * Used during app initialization
     */
    loadEnvironmentFlags: (
      state,
      action: PayloadAction<{
        flags: Partial<NavigationFeatureFlags>;
        environment: 'development' | 'staging' | 'production';
      }>
    ) => {
      state.flags = { ...state.flags, ...action.payload.flags };
      state.environment = action.payload.environment;
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Set loading state for async flag operations
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Reset all flags to default (disabled) state
     * Used for complete system reset
     */
    resetToDefaults: (state) => {
      state.flags = defaultFlags;
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Clear rollback history
     * Used for cleanup after successful deployments
     */
    clearRollbackHistory: (state) => {
      state.rollbackHistory = [];
    },
  },
});

export const {
  setFeatureFlags,
  setFeatureFlag,
  emergencyRollback,
  loadEnvironmentFlags,
  setLoading,
  resetToDefaults,
  clearRollbackHistory,
} = featureFlagsSlice.actions;

export default featureFlagsSlice.reducer;

// Selectors for accessing feature flag state
export const selectFeatureFlags = (state: { featureFlags: FeatureFlagsState }) => 
  state.featureFlags.flags;

export const selectFeatureFlag = (flagKey: keyof NavigationFeatureFlags) => 
  (state: { featureFlags: FeatureFlagsState }) => 
    state.featureFlags.flags[flagKey];

export const selectFeatureFlagsLoading = (state: { featureFlags: FeatureFlagsState }) => 
  state.featureFlags.isLoading;

export const selectFeatureFlagsEnvironment = (state: { featureFlags: FeatureFlagsState }) => 
  state.featureFlags.environment;

export const selectRollbackHistory = (state: { featureFlags: FeatureFlagsState }) => 
  state.featureFlags.rollbackHistory;

export const selectLastUpdated = (state: { featureFlags: FeatureFlagsState }) => 
  state.featureFlags.lastUpdated;

/**
 * Helper selector to check if any enhancement flags are enabled
 * Useful for determining if rollback infrastructure should be active
 */
export const selectHasActiveEnhancements = (state: { featureFlags: FeatureFlagsState }) => {
  const flags = state.featureFlags.flags;
  return (
    flags.ENHANCED_HOME_SCREEN ||
    flags.SMART_ISLAND_SELECTION ||
    flags.OPTIMIZED_NAVIGATION ||
    flags.ENHANCED_VEHICLE_DETAIL ||
    flags.STREAMLINED_BOOKING ||
    flags.TRUST_SIGNALS ||
    flags.ADVANCED_DISCOVERY ||
    flags.ENHANCED_COMMUNICATION ||
    flags.PERFORMANCE_OPTIMIZATION
  );
};
