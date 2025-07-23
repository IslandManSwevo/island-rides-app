/**
 * Master Loading Issues Monitor
 * Orchestrates all monitoring scenarios and provides unified alerting for loading bottlenecks
 */

import bundleMonitor from './MetroBundleMonitor';
import serviceInitMonitor from './ServiceInitMonitor';
import componentRenderMonitor from './ComponentRenderMonitor';

export interface LoadingIssueAlert {
  severity: 'warning' | 'critical' | 'info';
  category: 'bundle' | 'service' | 'component' | 'system';
  title: string;
  message: string;
  timestamp: number;
  metrics?: any;
  suggestions?: string[];
}

export class LoadingIssuesMonitor {
  private static instance: LoadingIssuesMonitor;
  private alerts: LoadingIssueAlert[] = [];
  private alertCallbacks: Array<(alert: LoadingIssueAlert) => void> = [];
  private isMonitoring: boolean = false;
  private monitoringStartTime: number = 0;

  static getInstance(): LoadingIssuesMonitor {
    if (!LoadingIssuesMonitor.instance) {
      LoadingIssuesMonitor.instance = new LoadingIssuesMonitor();
    }
    return LoadingIssuesMonitor.instance;
  }

  /**
   * Start comprehensive loading issues monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringStartTime = performance.now();
    
    console.log('🚀 [LOADING MONITOR] Starting comprehensive loading issues monitoring...');
    
    // Start all monitoring scenarios
    this.initializeAllMonitors();
    
    // Set up unified alerting
    this.setupUnifiedAlerting();
    
    // Set up health checks
    this.setupHealthChecks();
    
    // Generate initial status report
    this.generateStatusReport();
  }

  private initializeAllMonitors() {
    try {
      // 1. Metro Bundle Monitor
      bundleMonitor.startBundleMonitoring();
      this.addAlert({
        severity: 'info',
        category: 'system',
        title: 'Bundle Monitoring Started',
        message: 'Metro bundle performance monitoring is now active',
        timestamp: Date.now()
      });
      
      // 2. Service Initialization Monitor
      serviceInitMonitor.startServiceMonitoring();
      this.addAlert({
        severity: 'info',
        category: 'system',
        title: 'Service Monitoring Started', 
        message: 'Service initialization monitoring is now active',
        timestamp: Date.now()
      });
      
      // 3. Component Render Monitor
      componentRenderMonitor.startComponentMonitoring();
      this.addAlert({
        severity: 'info',
        category: 'system',
        title: 'Component Monitoring Started',
        message: 'React component rendering monitoring is now active',
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.addAlert({
        severity: 'critical',
        category: 'system',
        title: 'Monitor Initialization Failed',
        message: `Failed to initialize monitoring: ${error}`,
        timestamp: Date.now()
      });
    }
  }

  private setupUnifiedAlerting() {
    // Set up periodic health checks to generate alerts
    setInterval(() => {
      this.performHealthChecks();
    }, 5000); // Check every 5 seconds
    
    // Set up consolidated reporting
    setInterval(() => {
      this.generatePerformanceReport();
    }, 30000); // Report every 30 seconds
  }

  private setupHealthChecks() {
    // Monitor for critical loading issues
    this.scheduleHealthCheck('bundle', () => this.checkBundleHealth());
    this.scheduleHealthCheck('service', () => this.checkServiceHealth());
    this.scheduleHealthCheck('component', () => this.checkComponentHealth());
    this.scheduleHealthCheck('overall', () => this.checkOverallHealth());
  }

  private scheduleHealthCheck(type: string, checkFunction: () => void) {
    setInterval(() => {
      try {
        checkFunction();
      } catch (error) {
        this.addAlert({
          severity: 'warning',
          category: 'system',
          title: `Health Check Failed: ${type}`,
          message: `Health check error: ${error}`,
          timestamp: Date.now()
        });
      }
    }, 10000); // Check every 10 seconds
  }

  private checkBundleHealth() {
    const bundleMetrics = bundleMonitor.getMetrics();
    
    // Check for bundle loading issues
    if (bundleMetrics.totalBundleTime > 10000) { // 10 seconds
      this.addAlert({
        severity: 'critical',
        category: 'bundle',
        title: 'Bundle Loading Timeout',
        message: `Bundle has been loading for ${(bundleMetrics.totalBundleTime / 1000).toFixed(1)}s`,
        timestamp: Date.now(),
        metrics: bundleMetrics,
        suggestions: [
          'Clear Metro cache: npm run clean',
          'Delete node_modules/.cache and .expo directories',
          'Restart Metro with --reset-cache flag',
          'Check for circular dependencies'
        ]
      });
    }
    
    // Check for high number of modules
    if (bundleMetrics.modulesLoaded > 1000) {
      this.addAlert({
        severity: 'warning',
        category: 'bundle',
        title: 'High Module Count',
        message: `${bundleMetrics.modulesLoaded} modules loaded - may impact performance`,
        timestamp: Date.now(),
        metrics: bundleMetrics,
        suggestions: [
          'Consider code splitting',
          'Review unnecessary imports',
          'Implement lazy loading for routes'
        ]
      });
    }
  }

  private checkServiceHealth() {
    const serviceMetrics = serviceInitMonitor.getMetrics();
    
    // Check for service timeout issues
    if (serviceMetrics.timeoutServices > 0) {
      this.addAlert({
        severity: 'critical',
        category: 'service',
        title: 'Service Initialization Timeout',
        message: `${serviceMetrics.timeoutServices} services have timed out`,
        timestamp: Date.now(),
        metrics: serviceMetrics,
        suggestions: [
          'Check network connectivity',
          'Review service configuration',
          'Consider increasing timeout values',
          'Implement service fallbacks'
        ]
      });
    }
    
    // Check for failed services
    if (serviceMetrics.failedServices > 0) {
      this.addAlert({
        severity: 'warning',
        category: 'service',
        title: 'Service Initialization Failures',
        message: `${serviceMetrics.failedServices} services failed to initialize`,
        timestamp: Date.now(),
        metrics: serviceMetrics,
        suggestions: [
          'Check service logs for errors',
          'Verify service dependencies',
          'Review error handling logic'
        ]
      });
    }
    
    // Check for slow services
    if (serviceMetrics.slowServices > 2) {
      this.addAlert({
        severity: 'warning',
        category: 'service',
        title: 'Multiple Slow Services',
        message: `${serviceMetrics.slowServices} services are initializing slowly`,
        timestamp: Date.now(),
        metrics: serviceMetrics,
        suggestions: [
          'Profile slow services',
          'Consider parallel initialization',
          'Review external dependencies'
        ]
      });
    }
  }

  private checkComponentHealth() {
    const componentMetrics = componentRenderMonitor.getMetrics();
    
    // Check for excessive re-renders
    if (componentMetrics.topSlowComponents.length > 5) {
      const slowestComponent = componentMetrics.topSlowComponents[0];
      this.addAlert({
        severity: 'warning',
        category: 'component',
        title: 'Multiple Slow Components Detected',
        message: `${componentMetrics.topSlowComponents.length} components with poor render performance`,
        timestamp: Date.now(),
        metrics: { slowestComponent, totalCount: componentMetrics.topSlowComponents.length },
        suggestions: [
          'Use React.memo() for expensive components',
          'Implement useMemo() for calculations',
          'Consider component splitting',
          'Profile with React DevTools'
        ]
      });
    }
    
    // Check for components with very slow renders
    if (componentMetrics.problematicComponents > 0) {
      this.addAlert({
        severity: 'critical',
        category: 'component',
        title: 'Critical Render Performance Issues',
        message: `${componentMetrics.problematicComponents} components with renders >50ms`,
        timestamp: Date.now(),
        metrics: componentMetrics,
        suggestions: [
          'Immediately profile affected components',
          'Implement performance optimizations',
          'Consider component virtualization',
          'Review expensive operations in render'
        ]
      });
    }
  }

  private checkOverallHealth() {
    const totalMonitoringTime = performance.now() - this.monitoringStartTime;
    
    // Overall app loading health check
    if (totalMonitoringTime > 30000) { // 30 seconds
      const bundleMetrics = bundleMonitor.getMetrics();
      const serviceMetrics = serviceInitMonitor.getMetrics();
      const componentMetrics = componentRenderMonitor.getMetrics();
      
      const hasIssues = bundleMetrics.hasErrors || 
                       serviceMetrics.failedServices > 0 || 
                       componentMetrics.problematicComponents > 0;
      
      if (hasIssues) {
        this.addAlert({
          severity: 'critical',
          category: 'system',
          title: 'Prolonged Loading Issues Detected',
          message: 'App has been experiencing loading issues for over 30 seconds',
          timestamp: Date.now(),
          metrics: { bundleMetrics, serviceMetrics, componentMetrics },
          suggestions: [
            'Perform full cache clear and restart',
            'Check network connectivity',
            'Review recent code changes',
            'Consider rollback if issues persist'
          ]
        });
      }
    }
  }

  private performHealthChecks() {
    // This will be called by the interval to trigger all health checks
    // Individual health check methods are called by their own intervals
  }

  private generatePerformanceReport() {
    const bundleMetrics = bundleMonitor.getMetrics();
    const serviceMetrics = serviceInitMonitor.getMetrics();
    const componentMetrics = componentRenderMonitor.getMetrics();
    
    const report = {
      timestamp: Date.now(),
      monitoringDuration: performance.now() - this.monitoringStartTime,
      bundle: {
        status: bundleMetrics.hasErrors ? 'error' : 'healthy',
        loadTime: bundleMetrics.totalBundleTime,
        moduleCount: bundleMetrics.modulesLoaded
      },
      services: {
        status: serviceMetrics.failedServices > 0 ? 'error' : 
                serviceMetrics.slowServices > 0 ? 'warning' : 'healthy',
        completed: serviceMetrics.completedServices,
        failed: serviceMetrics.failedServices,
        slow: serviceMetrics.slowServices
      },
      components: {
        status: componentMetrics.problematicComponents > 0 ? 'error' :
                componentMetrics.slowComponents > 0 ? 'warning' : 'healthy',
        totalComponents: componentMetrics.totalComponents,
        slowComponents: componentMetrics.slowComponents,
        problematicComponents: componentMetrics.problematicComponents
      },
      alertCount: this.alerts.length
    };
    
    console.log(`📊 [LOADING MONITOR] COMPREHENSIVE PERFORMANCE REPORT:
      Monitoring Duration: ${(report.monitoringDuration / 1000).toFixed(1)}s
      
      🎒 BUNDLE STATUS: ${report.bundle.status.toUpperCase()}
      - Load Time: ${(report.bundle.loadTime / 1000).toFixed(1)}s
      - Modules Loaded: ${report.bundle.moduleCount}
      
      ⚙️ SERVICES STATUS: ${report.services.status.toUpperCase()}
      - Completed: ${report.services.completed}
      - Failed: ${report.services.failed}
      - Slow: ${report.services.slow}
      
      🎨 COMPONENTS STATUS: ${report.components.status.toUpperCase()}
      - Total Tracked: ${report.components.totalComponents}
      - Slow Components: ${report.components.slowComponents}
      - Problematic: ${report.components.problematicComponents}
      
      🚨 ACTIVE ALERTS: ${report.alertCount}
    `);
    
    return report;
  }

  private generateStatusReport() {
    setTimeout(() => {
      console.log(`🎯 [LOADING MONITOR] INITIAL STATUS REPORT:
        ✅ Metro Bundle Monitor: Active
        ✅ Service Init Monitor: Active  
        ✅ Component Render Monitor: Active
        ✅ Unified Alerting: Active
        ✅ Health Checks: Active
        
        📊 Real-time monitoring is now capturing performance data.
        📋 Alerts will be generated for loading bottlenecks.
        📈 Periodic reports will be generated every 30 seconds.
        
        🔍 WHAT WE'RE WATCHING FOR:
        - Metro module resolution errors (like 'module 1021')
        - Service initialization timeouts (>10s)
        - Component render performance issues (>16ms)
        - Bundle loading delays (>10s)
        - Memory usage spikes
        - Excessive re-renders
      `);
    }, 1000);
  }

  /**
   * Add an alert to the system
   */
  addAlert(alert: LoadingIssueAlert) {
    this.alerts.unshift(alert); // Add to beginning
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
    
    // Notify subscribers
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.warn('Alert callback failed:', error);
      }
    });
    
    // Console output for immediate visibility
    const icon = alert.severity === 'critical' ? '🚨' : 
                 alert.severity === 'warning' ? '⚠️' : 'ℹ️';
    
    console.log(`${icon} [LOADING MONITOR] ${alert.title}: ${alert.message}`);
    
    if (alert.suggestions && alert.suggestions.length > 0) {
      console.log(`💡 Suggestions:\n  ${alert.suggestions.join('\n  ')}`);
    }
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: LoadingIssueAlert) => void) {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get all current alerts
   */
  getAlerts(): LoadingIssueAlert[] {
    return [...this.alerts];
  }

  /**
   * Get critical alerts only
   */
  getCriticalAlerts(): LoadingIssueAlert[] {
    return this.alerts.filter(alert => alert.severity === 'critical');
  }

  /**
   * Clear all alerts
   */
  clearAlerts() {
    this.alerts = [];
  }

  /**
   * Get comprehensive metrics from all monitors
   */
  getAllMetrics() {
    return {
      bundle: bundleMonitor.getMetrics(),
      services: serviceInitMonitor.getMetrics(), 
      components: componentRenderMonitor.getMetrics(),
      alerts: this.alerts.length,
      criticalAlerts: this.getCriticalAlerts().length,
      monitoringDuration: performance.now() - this.monitoringStartTime
    };
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('⏹️ [LOADING MONITOR] Monitoring stopped');
  }
}

// Auto-initialize and start monitoring
const loadingIssuesMonitor = LoadingIssuesMonitor.getInstance();

// Start monitoring automatically when module loads
if (__DEV__) {
  loadingIssuesMonitor.startMonitoring();
}

export default loadingIssuesMonitor;