import { loggingService } from './LoggingService';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: number;
  type: 'render' | 'api' | 'navigation' | 'memory' | 'bundle' | 'custom';
  metadata?: Record<string, unknown>;
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '==' | '>=' | '<=';
  cooldown?: number; // ms between alerts
}

interface PerformanceReport {
  summary: {
    totalMetrics: number;
    timeRange: { start: number; end: number };
    criticalIssues: number;
    warnings: number;
  };
  metrics: {
    render: PerformanceMetric[];
    api: PerformanceMetric[];
    navigation: PerformanceMetric[];
    memory: PerformanceMetric[];
    custom: PerformanceMetric[];
  };
  alerts: Array<{
    metric: PerformanceMetric;
    threshold: AlertThreshold;
    severity: 'critical' | 'warning' | 'info';
  }>;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alertThresholds: AlertThreshold[] = [];
  private alertCooldowns: Map<string, number> = new Map();
  private isEnabled: boolean = true;
  private maxMetricsPerType: number = 1000;
  private logger: typeof loggingService;

  private constructor() {
    this.logger = loggingService;
    this.initializeDefaultThresholds();
    this.startPeriodicReporting();
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  private initializeDefaultThresholds(): void {
    this.alertThresholds = [
      // Render performance
      { metric: 'render_time', threshold: 16, operator: '>', cooldown: 5000 },
      { metric: 'fps', threshold: 55, operator: '<', cooldown: 10000 },
      
      // API performance
      { metric: 'api_response_time', threshold: 2000, operator: '>', cooldown: 30000 },
      { metric: 'api_error_rate', threshold: 5, operator: '>', cooldown: 60000 },
      
      // Memory usage
      { metric: 'memory_usage_mb', threshold: 150, operator: '>', cooldown: 30000 },
      { metric: 'memory_leak_rate', threshold: 1, operator: '>', cooldown: 60000 },
      
      // Navigation performance
      { metric: 'navigation_time', threshold: 1000, operator: '>', cooldown: 15000 },
      
      // Bundle size
      { metric: 'bundle_load_time', threshold: 3000, operator: '>', cooldown: 300000 }
    ];
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.logger.debug(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  addAlertThreshold(threshold: AlertThreshold): void {
    this.alertThresholds.push(threshold);
  }

  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    if (!this.isEnabled) return;

    const fullMetric: PerformanceMetric = {
      ...metric,
      id: this.generateMetricId(),
      timestamp: Date.now()
    };

    // Store metric
    const typeMetrics = this.metrics.get(metric.type) || [];
    typeMetrics.push(fullMetric);

    // Limit metrics per type to prevent memory issues
    if (typeMetrics.length > this.maxMetricsPerType) {
      typeMetrics.shift();
    }

    this.metrics.set(metric.type, typeMetrics);

    // Check for alerts
    this.checkAlerts(fullMetric);

    // Log significant metrics
    if (this.isSignificantMetric(fullMetric)) {
      this.logger.info('Performance metric recorded', {
        name: metric.name,
        value: metric.value,
        type: metric.type,
        metadata: metric.metadata
      });
    }
  }

  // Render Performance Tracking
  recordRenderMetric(componentName: string, renderTime: number, metadata?: Record<string, unknown>): void {
    this.recordMetric({
      name: `${componentName}_render_time`,
      value: renderTime,
      type: 'render',
      metadata: { componentName, ...metadata }
    });
  }

  recordFrameRate(fps: number): void {
    this.recordMetric({
      name: 'fps',
      value: fps,
      type: 'render'
    });
  }

  // API Performance Tracking
  recordApiCall(endpoint: string, responseTime: number, statusCode: number, metadata?: Record<string, unknown>): void {
    this.recordMetric({
      name: 'api_response_time',
      value: responseTime,
      type: 'api',
      metadata: { endpoint, statusCode, ...metadata }
    });

    // Record error rates
    if (statusCode >= 400) {
      this.recordMetric({
        name: 'api_error',
        value: 1,
        type: 'api',
        metadata: { endpoint, statusCode, error: true, ...metadata }
      });
    }
  }

  // Navigation Performance Tracking
  recordNavigation(fromScreen: string, toScreen: string, navigationTime: number): void {
    this.recordMetric({
      name: 'navigation_time',
      value: navigationTime,
      type: 'navigation',
      metadata: { fromScreen, toScreen }
    });
  }

  // Memory Performance Tracking
  recordMemoryUsage(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

      this.recordMetric({
        name: 'memory_usage_mb',
        value: usedMB,
        type: 'memory',
        metadata: { total: totalMB, limit: limitMB }
      });
    }
  }

  // Bundle Performance Tracking
  recordBundleLoadTime(bundleName: string, loadTime: number): void {
    this.recordMetric({
      name: 'bundle_load_time',
      value: loadTime,
      type: 'bundle',
      metadata: { bundleName }
    });
  }

  // Custom Metrics
  recordCustomMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    this.recordMetric({
      name,
      value,
      type: 'custom',
      metadata
    });
  }

  private isSignificantMetric(metric: PerformanceMetric): boolean {
    switch (metric.type) {
      case 'render':
        return metric.value > 16; // Slow render
      case 'api':
        return metric.value > 1000; // Slow API call
      case 'navigation':
        return metric.value > 500; // Slow navigation
      case 'memory':
        return metric.value > 100; // High memory usage
      default:
        return false;
    }
  }

  private checkAlerts(metric: PerformanceMetric): void {
    this.alertThresholds.forEach(threshold => {
      if (this.shouldTriggerAlert(metric, threshold)) {
        this.triggerAlert(metric, threshold);
      }
    });
  }

  private shouldTriggerAlert(metric: PerformanceMetric, threshold: AlertThreshold): boolean {
    // Check if metric matches
    if (metric.name !== threshold.metric) return false;

    // Check cooldown
    const lastAlert = this.alertCooldowns.get(`${threshold.metric}_${threshold.threshold}`);
    if (lastAlert && Date.now() - lastAlert < (threshold.cooldown || 0)) return false;

    // Check threshold condition
    switch (threshold.operator) {
      case '>': return metric.value > threshold.threshold;
      case '<': return metric.value < threshold.threshold;
      case '>=': return metric.value >= threshold.threshold;
      case '<=': return metric.value <= threshold.threshold;
      case '==': return metric.value === threshold.threshold;
      default: return false;
    }
  }

  private triggerAlert(metric: PerformanceMetric, threshold: AlertThreshold): void {
    const severity = this.getAlertSeverity(metric, threshold);
    const alertKey = `${threshold.metric}_${threshold.threshold}`;
    
    this.alertCooldowns.set(alertKey, Date.now());

    const alertMessage = `Performance alert: ${metric.name} (${metric.value}) ${threshold.operator} ${threshold.threshold}`;
    
    switch (severity) {
      case 'critical':
        this.logger.error(alertMessage, { metric, threshold, severity });
        break;
      case 'warning':
        this.logger.warn(alertMessage, { metric, threshold, severity });
        break;
      case 'info':
        this.logger.info(alertMessage, { metric, threshold, severity });
        break;
    }

    // Trigger real-time notification (implement based on your notification system)
    this.sendRealTimeAlert(metric, threshold, severity);
  }

  private getAlertSeverity(metric: PerformanceMetric, threshold: AlertThreshold): 'critical' | 'warning' | 'info' {
    const exceedanceRatio = Math.abs(metric.value - threshold.threshold) / threshold.threshold;
    
    if (exceedanceRatio > 0.5) return 'critical';
    if (exceedanceRatio > 0.2) return 'warning';
    return 'info';
  }

  private sendRealTimeAlert(metric: PerformanceMetric, threshold: AlertThreshold, severity: 'critical' | 'warning' | 'info'): void {
    // Integration point for real-time alerting system
    if (typeof window !== 'undefined' && (window as any).performanceAlertHandler) {
      (window as any).performanceAlertHandler({ metric, threshold, severity });
    }
  }

  generateReport(timeRange?: { start: number; end: number }): PerformanceReport {
    const now = Date.now();
    const range = timeRange || { start: now - 3600000, end: now }; // Last hour by default

    const filteredMetrics = this.filterMetricsByTimeRange(range);
    const alerts = this.generateAlerts(filteredMetrics);

    return {
      summary: {
        totalMetrics: Object.values(filteredMetrics).reduce((sum, metrics) => sum + metrics.length, 0),
        timeRange: range,
        criticalIssues: alerts.filter(alert => alert.severity === 'critical').length,
        warnings: alerts.filter(alert => alert.severity === 'warning').length
      },
      metrics: filteredMetrics,
      alerts
    };
  }

  private filterMetricsByTimeRange(range: { start: number; end: number }): PerformanceReport['metrics'] {
    const result: PerformanceReport['metrics'] = {
      render: [],
      api: [],
      navigation: [],
      memory: [],
      custom: []
    };

    this.metrics.forEach((metrics, type) => {
      const filtered = metrics.filter(metric => 
        metric.timestamp >= range.start && metric.timestamp <= range.end
      );
      if (type in result) {
        (result as any)[type] = filtered;
      }
    });

    return result;
  }

  private generateAlerts(metrics: PerformanceReport['metrics']): PerformanceReport['alerts'] {
    const alerts: PerformanceReport['alerts'] = [];

    Object.values(metrics).flat().forEach(metric => {
      this.alertThresholds.forEach(threshold => {
        if (this.shouldTriggerAlert(metric, threshold)) {
          alerts.push({
            metric,
            threshold,
            severity: this.getAlertSeverity(metric, threshold)
          });
        }
      });
    });

    return alerts;
  }

  private startPeriodicReporting(): void {
    // Generate periodic memory reports
    setInterval(() => {
      this.recordMemoryUsage();
    }, 30000); // Every 30 seconds

    // Generate performance summary every 5 minutes
    setInterval(() => {
      const report = this.generateReport();
      if (report.summary.criticalIssues > 0 || report.summary.warnings > 5) {
        this.logger.warn('Performance summary', {
          criticalIssues: report.summary.criticalIssues,
          warnings: report.summary.warnings,
          totalMetrics: report.summary.totalMetrics
        });
      }
    }, 300000); // Every 5 minutes
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility methods for getting aggregated data
  getAverageMetricValue(metricName: string, timeRange?: { start: number; end: number }): number {
    const metrics = this.getMetricsByName(metricName, timeRange);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length;
  }

  getMetricsByName(metricName: string, timeRange?: { start: number; end: number }): PerformanceMetric[] {
    const now = Date.now();
    const range = timeRange || { start: now - 3600000, end: now };
    
    const allMetrics: PerformanceMetric[] = [];
    this.metrics.forEach(metrics => {
      allMetrics.push(...metrics.filter(metric => 
        metric.name === metricName &&
        metric.timestamp >= range.start &&
        metric.timestamp <= range.end
      ));
    });
    
    return allMetrics;
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.alertCooldowns.clear();
    this.logger.info('Performance metrics cleared');
  }
}

export default PerformanceMonitoringService;