import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { 
  useFeatureFlags, 
  useFeatureFlagActions, 
  useHasActiveEnhancements,
  useFeatureFlagMetrics 
} from '../hooks/useFeatureFlags';
import { colors, spacing } from '../styles/theme';

/**
 * Enhanced Navigation Provider
 * 
 * This provider manages the enhanced navigation state and provides
 * utilities for navigation enhancement features across the app.
 * 
 * BROWNFIELD SAFETY:
 * - All enhancements are opt-in via feature flags
 * - Original navigation remains untouched
 * - Emergency rollback capability built-in
 */

interface NavigationEnhancementState {
  isEnhanced: boolean;
  activeFeatures: string[];
  rollbackCapability: boolean;
  performanceMetrics: {
    renderTime: number;
    flagEvaluationTime: number;
  };
}

interface EnhancedNavigationContextValue {
  state: NavigationEnhancementState;
  actions: {
    triggerEmergencyRollback: (reason: string) => void;
    logNavigationEvent: (event: string, data?: any) => void;
  };
}

const EnhancedNavigationContext = createContext<EnhancedNavigationContextValue | null>(null);

export const useEnhancedNavigation = () => {
  const context = useContext(EnhancedNavigationContext);
  if (!context) {
    throw new Error('useEnhancedNavigation must be used within EnhancedNavigationProvider');
  }
  return context;
};

interface EnhancedNavigationProviderProps {
  children: React.ReactNode;
  testID?: string;
}

export const EnhancedNavigationProvider: React.FC<EnhancedNavigationProviderProps> = ({
  children,
  testID = 'enhanced-navigation-provider'
}) => {
  const flags = useFeatureFlags();
  const { performEmergencyRollback } = useFeatureFlagActions();
  const hasActiveEnhancements = useHasActiveEnhancements();
  const { getFlagUsageStats } = useFeatureFlagMetrics();
  
  const [state, setState] = useState<NavigationEnhancementState>({
    isEnhanced: false,
    activeFeatures: [],
    rollbackCapability: true,
    performanceMetrics: {
      renderTime: 0,
      flagEvaluationTime: 0,
    },
  });

  // Update enhancement state when flags change
  useEffect(() => {
    const startTime = performance.now();
    
    const stats = getFlagUsageStats();
    const enhancementFlags = stats.activeFlags.filter(flag => 
      !['ROLLBACK_MONITORING', 'DEBUG_NAVIGATION'].includes(flag)
    );

    const flagEvaluationTime = performance.now() - startTime;

    setState(prevState => ({
      ...prevState,
      isEnhanced: hasActiveEnhancements,
      activeFeatures: enhancementFlags,
      rollbackCapability: flags.ROLLBACK_MONITORING,
      performanceMetrics: {
        ...prevState.performanceMetrics,
        flagEvaluationTime,
      },
    }));

    // Log enhancement state changes in development
    if (__DEV__) {
      console.log('🚀 Enhanced Navigation State Update:', {
        isEnhanced: hasActiveEnhancements,
        activeFeatures: enhancementFlags,
        flagEvaluationTime: `${flagEvaluationTime.toFixed(2)}ms`,
        totalFlags: stats.totalFlags,
        activeCount: stats.activeCount,
      });
    }
  }, [flags, hasActiveEnhancements, getFlagUsageStats]);

  // Emergency rollback with user confirmation
  const triggerEmergencyRollback = (reason: string) => {
    if (__DEV__) {
      // In development, show confirmation dialog
      Alert.alert(
        'Emergency Rollback',
        `Are you sure you want to rollback navigation enhancements?\n\nReason: ${reason}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Rollback',
            style: 'destructive',
            onPress: () => {
              performEmergencyRollback(reason);
              console.warn('🚨 Emergency rollback triggered:', reason);
            },
          },
        ]
      );
    } else {
      // In production, rollback immediately
      performEmergencyRollback(reason);
    }
  };

  // Navigation event logging for debugging and monitoring
  const logNavigationEvent = (event: string, data?: any) => {
    if (flags.DEBUG_NAVIGATION) {
      console.log(`🧭 Navigation Event: ${event}`, data);
    }
    
    // In production, this could send to analytics/monitoring
    if (flags.ROLLBACK_MONITORING && !__DEV__) {
      // TODO: Send to monitoring service
      // monitoringService.logNavigationEvent(event, data);
    }
  };

  const contextValue: EnhancedNavigationContextValue = {
    state,
    actions: {
      triggerEmergencyRollback,
      logNavigationEvent,
    },
  };

  return (
    <EnhancedNavigationContext.Provider value={contextValue}>
      <View style={styles.container} testID={testID}>
        {/* Development Enhancement Indicator */}
        {__DEV__ && state.isEnhanced && (
          <View style={styles.enhancementIndicator} testID={`${testID}-indicator`}>
            <Text style={styles.indicatorText}>
              🚀 Enhanced Navigation Active ({state.activeFeatures.length} features)
            </Text>
            <Text style={styles.indicatorSubtext}>
              Evaluation: {state.performanceMetrics.flagEvaluationTime.toFixed(2)}ms
            </Text>
          </View>
        )}
        
        {children}
        
        {/* Development Debug Panel */}
        {__DEV__ && flags.DEBUG_NAVIGATION && (
          <NavigationDebugPanel />
        )}
      </View>
    </EnhancedNavigationContext.Provider>
  );
};

/**
 * Development Debug Panel
 * 
 * Shows navigation enhancement status and provides quick actions
 * for development and testing purposes.
 */
const NavigationDebugPanel: React.FC = () => {
  const { state, actions } = useEnhancedNavigation();
  const flags = useFeatureFlags();

  return (
    <View style={styles.debugPanel} testID="navigation-debug-panel">
      <Text style={styles.debugTitle}>Navigation Debug</Text>
      <Text style={styles.debugText}>
        Enhanced: {state.isEnhanced ? 'Yes' : 'No'}
      </Text>
      <Text style={styles.debugText}>
        Active Features: {state.activeFeatures.join(', ') || 'None'}
      </Text>
      <Text style={styles.debugText}>
        Rollback Ready: {state.rollbackCapability ? 'Yes' : 'No'}
      </Text>
      <Text style={styles.debugText}>
        Flag Eval: {state.performanceMetrics.flagEvaluationTime.toFixed(2)}ms
      </Text>
      
      {/* Quick rollback button for testing */}
      {state.isEnhanced && (
        <Text 
          style={styles.debugButton}
          onPress={() => actions.triggerEmergencyRollback('Debug panel test')}
        >
          🚨 Test Rollback
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  enhancementIndicator: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  indicatorText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  indicatorSubtext: {
    color: colors.surface,
    fontSize: 10,
    opacity: 0.8,
  },
  debugPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  debugTitle: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  debugText: {
    color: colors.surface,
    fontSize: 12,
    marginBottom: 2,
  },
  debugButton: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
    padding: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
});

export default EnhancedNavigationProvider;
