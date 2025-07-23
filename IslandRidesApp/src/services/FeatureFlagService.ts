/**
 * FeatureFlagService - Manages feature flags for safer deployments and A/B testing
 * Part of Initiative 3: Feature Flag Foundation
 */

export interface FeatureFlags {
  // Island-specific features
  ISLAND_AWARE_SEARCH: boolean;
  ISLAND_CONTEXT_PROVIDER: boolean;
  
  // Host and verification features
  HOST_VERIFICATION_V2: boolean;
  ENHANCED_HOST_DASHBOARD: boolean;
  
  // Payment and booking features
  PAYMENT_INTEGRATION: boolean;
  PAYPAL_INTEGRATION: boolean;
  APPLE_PAY_INTEGRATION: boolean;
  
  // Search and filtering features
  ADVANCED_FILTERING: boolean;
  SMART_SEARCH_SUGGESTIONS: boolean;
  LOCATION_BASED_SEARCH: boolean;
  
  // Real-time features
  REAL_TIME_UPDATES: boolean;
  LIVE_CHAT_SUPPORT: boolean;
  PUSH_NOTIFICATIONS_V2: boolean;
  
  // Performance and monitoring features
  PERFORMANCE_MONITORING: boolean;
  ANALYTICS_TRACKING: boolean;
  ERROR_BOUNDARY_ENHANCED: boolean;
  
  // UI/UX features
  MODERN_VEHICLE_CARDS: boolean;
  DARK_MODE_SUPPORT: boolean;
  HAPTIC_FEEDBACK: boolean;
  
  // API and infrastructure features
  API_SERVICE_CONSOLIDATION: boolean;
  CACHING_STRATEGY_V2: boolean;
  OFFLINE_SUPPORT: boolean;
}

interface FeatureFlagConfig {
  flag: keyof FeatureFlags;
  description: string;
  defaultValue: boolean;
  environment?: 'development' | 'staging' | 'production' | 'all';
  rolloutPercentage?: number;
}

class FeatureFlagService {
  private flags: FeatureFlags = {
    // Island-specific features - Enable for Week 2
    ISLAND_AWARE_SEARCH: true,
    ISLAND_CONTEXT_PROVIDER: true,
    
    // Host and verification features
    HOST_VERIFICATION_V2: false,
    ENHANCED_HOST_DASHBOARD: false,
    
    // Payment and booking features - Payment integration is already live
    PAYMENT_INTEGRATION: true,
    PAYPAL_INTEGRATION: true,
    APPLE_PAY_INTEGRATION: false,
    
    // Search and filtering features
    ADVANCED_FILTERING: false,
    SMART_SEARCH_SUGGESTIONS: false,
    LOCATION_BASED_SEARCH: true,
    
    // Real-time features
    REAL_TIME_UPDATES: false,
    LIVE_CHAT_SUPPORT: false,
    PUSH_NOTIFICATIONS_V2: false,
    
    // Performance and monitoring features - Enable monitoring by default
    PERFORMANCE_MONITORING: true,
    ANALYTICS_TRACKING: true,
    ERROR_BOUNDARY_ENHANCED: true,
    
    // UI/UX features
    MODERN_VEHICLE_CARDS: true,
    DARK_MODE_SUPPORT: false,
    HAPTIC_FEEDBACK: false,
    
    // API and infrastructure features - Enable consolidation for our implementation
    API_SERVICE_CONSOLIDATION: true,
    CACHING_STRATEGY_V2: false,
    OFFLINE_SUPPORT: false,
  };

  private flagConfigs: FeatureFlagConfig[] = [
    {
      flag: 'ISLAND_AWARE_SEARCH',
      description: 'Enable island-specific search functionality',
      defaultValue: false,
      environment: 'all'
    },
    {
      flag: 'HOST_VERIFICATION_V2',
      description: 'Enhanced host verification process',
      defaultValue: false,
      environment: 'staging'
    },
    {
      flag: 'PAYMENT_INTEGRATION',
      description: 'Core payment processing functionality',
      defaultValue: true,
      environment: 'all'
    },
    {
      flag: 'ADVANCED_FILTERING',
      description: 'Advanced vehicle search filters',
      defaultValue: false,
      environment: 'development'
    },
    {
      flag: 'PERFORMANCE_MONITORING',
      description: 'Performance tracking and monitoring',
      defaultValue: true,
      environment: 'all'
    },
    {
      flag: 'API_SERVICE_CONSOLIDATION',
      description: 'Use consolidated domain services',
      defaultValue: true,
      environment: 'all'
    }
  ];

  private userId?: string;
  private environment: string = 'development'; // Default to development
  
  constructor() {
    this.initializeEnvironment();
    this.loadStoredFlags();
  }

  private initializeEnvironment(): void {
    // In a real app, this would come from environment variables or config
    if (typeof __DEV__ !== 'undefined') {
      this.environment = __DEV__ ? 'development' : 'production';
    }
  }

  private loadStoredFlags(): void {
    // In a real implementation, this would load from local storage or API
    // For now, we'll use the default values
    console.log('🚩 Feature flags initialized with default values');
  }

  /**
   * Check if a feature flag is enabled
   * @param flag - The feature flag to check
   * @returns True if the flag is enabled
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    const flagValue = this.flags[flag];
    const config = this.flagConfigs.find(c => c.flag === flag);
    
    // Check environment restrictions
    if (config?.environment && config.environment !== 'all' && config.environment !== this.environment) {
      return false;
    }
    
    // Check rollout percentage (for gradual rollouts)
    if (config?.rolloutPercentage && config.rolloutPercentage < 100) {
      const userHash = this.getUserHash();
      const isInRollout = (userHash % 100) < config.rolloutPercentage;
      return flagValue && isInRollout;
    }
    
    return flagValue;
  }

  /**
   * Enable a feature flag
   * @param flag - The feature flag to enable
   */
  enableFlag(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
    this.persistFlags();
    console.log(`🚩 Feature flag enabled: ${flag}`);
  }

  /**
   * Disable a feature flag
   * @param flag - The feature flag to disable
   */
  disableFlag(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
    this.persistFlags();
    console.log(`🚩 Feature flag disabled: ${flag}`);
  }

  /**
   * Toggle a feature flag
   * @param flag - The feature flag to toggle
   */
  toggleFlag(flag: keyof FeatureFlags): void {
    this.flags[flag] = !this.flags[flag];
    this.persistFlags();
    console.log(`🚩 Feature flag toggled: ${flag} = ${this.flags[flag]}`);
  }

  /**
   * Get all feature flags and their current values
   * @returns Object containing all feature flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Get all feature flag configurations
   * @returns Array of feature flag configurations
   */
  getAllConfigs(): FeatureFlagConfig[] {
    return [...this.flagConfigs];
  }

  /**
   * Set user ID for user-specific flag evaluations
   * @param userId - The user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Bulk update feature flags
   * @param flagUpdates - Object containing flag updates
   */
  updateFlags(flagUpdates: Partial<FeatureFlags>): void {
    Object.entries(flagUpdates).forEach(([key, value]) => {
      if (key in this.flags && typeof value === 'boolean') {
        this.flags[key as keyof FeatureFlags] = value;
      }
    });
    this.persistFlags();
    console.log('🚩 Feature flags bulk updated:', flagUpdates);
  }

  /**
   * Reset all flags to their default values
   */
  resetToDefaults(): void {
    this.flagConfigs.forEach(config => {
      this.flags[config.flag] = config.defaultValue;
    });
    this.persistFlags();
    console.log('🚩 Feature flags reset to defaults');
  }

  /**
   * Log current feature flag status
   */
  logStatus(): void {
    console.log('🚩 Current Feature Flag Status:');
    console.log('================================');
    Object.entries(this.flags).forEach(([key, value]) => {
      const status = value ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`${status} ${key}`);
    });
  }

  private getUserHash(): number {
    if (!this.userId) {
      return Math.floor(Math.random() * 100);
    }
    
    // Simple hash function for consistent user bucketing
    let hash = 0;
    for (let i = 0; i < this.userId.length; i++) {
      const char = this.userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private persistFlags(): void {
    // In a real implementation, this would save to local storage or sync with API
    // For now, we'll just log
    console.log('🚩 Feature flags persisted');
  }
}

export const featureFlags = new FeatureFlagService();

/**
 * React hook for easy access to feature flags in components
 * @param flag - The feature flag to check
 * @returns True if the flag is enabled
 */
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  return featureFlags.isEnabled(flag);
};

// Export the class for testing
export { FeatureFlagService };