import { NavigationFeatureFlags } from '../store/slices/featureFlagsSlice';

/**
 * Environment-based Feature Flag Configuration
 * 
 * This module provides environment-specific feature flag configurations
 * for safe rollout of navigation enhancements.
 * 
 * CRITICAL BROWNFIELD SAFETY:
 * - All flags default to FALSE in all environments
 * - Only enable flags after thorough testing
 * - Production flags should only be enabled after staging validation
 */

/**
 * Development environment feature flags
 * Used for local development and testing
 */
const developmentFlags: Partial<NavigationFeatureFlags> = {
  // Infrastructure flags - can be enabled for development
  ROLLBACK_MONITORING: true,
  DEBUG_NAVIGATION: true,
  
  // Enhancement flags - disabled by default, enable for testing
  ENHANCED_HOME_SCREEN: false,
  SMART_ISLAND_SELECTION: false,
  OPTIMIZED_NAVIGATION: false,
  ENHANCED_VEHICLE_DETAIL: false,
  STREAMLINED_BOOKING: false,
  TRUST_SIGNALS: false,
  ADVANCED_DISCOVERY: false,
  ENHANCED_COMMUNICATION: false,
  PERFORMANCE_OPTIMIZATION: false,
};

/**
 * Staging environment feature flags
 * Used for pre-production testing and validation
 */
const stagingFlags: Partial<NavigationFeatureFlags> = {
  // Infrastructure flags - enabled for monitoring
  ROLLBACK_MONITORING: true,
  DEBUG_NAVIGATION: false,
  
  // Enhancement flags - disabled by default, enable for staging tests
  ENHANCED_HOME_SCREEN: false,
  SMART_ISLAND_SELECTION: false,
  OPTIMIZED_NAVIGATION: false,
  ENHANCED_VEHICLE_DETAIL: false,
  STREAMLINED_BOOKING: false,
  TRUST_SIGNALS: false,
  ADVANCED_DISCOVERY: false,
  ENHANCED_COMMUNICATION: false,
  PERFORMANCE_OPTIMIZATION: false,
};

/**
 * Production environment feature flags
 * Used for live production deployment
 */
const productionFlags: Partial<NavigationFeatureFlags> = {
  // Infrastructure flags - monitoring enabled, debug disabled
  ROLLBACK_MONITORING: true,
  DEBUG_NAVIGATION: false,
  
  // Enhancement flags - ALL DISABLED for production safety
  ENHANCED_HOME_SCREEN: false,
  SMART_ISLAND_SELECTION: false,
  OPTIMIZED_NAVIGATION: false,
  ENHANCED_VEHICLE_DETAIL: false,
  STREAMLINED_BOOKING: false,
  TRUST_SIGNALS: false,
  ADVANCED_DISCOVERY: false,
  ENHANCED_COMMUNICATION: false,
  PERFORMANCE_OPTIMIZATION: false,
};

/**
 * Environment-specific flag configurations
 */
const environmentFlags = {
  development: developmentFlags,
  staging: stagingFlags,
  production: productionFlags,
};

/**
 * Get feature flags for the current environment
 * 
 * @param environment - The current environment
 * @returns Partial feature flags configuration for the environment
 */
export const getEnvironmentFlags = (
  environment: 'development' | 'staging' | 'production'
): Partial<NavigationFeatureFlags> => {
  return environmentFlags[environment] || environmentFlags.development;
};

/**
 * Override flags from environment variables
 * 
 * This allows runtime configuration of feature flags through environment variables.
 * Environment variable names should be prefixed with EXPO_PUBLIC_FF_
 * 
 * Example: EXPO_PUBLIC_FF_ENHANCED_HOME_SCREEN=true
 */
export const getEnvironmentVariableOverrides = (): Partial<NavigationFeatureFlags> => {
  const overrides: Partial<NavigationFeatureFlags> = {};
  
  // List of all feature flag keys for environment variable checking
  const flagKeys: (keyof NavigationFeatureFlags)[] = [
    'ENHANCED_HOME_SCREEN',
    'SMART_ISLAND_SELECTION',
    'OPTIMIZED_NAVIGATION',
    'ENHANCED_VEHICLE_DETAIL',
    'STREAMLINED_BOOKING',
    'TRUST_SIGNALS',
    'ADVANCED_DISCOVERY',
    'ENHANCED_COMMUNICATION',
    'PERFORMANCE_OPTIMIZATION',
    'ROLLBACK_MONITORING',
    'DEBUG_NAVIGATION',
  ];
  
  // Check for environment variable overrides
  flagKeys.forEach((key) => {
    const envVarName = `EXPO_PUBLIC_FF_${key}`;
    const envValue = process.env[envVarName];
    
    if (envValue !== undefined) {
      // Convert string to boolean
      const boolValue = envValue.toLowerCase() === 'true';
      overrides[key] = boolValue;
      
      if (__DEV__) {
        console.log(`🚩 Feature flag override: ${key} = ${boolValue} (from ${envVarName})`);
      }
    }
  });
  
  return overrides;
};

/**
 * Get complete feature flag configuration for the current environment
 * 
 * This combines environment-specific flags with environment variable overrides
 * 
 * @param environment - The current environment
 * @returns Complete feature flags configuration
 */
export const getFeatureFlagsConfig = (
  environment: 'development' | 'staging' | 'production'
): Partial<NavigationFeatureFlags> => {
  const baseFlags = getEnvironmentFlags(environment);
  const overrides = getEnvironmentVariableOverrides();
  
  const finalConfig = { ...baseFlags, ...overrides };
  
  if (__DEV__) {
    console.log('🚩 Feature Flags Configuration:', {
      environment,
      baseFlags,
      overrides,
      finalConfig,
    });
  }
  
  return finalConfig;
};

/**
 * Emergency rollback configuration
 * 
 * This configuration is used during emergency rollback scenarios
 * to quickly disable all enhancement features while preserving monitoring
 */
export const getEmergencyRollbackConfig = (): Partial<NavigationFeatureFlags> => {
  return {
    // Disable all enhancement flags
    ENHANCED_HOME_SCREEN: false,
    SMART_ISLAND_SELECTION: false,
    OPTIMIZED_NAVIGATION: false,
    ENHANCED_VEHICLE_DETAIL: false,
    STREAMLINED_BOOKING: false,
    TRUST_SIGNALS: false,
    ADVANCED_DISCOVERY: false,
    ENHANCED_COMMUNICATION: false,
    PERFORMANCE_OPTIMIZATION: false,
    
    // Keep monitoring enabled for rollback tracking
    ROLLBACK_MONITORING: true,
    DEBUG_NAVIGATION: false,
  };
};

/**
 * Validate feature flag configuration
 * 
 * Ensures that feature flag configuration is safe for the given environment
 * 
 * @param flags - Feature flags to validate
 * @param environment - Target environment
 * @returns Validation result with warnings
 */
export const validateFeatureFlagsConfig = (
  flags: Partial<NavigationFeatureFlags>,
  environment: 'development' | 'staging' | 'production'
): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  let isValid = true;
  
  // Production safety checks
  if (environment === 'production') {
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
    
    enhancementFlags.forEach((flag) => {
      if (flags[flag] === true) {
        warnings.push(`⚠️ Enhancement flag ${flag} is enabled in production`);
      }
    });
    
    // Ensure monitoring is enabled in production
    if (flags.ROLLBACK_MONITORING === false) {
      warnings.push('⚠️ ROLLBACK_MONITORING should be enabled in production');
    }
  }
  
  // Debug flag warnings for non-development environments
  if (environment !== 'development' && flags.DEBUG_NAVIGATION === true) {
    warnings.push(`⚠️ DEBUG_NAVIGATION is enabled in ${environment} environment`);
  }
  
  return { isValid, warnings };
};

/**
 * Feature flag configuration metadata
 */
export const FEATURE_FLAGS_METADATA = {
  version: '1.0.0',
  lastUpdated: '2025-01-22',
  description: 'Navigation enhancement feature flags for KeyLo app',
  documentation: 'docs/stories/epic-1-story-1-1-rollback-infrastructure.md',
  emergencyContact: 'development-team@keylo.com',
} as const;
