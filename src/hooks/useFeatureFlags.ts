import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import {
  NavigationFeatureFlags,
  selectFeatureFlags,
  selectFeatureFlag,
  selectFeatureFlagsLoading,
  selectHasActiveEnhancements,
  setFeatureFlag,
  setFeatureFlags,
  emergencyRollback,
  loadEnvironmentFlags,
} from '../store/slices/featureFlagsSlice';
import { getFeatureFlagsConfig } from '../config/featureFlags';
import { getEnvironmentConfig } from '../config/environment';

/**
 * Hook for accessing individual feature flags
 * 
 * @param flagKey - The feature flag key to check
 * @returns Boolean indicating if the flag is enabled
 */
export const useFeatureFlag = (flagKey: keyof NavigationFeatureFlags): boolean => {
  return useSelector(selectFeatureFlag(flagKey));
};

/**
 * Hook for accessing all feature flags
 * 
 * @returns Object containing all feature flag values
 */
export const useFeatureFlags = (): NavigationFeatureFlags => {
  return useSelector(selectFeatureFlags);
};

/**
 * Hook for feature flag loading state
 * 
 * @returns Boolean indicating if feature flags are currently loading
 */
export const useFeatureFlagsLoading = (): boolean => {
  return useSelector(selectFeatureFlagsLoading);
};

/**
 * Hook for checking if any enhancement flags are active
 * 
 * @returns Boolean indicating if any navigation enhancements are enabled
 */
export const useHasActiveEnhancements = (): boolean => {
  return useSelector(selectHasActiveEnhancements);
};

/**
 * Hook for feature flag management actions
 * 
 * Provides functions for updating feature flags and emergency rollback
 */
export const useFeatureFlagActions = () => {
  const dispatch = useDispatch();

  const setFlag = useCallback(
    (key: keyof NavigationFeatureFlags, value: boolean) => {
      dispatch(setFeatureFlag({ key, value }));
    },
    [dispatch]
  );

  const setFlags = useCallback(
    (flags: Partial<NavigationFeatureFlags>) => {
      dispatch(setFeatureFlags(flags));
    },
    [dispatch]
  );

  const performEmergencyRollback = useCallback(
    (reason: string) => {
      console.warn('🚨 EMERGENCY ROLLBACK TRIGGERED:', reason);
      dispatch(emergencyRollback({ reason }));
    },
    [dispatch]
  );

  const loadFlags = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        const envConfig = await getEnvironmentConfig(forceRefresh);
        const flagsConfig = getFeatureFlagsConfig(envConfig.ENVIRONMENT);
        
        dispatch(loadEnvironmentFlags({
          flags: flagsConfig,
          environment: envConfig.ENVIRONMENT,
        }));
        
        if (__DEV__) {
          console.log('🚩 Feature flags loaded for environment:', envConfig.ENVIRONMENT);
        }
      } catch (error) {
        console.error('❌ Failed to load feature flags:', error);
        // In case of error, ensure all enhancement flags are disabled
        dispatch(emergencyRollback({ reason: 'Failed to load feature flags configuration' }));
      }
    },
    [dispatch]
  );

  return {
    setFlag,
    setFlags,
    performEmergencyRollback,
    loadFlags,
  };
};

/**
 * Hook for initializing feature flags on app startup
 * 
 * This hook should be called once during app initialization to load
 * environment-specific feature flag configuration
 */
export const useFeatureFlagsInitialization = () => {
  const { loadFlags } = useFeatureFlagActions();
  const isLoading = useFeatureFlagsLoading();

  useEffect(() => {
    // Load feature flags on mount
    loadFlags();
  }, [loadFlags]);

  return { isLoading };
};

/**
 * Hook for conditional rendering based on feature flags
 * 
 * @param flagKey - The feature flag to check
 * @param fallbackComponent - Component to render when flag is disabled
 * @returns Object with conditional rendering helpers
 */
export const useFeatureFlagConditional = (
  flagKey: keyof NavigationFeatureFlags,
  fallbackComponent?: React.ComponentType<any>
) => {
  const isEnabled = useFeatureFlag(flagKey);

  const renderConditional = useCallback(
    (enhancedComponent: React.ComponentType<any>, props: any = {}) => {
      if (isEnabled) {
        return enhancedComponent;
      }
      return fallbackComponent || null;
    },
    [isEnabled, fallbackComponent]
  );

  const withFeatureFlag = useCallback(
    (enhancedComponent: React.ComponentType<any>) => {
      return (props: any) => {
        if (isEnabled) {
          return enhancedComponent(props);
        }
        if (fallbackComponent) {
          return fallbackComponent(props);
        }
        return null;
      };
    },
    [isEnabled, fallbackComponent]
  );

  return {
    isEnabled,
    renderConditional,
    withFeatureFlag,
  };
};

/**
 * Hook for performance monitoring of feature flag usage
 * 
 * This hook tracks feature flag access patterns for optimization
 * and rollback decision making
 */
export const useFeatureFlagMetrics = () => {
  const flags = useFeatureFlags();
  const hasActiveEnhancements = useHasActiveEnhancements();

  const getActiveFlags = useCallback(() => {
    return Object.entries(flags)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key);
  }, [flags]);

  const getInactiveFlags = useCallback(() => {
    return Object.entries(flags)
      .filter(([_, value]) => value === false)
      .map(([key, _]) => key);
  }, [flags]);

  const getFlagUsageStats = useCallback(() => {
    const activeFlags = getActiveFlags();
    const inactiveFlags = getInactiveFlags();
    
    return {
      totalFlags: Object.keys(flags).length,
      activeCount: activeFlags.length,
      inactiveCount: inactiveFlags.length,
      activeFlags,
      inactiveFlags,
      hasEnhancements: hasActiveEnhancements,
    };
  }, [flags, getActiveFlags, getInactiveFlags, hasActiveEnhancements]);

  return {
    getActiveFlags,
    getInactiveFlags,
    getFlagUsageStats,
    hasActiveEnhancements,
  };
};

/**
 * Hook for feature flag debugging in development
 * 
 * Provides debugging utilities for feature flag development and testing
 */
export const useFeatureFlagDebug = () => {
  const flags = useFeatureFlags();
  const { setFlags, performEmergencyRollback } = useFeatureFlagActions();
  const { getFlagUsageStats } = useFeatureFlagMetrics();

  const logCurrentFlags = useCallback(() => {
    if (__DEV__) {
      console.log('🚩 Current Feature Flags:', flags);
      console.log('📊 Flag Usage Stats:', getFlagUsageStats());
    }
  }, [flags, getFlagUsageStats]);

  const enableAllFlags = useCallback(() => {
    if (__DEV__) {
      const allEnabled = Object.keys(flags).reduce((acc, key) => {
        acc[key as keyof NavigationFeatureFlags] = true;
        return acc;
      }, {} as NavigationFeatureFlags);
      
      setFlags(allEnabled);
      console.log('🚩 All feature flags enabled (development only)');
    }
  }, [flags, setFlags]);

  const disableAllFlags = useCallback(() => {
    if (__DEV__) {
      performEmergencyRollback('Development debug: disable all flags');
      console.log('🚩 All feature flags disabled (development only)');
    }
  }, [performEmergencyRollback]);

  const testRollback = useCallback(() => {
    if (__DEV__) {
      performEmergencyRollback('Development test rollback');
      console.log('🚨 Test rollback performed (development only)');
    }
  }, [performEmergencyRollback]);

  return {
    logCurrentFlags,
    enableAllFlags,
    disableAllFlags,
    testRollback,
  };
};
