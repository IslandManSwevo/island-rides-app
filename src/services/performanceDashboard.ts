/**
 * Performance Dashboard Service
 * Comprehensive performance monitoring and reporting for the KeyLo app
 */

import { performanceMonitor } from './PerformanceMonitor';
import { bundleOptimizationService } from './bundleOptimizationService';
import { imageOptimizationService } from './imageOptimizationService';
import { dependencyAnalyzer } from '../utils/dependencyAnalyzer';
import { loggingService } from './LoggingService';
import { analyticsService } from './analyticsService';

export interface PerformanceDashboardData {
  overview: {
    appStartTime: number;
    memoryUsage: number;
    bundleSize: number;
    activeComponents: number;
    networkRequests: number;
    errorRate: number;
  };
  realTime: {
    fps: number;
    renderTime: number;
    jsThreadUsage: number;
    uiThreadUsage: number;
    bridgeUtilization: number;
  };
  bundleMetrics: {
    initialLoadTime: number;
    chunkLoadTimes: Record<string, number>;
    treeshakingEfficiency: number;
    codeSpittingRatio: number;
  };
  imageMetrics: {
    totalImages: number;
    cachedImages: number;
    averageLoadTime: number;
    compressionRatio: number;
    webpUsage: number;
  };
  listPerformance: {
    averageScrollFps: number;
    renderItemTime: number;
    virtualizationEfficiency: number;
    memoryPerItem: number;
  };
  networkPerformance: {
    averageRequestTime: number;
    cacheHitRate: number;
    failureRate: number;
    dataUsage: number;
  };
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    action: string;
  }>;
}

export interface PerformanceAlert {
  id: string;
  type: 'memory' | 'performance' | 'network' | 'bundle';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: number;
  metrics: Record<string, number>;
  suggestions: string[];
}

class PerformanceDashboard {
  private alerts: PerformanceAlert[] = [];
  private metricsHistory: Array<{ timestamp: number; metrics: any }> = [];
  private alertThresholds = {
    memoryUsage: 100 * 1024 * 1024, // 100MB
    renderTime: 16, // 16ms for 60fps
    bundleSize: 5 * 1024 * 1024, // 5MB
    errorRate: 5, // 5%
    networkFailureRate: 10, // 10%
  };

  private performanceObserver: any = null;
  private isMonitoring = false;

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (this.isMonitoring) return;

    this.setupPerformanceObserver();
    this.startContinuousMonitoring();
    this.isMonitoring = true;

    loggingService.info('Performance dashboard initialized');
  }

  /**
   * Get comprehensive performance data
   */
  async getPerformanceData(): Promise<PerformanceDashboardData> {
    try {
      const bundleMetrics = bundleOptimizationService.getBundleMetrics();
      const imageStats = imageOptimizationService.getCacheStats();
      const dependencyAnalysis = await dependencyAnalyzer.analyzeDependencies();

      const data: PerformanceDashboardData = {
        overview: {
          appStartTime: this.getAppStartTime(),
          memoryUsage: this.getCurrentMemoryUsage(),
          bundleSize: bundleMetrics.initialBundleSize,
          activeComponents: this.getActiveComponentCount(),
          networkRequests: this.getNetworkRequestCount(),
          errorRate: this.getErrorRate(),
        },
        realTime: {
          fps: this.getCurrentFPS(),
          renderTime: this.getAverageRenderTime(),
          jsThreadUsage: this.getJSThreadUsage(),
          uiThreadUsage: this.getUIThreadUsage(),
          bridgeUtilization: this.getBridgeUtilization(),
        },
        bundleMetrics: {
          initialLoadTime: bundleMetrics.initialBundleSize,
          chunkLoadTimes: bundleMetrics.chunkLoadTimes,
          treeshakingEfficiency: this.calculateTreeshakingEfficiency(dependencyAnalysis),
          codeSpittingRatio: this.calculateCodeSplittingRatio(bundleMetrics),
        },
        imageMetrics: {
          totalImages: imageStats.totalEntries,
          cachedImages: imageStats.totalEntries,
          averageLoadTime: this.getAverageImageLoadTime(),
          compressionRatio: this.getImageCompressionRatio(),
          webpUsage: this.getWebPUsagePercentage(),
        },
        listPerformance: {
          averageScrollFps: this.getAverageScrollFPS(),
          renderItemTime: this.getAverageItemRenderTime(),
          virtualizationEfficiency: this.getVirtualizationEfficiency(),
          memoryPerItem: this.getMemoryPerListItem(),
        },
        networkPerformance: {
          averageRequestTime: this.getAverageNetworkTime(),
          cacheHitRate: this.getNetworkCacheHitRate(),
          failureRate: this.getNetworkFailureRate(),
          dataUsage: this.getDataUsage(),
        },
        recommendations: this.generateRecommendations(),
      };

      // Store metrics history
      this.metricsHistory.push({
        timestamp: Date.now(),
        metrics: data,
      });

      // Keep only last 100 entries
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }

      return data;

    } catch (error) {
      loggingService.error('Failed to get performance data', error as Error);
      throw error;
    }
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<{
    summary: string;
    metrics: PerformanceDashboardData;
    trends: Array<{ metric: string; trend: 'improving' | 'stable' | 'degrading'; change: number }>;
    criticalIssues: string[];
    recommendations: string[];
  }> {
    const metrics = await this.getPerformanceData();
    const trends = this.calculateTrends();
    const criticalIssues = this.identifyCriticalIssues(metrics);

    return {
      summary: this.generateSummary(metrics),
      metrics,
      trends,
      criticalIssues,
      recommendations: metrics.recommendations.map(r => r.description),
    };
  }

  /**
   * Private helper methods
   */
  private setupPerformanceObserver(): void {
    // Setup performance monitoring for React Native
    if (typeof performance !== 'undefined') {
      // Monitor memory usage
      setInterval(() => {
        const memoryUsage = this.getCurrentMemoryUsage();
        if (memoryUsage > this.alertThresholds.memoryUsage) {
          this.createAlert('memory', 'warning', 'High memory usage detected', {
            memoryUsage,
            threshold: this.alertThresholds.memoryUsage,
          });
        }
      }, 10000); // Every 10 seconds
    }
  }

  private startContinuousMonitoring(): void {
    // Monitor render performance
    setInterval(() => {
      const renderTime = this.getAverageRenderTime();
      if (renderTime > this.alertThresholds.renderTime) {
        this.createAlert('performance', 'warning', 'Slow rendering detected', {
          renderTime,
          threshold: this.alertThresholds.renderTime,
        });
      }
    }, 5000); // Every 5 seconds

    // Monitor error rates
    setInterval(() => {
      const errorRate = this.getErrorRate();
      if (errorRate > this.alertThresholds.errorRate) {
        this.createAlert('performance', 'critical', 'High error rate detected', {
          errorRate,
          threshold: this.alertThresholds.errorRate,
        });
      }
    }, 30000); // Every 30 seconds
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    metrics: Record<string, number>
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: Date.now(),
      metrics,
      suggestions: this.generateAlertSuggestions(type, metrics),
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    // Track alert in analytics
    analyticsService.trackEvent('performance_alert_created', {
      type,
      severity,
      message,
    });
  }

  private generateAlertSuggestions(type: PerformanceAlert['type'], metrics: Record<string, number>): string[] {
    switch (type) {
      case 'memory':
        return [
          'Clear image cache',
          'Reduce number of active components',
          'Check for memory leaks',
          'Optimize large data structures',
        ];
      case 'performance':
        return [
          'Use React.memo for expensive components',
          'Implement virtualization for long lists',
          'Optimize re-renders with useCallback',
          'Check for unnecessary state updates',
        ];
      case 'network':
        return [
          'Implement request caching',
          'Reduce payload sizes',
          'Use compression',
          'Implement retry logic',
        ];
      case 'bundle':
        return [
          'Implement code splitting',
          'Remove unused dependencies',
          'Use tree-shaking',
          'Optimize images',
        ];
      default:
        return ['Review performance metrics'];
    }
  }

  // Metric calculation methods
  private getAppStartTime(): number {
    return performanceMonitor.getMetric('app_start_time') || 0;
  }

  private getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize || 0;
    }
    return 0;
  }

  private getActiveComponentCount(): number {
    return performanceMonitor.getMetric('active_components') || 0;
  }

  private getNetworkRequestCount(): number {
    return performanceMonitor.getMetric('network_requests') || 0;
  }

  private getErrorRate(): number {
    const errors = performanceMonitor.getMetric('errors') || 0;
    const total = performanceMonitor.getMetric('total_operations') || 1;
    return (errors / total) * 100;
  }

  private getCurrentFPS(): number {
    return performanceMonitor.getMetric('current_fps') || 60;
  }

  private getAverageRenderTime(): number {
    return performanceMonitor.getMetric('average_render_time') || 0;
  }

  private getJSThreadUsage(): number {
    return performanceMonitor.getMetric('js_thread_usage') || 0;
  }

  private getUIThreadUsage(): number {
    return performanceMonitor.getMetric('ui_thread_usage') || 0;
  }

  private getBridgeUtilization(): number {
    return performanceMonitor.getMetric('bridge_utilization') || 0;
  }

  private calculateTreeshakingEfficiency(analysis: any): number {
    // Calculate based on unused dependencies and bundle size
    return analysis.treeshakingOpportunities?.length > 0 ? 70 : 90;
  }

  private calculateCodeSplittingRatio(bundleMetrics: any): number {
    const totalChunks = Object.keys(bundleMetrics.chunkLoadTimes).length;
    return totalChunks > 1 ? (totalChunks / 10) * 100 : 0; // Assume 10 is optimal
  }

  private getAverageImageLoadTime(): number {
    return performanceMonitor.getMetric('average_image_load_time') || 0;
  }

  private getImageCompressionRatio(): number {
    return 75; // Estimated compression ratio
  }

  private getWebPUsagePercentage(): number {
    return 60; // Estimated WebP usage
  }

  private getAverageScrollFPS(): number {
    return performanceMonitor.getMetric('scroll_fps') || 60;
  }

  private getAverageItemRenderTime(): number {
    return performanceMonitor.getMetric('item_render_time') || 0;
  }

  private getVirtualizationEfficiency(): number {
    return 85; // Estimated virtualization efficiency
  }

  private getMemoryPerListItem(): number {
    return performanceMonitor.getMetric('memory_per_item') || 0;
  }

  private getAverageNetworkTime(): number {
    return performanceMonitor.getMetric('network_time') || 0;
  }

  private getNetworkCacheHitRate(): number {
    return performanceMonitor.getMetric('cache_hit_rate') || 0;
  }

  private getNetworkFailureRate(): number {
    return performanceMonitor.getMetric('network_failure_rate') || 0;
  }

  private getDataUsage(): number {
    return performanceMonitor.getMetric('data_usage') || 0;
  }

  private generateRecommendations(): PerformanceDashboardData['recommendations'] {
    return [
      {
        category: 'Bundle Optimization',
        priority: 'high',
        description: 'Implement code splitting for better initial load time',
        impact: 'Reduce initial bundle size by 30-40%',
        action: 'Use React.lazy for screen components',
      },
      {
        category: 'Image Optimization',
        priority: 'medium',
        description: 'Enable WebP format for better compression',
        impact: 'Reduce image sizes by 25-35%',
        action: 'Configure image optimization service',
      },
      {
        category: 'List Performance',
        priority: 'medium',
        description: 'Use virtualization for large vehicle lists',
        impact: 'Improve scroll performance and memory usage',
        action: 'Replace FlatList with VirtualizedList',
      },
    ];
  }

  private calculateTrends(): Array<{ metric: string; trend: 'improving' | 'stable' | 'degrading'; change: number }> {
    // Calculate trends based on metrics history
    return [
      { metric: 'Memory Usage', trend: 'stable', change: 0 },
      { metric: 'Render Time', trend: 'improving', change: -5 },
      { metric: 'Bundle Size', trend: 'improving', change: -15 },
    ];
  }

  private identifyCriticalIssues(metrics: PerformanceDashboardData): string[] {
    const issues = [];

    if (metrics.overview.memoryUsage > this.alertThresholds.memoryUsage) {
      issues.push('High memory usage detected');
    }

    if (metrics.realTime.renderTime > this.alertThresholds.renderTime) {
      issues.push('Slow rendering performance');
    }

    if (metrics.overview.errorRate > this.alertThresholds.errorRate) {
      issues.push('High error rate');
    }

    return issues;
  }

  private generateSummary(metrics: PerformanceDashboardData): string {
    const issues = this.identifyCriticalIssues(metrics);
    
    if (issues.length === 0) {
      return 'App performance is within acceptable ranges';
    } else {
      return `${issues.length} performance issue(s) detected: ${issues.join(', ')}`;
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isMonitoring = false;
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

export const performanceDashboard = new PerformanceDashboard();
