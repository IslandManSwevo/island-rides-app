import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainerRef, NavigationState } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFeatureFlag } from '../hooks/useFeatureFlags';

/**
 * Navigation Compatibility Layer
 * 
 * This layer ensures that navigation state, deep linking, and persistence
 * work seamlessly between original and enhanced navigation versions.
 * 
 * CRITICAL BROWNFIELD REQUIREMENTS:
 * - Navigation state must persist across feature flag changes
 * - Deep linking must work with both navigation versions
 * - No breaking changes to existing navigation behavior
 * - Emergency rollback must preserve current navigation state
 */

interface NavigationStateSnapshot {
  state: NavigationState | undefined;
  timestamp: number;
  version: 'original' | 'enhanced';
}

interface NavigationCompatibilityProps {
  children: React.ReactNode;
  navigationRef: React.RefObject<NavigationContainerRef<any>>;
  onStateChange?: (state: NavigationState | undefined) => void;
  testID?: string;
}

export const NavigationCompatibilityLayer: React.FC<NavigationCompatibilityProps> = ({
  children,
  navigationRef,
  onStateChange,
  testID = 'navigation-compatibility-layer'
}) => {
  const isOptimizedNavigationEnabled = useFeatureFlag('OPTIMIZED_NAVIGATION');
  const isRollbackMonitoringEnabled = useFeatureFlag('ROLLBACK_MONITORING');
  
  // State snapshots for compatibility
  const [stateSnapshots, setStateSnapshots] = useState<NavigationStateSnapshot[]>([]);
  const previousNavigationVersion = useRef<'original' | 'enhanced'>('original');
  const lastKnownState = useRef<NavigationState | undefined>();

  // Track navigation version changes
  useEffect(() => {
    const currentVersion = isOptimizedNavigationEnabled ? 'enhanced' : 'original';
    
    if (previousNavigationVersion.current !== currentVersion) {
      console.log('🔄 Navigation version change detected:', {
        from: previousNavigationVersion.current,
        to: currentVersion,
        hasState: !!lastKnownState.current,
      });

      // Save state snapshot before version change
      if (lastKnownState.current) {
        const snapshot: NavigationStateSnapshot = {
          state: lastKnownState.current,
          timestamp: Date.now(),
          version: previousNavigationVersion.current,
        };

        setStateSnapshots(prev => [...prev.slice(-4), snapshot]); // Keep last 5 snapshots
        
        if (__DEV__) {
          console.log('📸 Navigation state snapshot saved:', {
            version: snapshot.version,
            routeCount: snapshot.state?.routes?.length || 0,
            currentRoute: snapshot.state?.routes?.[snapshot.state.index || 0]?.name,
          });
        }
      }

      previousNavigationVersion.current = currentVersion;
    }
  }, [isOptimizedNavigationEnabled]);

  // Enhanced state change handler with compatibility features
  const handleStateChange = (state: NavigationState | undefined) => {
    lastKnownState.current = state;

    // Log state changes for monitoring (if enabled)
    if (isRollbackMonitoringEnabled && __DEV__) {
      console.log('🧭 Navigation state change:', {
        version: isOptimizedNavigationEnabled ? 'enhanced' : 'original',
        routeName: state?.routes?.[state.index || 0]?.name,
        routeCount: state?.routes?.length || 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Call original state change handler
    onStateChange?.(state);
  };

  // State restoration utilities
  const restoreLastCompatibleState = () => {
    const currentVersion = isOptimizedNavigationEnabled ? 'enhanced' : 'original';
    const compatibleSnapshot = stateSnapshots
      .slice()
      .reverse()
      .find(snapshot => snapshot.version === currentVersion);

    if (compatibleSnapshot && navigationRef.current) {
      try {
        navigationRef.current.resetRoot(compatibleSnapshot.state);
        console.log('✅ Navigation state restored from snapshot:', {
          version: compatibleSnapshot.version,
          age: Date.now() - compatibleSnapshot.timestamp,
        });
      } catch (error) {
        console.warn('⚠️ Failed to restore navigation state:', error);
      }
    }
  };

  // Deep linking compatibility
  const handleDeepLink = (url: string) => {
    if (__DEV__) {
      console.log('🔗 Deep link handling:', {
        url,
        navigationVersion: isOptimizedNavigationEnabled ? 'enhanced' : 'original',
        hasNavigationRef: !!navigationRef.current,
      });
    }

    // Both navigation versions should handle deep links the same way
    // The linking configuration remains unchanged
    return true;
  };

  // Emergency state recovery
  const performEmergencyStateRecovery = () => {
    console.warn('🚨 Performing emergency navigation state recovery');
    
    // Try to restore from the most recent snapshot
    const latestSnapshot = stateSnapshots[stateSnapshots.length - 1];
    if (latestSnapshot && navigationRef.current) {
      try {
        navigationRef.current.resetRoot(latestSnapshot.state);
        console.log('✅ Emergency state recovery successful');
      } catch (error) {
        console.error('❌ Emergency state recovery failed:', error);
        // Fallback to initial state
        navigationRef.current.resetRoot({
          routes: [{ name: 'Auth', key: 'auth-fallback' }],
          index: 0,
        } as NavigationState);
      }
    }
  };

  // Expose compatibility utilities for debugging
  if (__DEV__) {
    (global as any).__navigationCompatibility = {
      snapshots: stateSnapshots,
      restoreLastCompatibleState,
      performEmergencyStateRecovery,
      currentVersion: isOptimizedNavigationEnabled ? 'enhanced' : 'original',
    };
  }

  return (
    <NavigationStateProvider
      value={{
        handleStateChange,
        restoreLastCompatibleState,
        performEmergencyStateRecovery,
        stateSnapshots,
        currentVersion: isOptimizedNavigationEnabled ? 'enhanced' : 'original',
      }}
      testID={testID}
    >
      {children}
    </NavigationStateProvider>
  );
};

/**
 * Navigation State Provider Context
 * 
 * Provides navigation compatibility utilities to child components
 */
interface NavigationStateContextValue {
  handleStateChange: (state: NavigationState | undefined) => void;
  restoreLastCompatibleState: () => void;
  performEmergencyStateRecovery: () => void;
  stateSnapshots: NavigationStateSnapshot[];
  currentVersion: 'original' | 'enhanced';
}

const NavigationStateContext = React.createContext<NavigationStateContextValue | null>(null);

export const useNavigationCompatibility = () => {
  const context = React.useContext(NavigationStateContext);
  if (!context) {
    throw new Error('useNavigationCompatibility must be used within NavigationCompatibilityLayer');
  }
  return context;
};

interface NavigationStateProviderProps {
  children: React.ReactNode;
  value: NavigationStateContextValue;
  testID?: string;
}

const NavigationStateProvider: React.FC<NavigationStateProviderProps> = ({
  children,
  value,
  testID
}) => {
  return (
    <NavigationStateContext.Provider value={value}>
      <View testID={testID}>
        {children}
      </View>
    </NavigationStateContext.Provider>
  );
};

/**
 * Navigation State Persistence Hook
 * 
 * Ensures navigation state persists across app restarts and feature flag changes
 */
export const useNavigationStatePersistence = (
  navigationRef: React.RefObject<NavigationContainerRef<any>>
) => {
  const { handleStateChange } = useNavigationCompatibility();
  const isRollbackMonitoringEnabled = useFeatureFlag('ROLLBACK_MONITORING');

  // Enhanced persistence that accounts for feature flag changes
  const persistNavigationState = async (state: NavigationState | undefined) => {
    if (!state) return;

    try {
      const stateToSave = {
        ...state,
        metadata: {
          timestamp: Date.now(),
          version: 'compatible', // Always save in compatible format
          featureFlags: {
            optimizedNavigation: useFeatureFlag('OPTIMIZED_NAVIGATION'),
          },
        },
      };

      // Use existing persistence mechanism but with enhanced metadata
      await AsyncStorage.setItem(
        '@navigation_state_enhanced',
        JSON.stringify(stateToSave)
      );

      if (isRollbackMonitoringEnabled && __DEV__) {
        console.log('💾 Navigation state persisted with metadata');
      }
    } catch (error) {
      console.warn('⚠️ Failed to persist navigation state:', error);
    }
  };

  const restoreNavigationState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('@navigation_state_enhanced');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Validate state compatibility
        if (parsedState.metadata?.version === 'compatible') {
          return parsedState;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to restore navigation state:', error);
    }
    return null;
  };

  return {
    persistNavigationState,
    restoreNavigationState,
    handleStateChange,
  };
};

export default NavigationCompatibilityLayer;
