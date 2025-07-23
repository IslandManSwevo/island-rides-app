import {
  getEnvironmentFlags,
  getEnvironmentVariableOverrides,
  getFeatureFlagsConfig,
  getEmergencyRollbackConfig,
  validateFeatureFlagsConfig,
  FEATURE_FLAGS_METADATA,
} from '../../src/config/featureFlags';

// Mock environment variables
const mockEnv = (envVars: Record<string, string>) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...envVars };
  return () => {
    process.env = originalEnv;
  };
};

describe('featureFlags config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEnvironmentFlags', () => {
    it('should return development flags', () => {
      const flags = getEnvironmentFlags('development');
      
      expect(flags.ROLLBACK_MONITORING).toBe(true);
      expect(flags.DEBUG_NAVIGATION).toBe(true);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
    });

    it('should return staging flags', () => {
      const flags = getEnvironmentFlags('staging');
      
      expect(flags.ROLLBACK_MONITORING).toBe(true);
      expect(flags.DEBUG_NAVIGATION).toBe(false);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
    });

    it('should return production flags', () => {
      const flags = getEnvironmentFlags('production');
      
      expect(flags.ROLLBACK_MONITORING).toBe(true);
      expect(flags.DEBUG_NAVIGATION).toBe(false);
      expect(flags.ENHANCED_HOME_SCREEN).toBe(false);
    });

    it('should default to development for unknown environment', () => {
      const flags = getEnvironmentFlags('unknown' as any);
      const devFlags = getEnvironmentFlags('development');
      
      expect(flags).toEqual(devFlags);
    });
  });

  describe('getEnvironmentVariableOverrides', () => {
    it('should parse environment variable overrides', () => {
      const restoreEnv = mockEnv({
        EXPO_PUBLIC_FF_ENHANCED_HOME_SCREEN: 'true',
        EXPO_PUBLIC_FF_SMART_ISLAND_SELECTION: 'false',
        EXPO_PUBLIC_FF_DEBUG_NAVIGATION: 'true',
      });

      const overrides = getEnvironmentVariableOverrides();

      expect(overrides.ENHANCED_HOME_SCREEN).toBe(true);
      expect(overrides.SMART_ISLAND_SELECTION).toBe(false);
      expect(overrides.DEBUG_NAVIGATION).toBe(true);

      restoreEnv();
    });

    it('should handle case-insensitive boolean parsing', () => {
      const restoreEnv = mockEnv({
        EXPO_PUBLIC_FF_ENHANCED_HOME_SCREEN: 'TRUE',
        EXPO_PUBLIC_FF_SMART_ISLAND_SELECTION: 'False',
        EXPO_PUBLIC_FF_DEBUG_NAVIGATION: 'tRuE',
      });

      const overrides = getEnvironmentVariableOverrides();

      expect(overrides.ENHANCED_HOME_SCREEN).toBe(true);
      expect(overrides.SMART_ISLAND_SELECTION).toBe(false);
      expect(overrides.DEBUG_NAVIGATION).toBe(true);

      restoreEnv();
    });

    it('should ignore undefined environment variables', () => {
      const restoreEnv = mockEnv({});
      
      const overrides = getEnvironmentVariableOverrides();
      
      expect(Object.keys(overrides)).toHaveLength(0);

      restoreEnv();
    });

    it('should treat non-true values as false', () => {
      const restoreEnv = mockEnv({
        EXPO_PUBLIC_FF_ENHANCED_HOME_SCREEN: 'yes',
        EXPO_PUBLIC_FF_SMART_ISLAND_SELECTION: '1',
        EXPO_PUBLIC_FF_DEBUG_NAVIGATION: 'enabled',
      });

      const overrides = getEnvironmentVariableOverrides();

      expect(overrides.ENHANCED_HOME_SCREEN).toBe(false);
      expect(overrides.SMART_ISLAND_SELECTION).toBe(false);
      expect(overrides.DEBUG_NAVIGATION).toBe(false);

      restoreEnv();
    });
  });

  describe('getFeatureFlagsConfig', () => {
    it('should combine environment flags with overrides', () => {
      const restoreEnv = mockEnv({
        EXPO_PUBLIC_FF_ENHANCED_HOME_SCREEN: 'true',
      });

      const config = getFeatureFlagsConfig('development');

      expect(config.ROLLBACK_MONITORING).toBe(true); // From environment
      expect(config.DEBUG_NAVIGATION).toBe(true); // From environment
      expect(config.ENHANCED_HOME_SCREEN).toBe(true); // From override

      restoreEnv();
    });

    it('should prioritize overrides over environment flags', () => {
      const restoreEnv = mockEnv({
        EXPO_PUBLIC_FF_DEBUG_NAVIGATION: 'false', // Override development default
      });

      const config = getFeatureFlagsConfig('development');

      expect(config.DEBUG_NAVIGATION).toBe(false); // Override should win

      restoreEnv();
    });
  });

  describe('getEmergencyRollbackConfig', () => {
    it('should disable all enhancement flags', () => {
      const config = getEmergencyRollbackConfig();

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
        expect(config[flag]).toBe(false);
      });
    });

    it('should preserve monitoring infrastructure', () => {
      const config = getEmergencyRollbackConfig();

      expect(config.ROLLBACK_MONITORING).toBe(true);
      expect(config.DEBUG_NAVIGATION).toBe(false);
    });
  });

  describe('validateFeatureFlagsConfig', () => {
    it('should validate production configuration', () => {
      const safeProductionConfig = {
        ROLLBACK_MONITORING: true,
        DEBUG_NAVIGATION: false,
        ENHANCED_HOME_SCREEN: false,
      };

      const result = validateFeatureFlagsConfig(safeProductionConfig, 'production');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about enhancement flags in production', () => {
      const unsafeProductionConfig = {
        ENHANCED_HOME_SCREEN: true,
        SMART_ISLAND_SELECTION: true,
      };

      const result = validateFeatureFlagsConfig(unsafeProductionConfig, 'production');

      expect(result.warnings).toContain('⚠️ Enhancement flag ENHANCED_HOME_SCREEN is enabled in production');
      expect(result.warnings).toContain('⚠️ Enhancement flag SMART_ISLAND_SELECTION is enabled in production');
    });

    it('should warn about missing rollback monitoring in production', () => {
      const configWithoutMonitoring = {
        ROLLBACK_MONITORING: false,
      };

      const result = validateFeatureFlagsConfig(configWithoutMonitoring, 'production');

      expect(result.warnings).toContain('⚠️ ROLLBACK_MONITORING should be enabled in production');
    });

    it('should warn about debug flags in non-development environments', () => {
      const configWithDebug = {
        DEBUG_NAVIGATION: true,
      };

      const stagingResult = validateFeatureFlagsConfig(configWithDebug, 'staging');
      const productionResult = validateFeatureFlagsConfig(configWithDebug, 'production');

      expect(stagingResult.warnings).toContain('⚠️ DEBUG_NAVIGATION is enabled in staging environment');
      expect(productionResult.warnings).toContain('⚠️ DEBUG_NAVIGATION is enabled in production environment');
    });

    it('should allow debug flags in development', () => {
      const configWithDebug = {
        DEBUG_NAVIGATION: true,
        ENHANCED_HOME_SCREEN: true,
      };

      const result = validateFeatureFlagsConfig(configWithDebug, 'development');

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('FEATURE_FLAGS_METADATA', () => {
    it('should contain required metadata fields', () => {
      expect(FEATURE_FLAGS_METADATA.version).toBeTruthy();
      expect(FEATURE_FLAGS_METADATA.lastUpdated).toBeTruthy();
      expect(FEATURE_FLAGS_METADATA.description).toBeTruthy();
      expect(FEATURE_FLAGS_METADATA.documentation).toBeTruthy();
      expect(FEATURE_FLAGS_METADATA.emergencyContact).toBeTruthy();
    });

    it('should have valid version format', () => {
      expect(FEATURE_FLAGS_METADATA.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have valid date format', () => {
      expect(FEATURE_FLAGS_METADATA.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Brownfield Safety', () => {
    it('should ensure all environments default enhancement flags to false', () => {
      const environments = ['development', 'staging', 'production'] as const;
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

      environments.forEach(env => {
        const flags = getEnvironmentFlags(env);
        enhancementFlags.forEach(flag => {
          expect(flags[flag]).toBe(false);
        });
      });
    });

    it('should ensure production has the safest configuration', () => {
      const productionFlags = getEnvironmentFlags('production');

      expect(productionFlags.ROLLBACK_MONITORING).toBe(true);
      expect(productionFlags.DEBUG_NAVIGATION).toBe(false);

      // All enhancement flags should be false
      const enhancementFlags = Object.entries(productionFlags)
        .filter(([key]) => !['ROLLBACK_MONITORING', 'DEBUG_NAVIGATION'].includes(key))
        .map(([_, value]) => value);

      enhancementFlags.forEach(flag => {
        expect(flag).toBe(false);
      });
    });

    it('should ensure emergency rollback disables all enhancements', () => {
      const rollbackConfig = getEmergencyRollbackConfig();
      
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
        expect(rollbackConfig[flag]).toBe(false);
      });
    });
  });
});
