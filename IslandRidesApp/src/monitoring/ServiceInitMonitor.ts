/**
 * Service Initialization Performance Monitor
 * Tracks ServiceRegistry startup, timeout detection, and service dependency analysis
 */

export class ServiceInitMonitor {
  private static instance: ServiceInitMonitor;
  private serviceTimings: Map<string, { start: number; end?: number; duration?: number; status: 'pending' | 'success' | 'timeout' | 'error'; error?: any }> = new Map();
  private totalInitStart: number = 0;
  private initializationPromise: Promise<void> | null = null;

  static getInstance(): ServiceInitMonitor {
    if (!ServiceInitMonitor.instance) {
      ServiceInitMonitor.instance = new ServiceInitMonitor();
    }
    return ServiceInitMonitor.instance;
  }

  /**
   * Start monitoring service initialization process
   */
  startServiceMonitoring() {
    this.totalInitStart = performance.now();
    console.log('🔍 [SERVICE MONITOR] Starting service initialization monitoring...');
    
    // Wrap ServiceRegistry methods to monitor performance
    this.wrapServiceRegistry();
    
    // Set up timeout detection
    this.setupTimeoutDetection();
    
    // Monitor async initialization completion
    this.trackInitCompletion();
  }

  private wrapServiceRegistry() {
    try {
      // Dynamically import and wrap the service registry
      const serviceRegistryPath = '../services/ServiceRegistry';
      
      // Create a monitoring wrapper for service initialization
      this.createServiceWrapper('platform');
      this.createServiceWrapper('environment'); 
      this.createServiceWrapper('storage');
      this.createServiceWrapper('logging');
      this.createServiceWrapper('api');
      this.createServiceWrapper('auth');
      this.createServiceWrapper('errorRecovery');
      
      console.log('🔍 [SERVICE MONITOR] Service registry wrapped for monitoring');
    } catch (error) {
      console.warn('⚠️ [SERVICE MONITOR] Could not wrap service registry:', error);
    }
  }

  private createServiceWrapper(serviceName: string) {
    const startTime = performance.now();
    this.serviceTimings.set(serviceName, {
      start: startTime,
      status: 'pending'
    });
    
    console.log(`⏱️ [SERVICE MONITOR] ${serviceName} service initialization started`);
  }

  /**
   * Track individual service completion
   */
  trackServiceComplete(serviceName: string, success: boolean, error?: any) {
    const timing = this.serviceTimings.get(serviceName);
    if (timing) {
      const endTime = performance.now();
      timing.end = endTime;
      timing.duration = endTime - timing.start;
      timing.status = success ? 'success' : 'error';
      if (error) timing.error = error;
      
      const statusIcon = success ? '✅' : '❌';
      const durationFormatted = timing.duration.toFixed(2);
      
      console.log(`${statusIcon} [SERVICE MONITOR] ${serviceName} completed in ${durationFormatted}ms`);
      
      // Alert on slow services (>2000ms)
      if (timing.duration > 2000) {
        console.warn(`🐌 [SERVICE MONITOR] SLOW SERVICE DETECTED: ${serviceName} took ${durationFormatted}ms`);
        this.alertSlowService(serviceName, timing.duration);
      }
      
      // Alert on service timeout (>10000ms as per ServiceRegistry)
      if (timing.duration > 10000) {
        console.error(`⏰ [SERVICE MONITOR] SERVICE TIMEOUT: ${serviceName} exceeded 10 second timeout`);
        this.alertServiceTimeout(serviceName, timing.duration);
      }
    }
  }

  private setupTimeoutDetection() {
    // Monitor for services that never complete
    setTimeout(() => {
      this.checkForTimeouts();
    }, 15000); // Check after 15 seconds (5 seconds after expected timeout)
  }

  private checkForTimeouts() {
    const timeoutServices = Array.from(this.serviceTimings.entries())
      .filter(([_, timing]) => timing.status === 'pending')
      .map(([serviceName, timing]) => ({
        name: serviceName,
        duration: performance.now() - timing.start
      }));

    if (timeoutServices.length > 0) {
      console.error(`🚨 [SERVICE MONITOR] TIMEOUT DETECTION - Services still pending after 15s:
        ${timeoutServices.map(s => `${s.name}: ${s.duration.toFixed(2)}ms`).join('\n        ')}
      `);
      
      timeoutServices.forEach(service => {
        this.alertServiceTimeout(service.name, service.duration);
      });
    }
  }

  private trackInitCompletion() {
    // Use MutationObserver to detect when the app renders successfully
    if (typeof document !== 'undefined') {
      const observer = new MutationObserver(() => {
        // Check if the main app component has rendered
        if (document.querySelector('[data-testid="app-navigator"]') || 
            document.querySelector('[class*="navigation"]')) {
          const totalDuration = performance.now() - this.totalInitStart;
          console.log(`🎉 [SERVICE MONITOR] App initialization completed in ${totalDuration.toFixed(2)}ms`);
          this.generateInitReport();
          observer.disconnect();
        }
      });
      
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
    
    // Fallback timeout-based completion detection
    setTimeout(() => {
      if (this.hasAllServicesCompleted()) {
        const totalDuration = performance.now() - this.totalInitStart;
        console.log(`✅ [SERVICE MONITOR] Service initialization phase completed in ${totalDuration.toFixed(2)}ms`);
        this.generateInitReport();
      }
    }, 20000);
  }

  private hasAllServicesCompleted(): boolean {
    return Array.from(this.serviceTimings.values())
      .every(timing => timing.status !== 'pending');
  }

  private alertSlowService(serviceName: string, duration: number) {
    console.warn(`🐌 [SERVICE MONITOR] SLOW SERVICE ALERT:
      Service: ${serviceName}
      Duration: ${duration.toFixed(2)}ms
      Expected: <2000ms
      
      TROUBLESHOOTING:
      - Check network connectivity for external dependencies
      - Verify service configuration
      - Look for blocking operations in service initialization
      - Check for dependency conflicts
    `);
  }

  private alertServiceTimeout(serviceName: string, duration: number) {
    console.error(`⏰ [SERVICE MONITOR] TIMEOUT ALERT:
      Service: ${serviceName}
      Duration: ${duration.toFixed(2)}ms
      Timeout Threshold: 10000ms
      
      IMMEDIATE ACTIONS:
      1. Check service logs for errors
      2. Verify network connectivity 
      3. Check for infinite loops or deadlocks
      4. Consider increasing timeout or making service non-blocking
      
      COMMON CAUSES:
      - Network connectivity issues
      - External service unavailability  
      - Configuration errors
      - Resource exhaustion
    `);
  }

  private generateInitReport() {
    const completedServices = Array.from(this.serviceTimings.entries())
      .filter(([_, timing]) => timing.end !== undefined)
      .map(([name, timing]) => ({ name, duration: timing.duration!, status: timing.status }))
      .sort((a, b) => b.duration - a.duration);

    const failedServices = completedServices.filter(s => s.status === 'error');
    const slowServices = completedServices.filter(s => s.duration > 2000);
    const totalDuration = performance.now() - this.totalInitStart;

    console.log(`📊 [SERVICE MONITOR] INITIALIZATION REPORT:
      Total Initialization Time: ${totalDuration.toFixed(2)}ms
      Services Completed: ${completedServices.length}
      Failed Services: ${failedServices.length}
      Slow Services (>2s): ${slowServices.length}
      
      SERVICE TIMING BREAKDOWN:
      ${completedServices.map(s => `  ${s.name}: ${s.duration.toFixed(2)}ms (${s.status})`).join('\n      ')}
      
      ${failedServices.length > 0 ? `FAILED SERVICES:
      ${failedServices.map(s => `  ❌ ${s.name}: ${s.duration.toFixed(2)}ms`).join('\n      ')}
      ` : ''}
      
      ${slowServices.length > 0 ? `SLOW SERVICES:
      ${slowServices.map(s => `  🐌 ${s.name}: ${s.duration.toFixed(2)}ms`).join('\n      ')}
      ` : ''}
      
      RECOMMENDATIONS:
      ${this.generateRecommendations()}
    `);
  }

  private generateRecommendations(): string {
    const recommendations = [];
    const slowServices = Array.from(this.serviceTimings.values()).filter(t => t.duration && t.duration > 2000);
    const failedServices = Array.from(this.serviceTimings.values()).filter(t => t.status === 'error');
    
    if (slowServices.length > 0) {
      recommendations.push('- Consider parallelizing slow service initialization');
      recommendations.push('- Review network dependencies and add timeouts');
    }
    
    if (failedServices.length > 0) {
      recommendations.push('- Implement graceful fallbacks for failed services');
      recommendations.push('- Add retry mechanisms with exponential backoff');
    }
    
    if (this.serviceTimings.size > 7) {
      recommendations.push('- Consider lazy loading non-critical services');
    }
    
    return recommendations.length > 0 ? recommendations.join('\n      ') : '- All services performing within acceptable limits';
  }

  /**
   * Get real-time service initialization metrics
   */
  getMetrics() {
    const services = Array.from(this.serviceTimings.entries()).map(([name, timing]) => ({
      name,
      status: timing.status,
      duration: timing.duration,
      isTimeout: timing.duration ? timing.duration > 10000 : false,
      isSlow: timing.duration ? timing.duration > 2000 : false
    }));

    return {
      totalInitTime: performance.now() - this.totalInitStart,
      services,
      completedServices: services.filter(s => s.status !== 'pending').length,
      failedServices: services.filter(s => s.status === 'error').length,
      slowServices: services.filter(s => s.isSlow).length,
      timeoutServices: services.filter(s => s.isTimeout).length,
      isComplete: this.hasAllServicesCompleted()
    };
  }

  /**
   * Manual service tracking (call this from ServiceRegistry)
   */
  trackService(serviceName: string, startTime: number, endTime?: number, error?: any) {
    if (endTime) {
      this.serviceTimings.set(serviceName, {
        start: startTime,
        end: endTime,
        duration: endTime - startTime,
        status: error ? 'error' : 'success',
        error
      });
      this.trackServiceComplete(serviceName, !error, error);
    } else {
      this.serviceTimings.set(serviceName, {
        start: startTime,
        status: 'pending'
      });
    }
  }
}

// Auto-initialize when module loads
const serviceInitMonitor = ServiceInitMonitor.getInstance();
export default serviceInitMonitor;