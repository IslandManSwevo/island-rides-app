/**
 * Metro Bundling Issue Monitor
 * Tracks module resolution, bundling performance, and identifies "module 1021" type errors
 */

export class MetroBundleMonitor {
  private static instance: MetroBundleMonitor;
  private bundleStartTime: number = 0;
  private moduleResolutionTimes: Map<string, number> = new Map();
  private circularDependencies: Set<string> = new Set();

  static getInstance(): MetroBundleMonitor {
    if (!MetroBundleMonitor.instance) {
      MetroBundleMonitor.instance = new MetroBundleMonitor();
    }
    return MetroBundleMonitor.instance;
  }

  /**
   * Monitor bundle startup and catch module resolution errors
   */
  startBundleMonitoring() {
    this.bundleStartTime = performance.now();
    console.log('🔍 [BUNDLE MONITOR] Starting Metro bundle monitoring...');

    // Override require to track module resolution
    this.wrapRequireFunction();
    
    // Monitor for the specific "module 1021" error pattern
    this.setupErrorInterception();
    
    // Track bundle completion
    this.trackBundleCompletion();
  }

  private wrapRequireFunction() {
    if (typeof require !== 'undefined' && (require as any).__wrapped !== true) {
      const originalRequire = require;
      
      (require as any) = (moduleId: string) => {
        const startTime = performance.now();
        
        try {
          // Check for problematic numeric module IDs like "1021"
          if (/^\d+$/.test(moduleId)) {
            console.warn(`⚠️ [BUNDLE MONITOR] Numeric module ID detected: ${moduleId}`);
            this.reportNumericModuleId(moduleId);
          }
          
          const result = originalRequire(moduleId);
          const resolutionTime = performance.now() - startTime;
          
          this.moduleResolutionTimes.set(moduleId, resolutionTime);
          
          // Alert on slow module resolution (>50ms)
          if (resolutionTime > 50) {
            console.warn(`🐌 [BUNDLE MONITOR] Slow module resolution: ${moduleId} took ${resolutionTime.toFixed(2)}ms`);
          }
          
          return result;
        } catch (error) {
          console.error(`❌ [BUNDLE MONITOR] Module resolution failed: ${moduleId}`, error);
          this.reportModuleError(moduleId, error);
          throw error;
        }
      };
      
      (require as any).__wrapped = true;
    }
  }

  private setupErrorInterception() {
    // Intercept console errors to catch bundling issues
    const originalError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      
      // Check for Metro bundling specific errors
      if (errorMessage.includes('Requiring unknown module') || 
          errorMessage.includes('Module not found') ||
          /module.*\d+/.test(errorMessage)) {
        console.log('🔍 [BUNDLE MONITOR] Metro bundling error detected:', errorMessage);
        this.analyzeBundlingError(errorMessage, args);
      }
      
      originalError.apply(console, args);
    };
  }

  private trackBundleCompletion() {
    // Use requestIdleCallback to detect when initial bundling is complete
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        const totalBundleTime = performance.now() - this.bundleStartTime;
        console.log(`✅ [BUNDLE MONITOR] Bundle loading completed in ${totalBundleTime.toFixed(2)}ms`);
        this.generateBundleReport();
      });
    } else {
      // Fallback for environments without requestIdleCallback
      setTimeout(() => {
        const totalBundleTime = performance.now() - this.bundleStartTime;
        console.log(`✅ [BUNDLE MONITOR] Bundle loading completed in ${totalBundleTime.toFixed(2)}ms`);
        this.generateBundleReport();
      }, 100);
    }
  }

  private reportNumericModuleId(moduleId: string) {
    console.log(`🔍 [BUNDLE MONITOR] NUMERIC MODULE ANALYSIS:
      Module ID: ${moduleId}
      Timestamp: ${new Date().toISOString()}
      Bundle Time: ${(performance.now() - this.bundleStartTime).toFixed(2)}ms
      
      RECOMMENDATION: This numeric module ID suggests a Metro bundler issue.
      Try: 
      1. Clear Metro cache: npm run clean
      2. Delete node_modules/.cache
      3. Restart Metro with --reset-cache
    `);
  }

  private reportModuleError(moduleId: string, error: Error | unknown) {
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    console.error(`🔍 [BUNDLE MONITOR] MODULE ERROR ANALYSIS:
      Failed Module: ${moduleId}
      Error Type: ${errorName}
      Error Message: ${errorMessage}
      Stack: ${errorStack}

      Potential Causes:
      - Circular dependency
      - Missing dependency
      - Metro cache corruption
      - Invalid import path
    `);
  }

  private analyzeBundlingError(errorMessage: string, args: unknown[]) {
    // Extract module ID from error message
    const moduleIdMatch = errorMessage.match(/module["\s]+([\d\w]+)["\s]*/i);
    const moduleId = moduleIdMatch ? moduleIdMatch[1] : 'unknown';
    
    console.log(`🔍 [BUNDLE MONITOR] BUNDLING ERROR ANALYSIS:
      Original Error: ${errorMessage}
      Extracted Module ID: ${moduleId}
      Error Arguments: ${JSON.stringify(args, null, 2)}
      
      TROUBLESHOOTING STEPS:
      1. Check if module ${moduleId} exists in node_modules
      2. Look for circular imports involving this module
      3. Verify Metro configuration for this module type
      4. Clear Metro cache and restart
      
      Metro Cache Commands:
      - npm run clean
      - rm -rf node_modules/.cache .expo .metro
      - npx expo start --clear
    `);
  }

  private generateBundleReport() {
    const slowModules = Array.from(this.moduleResolutionTimes.entries())
      .filter(([_, time]) => time > 10)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10);

    console.log(`📊 [BUNDLE MONITOR] PERFORMANCE REPORT:
      Total Bundle Time: ${(performance.now() - this.bundleStartTime).toFixed(2)}ms
      Modules Loaded: ${this.moduleResolutionTimes.size}
      
      TOP 10 SLOWEST MODULES:
      ${slowModules.map(([module, time]) => `  ${module}: ${time.toFixed(2)}ms`).join('\n      ')}
      
      CIRCULAR DEPENDENCIES: ${this.circularDependencies.size}
      ${Array.from(this.circularDependencies).map(dep => `  - ${dep}`).join('\n      ')}
    `);
  }

  /**
   * Get real-time bundle metrics
   */
  getMetrics() {
    return {
      bundleStartTime: this.bundleStartTime,
      currentTime: performance.now(),
      totalBundleTime: performance.now() - this.bundleStartTime,
      modulesLoaded: this.moduleResolutionTimes.size,
      slowestModules: Array.from(this.moduleResolutionTimes.entries())
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 5),
      circularDependencies: Array.from(this.circularDependencies),
      hasErrors: this.circularDependencies.size > 0
    };
  }
}

// Auto-initialize when module loads
const bundleMonitor = MetroBundleMonitor.getInstance();
export default bundleMonitor;