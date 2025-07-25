/**
 * Bundle Optimization Service
 * Manages code splitting, lazy loading, and bundle performance monitoring
 */

import { performanceMonitor } from './PerformanceMonitor';
import { loggingService } from './LoggingService';
import { analyticsService } from './analyticsService';

export interface BundleMetrics {
  initialBundleSize: number;
  loadedChunks: string[];
  chunkLoadTimes: Record<string, number>;
  memoryUsage: number;
  componentRenderTimes: Record<string, number>;
}

export interface LazyLoadConfig {
  preloadDelay: number; // ms
  retryAttempts: number;
  fallbackComponent?: React.ComponentType;
  loadingComponent?: React.ComponentType;
}

class BundleOptimizationService {
  private bundleMetrics: BundleMetrics = {
    initialBundleSize: 0,
    loadedChunks: [],
    chunkLoadTimes: {},
    memoryUsage: 0,
    componentRenderTimes: {},
  };

  private lazyLoadConfig: LazyLoadConfig = {
    preloadDelay: 2000, // 2 seconds
    retryAttempts: 3,
  };

  private preloadQueue: Set<string> = new Set();
  private loadingChunks: Map<string, Promise<any>> = new Map();

  /**
   * Initialize bundle optimization
   */
  initialize(): void {
    this.measureInitialBundleSize();
    this.setupPerformanceObserver();
    this.startMemoryMonitoring();
    
    loggingService.info('Bundle optimization service initialized');
  }

  /**
   * Create lazy-loaded component with performance tracking
   */
  createLazyComponent<T = any>(
    importFunction: () => Promise<{ default: React.ComponentType<T> }>,
    componentName: string,
    config?: Partial<LazyLoadConfig>
  ): React.LazyExoticComponent<React.ComponentType<T>> {
    const finalConfig = { ...this.lazyLoadConfig, ...config };
    
    const wrappedImport = async () => {
      const startTime = Date.now();
      
      try {
        // Add to loading chunks
        if (!this.loadingChunks.has(componentName)) {
          this.loadingChunks.set(componentName, importFunction());
        }
        
        const module = await this.loadingChunks.get(componentName)!;
        const loadTime = Date.now() - startTime;
        
        // Record metrics
        this.bundleMetrics.chunkLoadTimes[componentName] = loadTime;
        this.bundleMetrics.loadedChunks.push(componentName);
        
        // Track analytics
        analyticsService.trackEvent('lazy_component_loaded', {
          componentName,
          loadTime,
          retryAttempts: 0,
        });
        
        performanceMonitor.recordMetric(`chunk_load_time_${componentName}`, loadTime);
        
        loggingService.info('Lazy component loaded', { componentName, loadTime });
        
        return module;
        
      } catch (error) {
        loggingService.error(`Failed to load lazy component: ${componentName}`, error as Error);
        
        // Retry logic
        for (let attempt = 1; attempt <= finalConfig.retryAttempts; attempt++) {
          try {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            const module = await importFunction();
            
            analyticsService.trackEvent('lazy_component_loaded_retry', {
              componentName,
              attempt,
              loadTime: Date.now() - startTime,
            });
            
            return module;
          } catch (retryError) {
            if (attempt === finalConfig.retryAttempts) {
              throw retryError;
            }
          }
        }
        
        throw error;
      } finally {
        this.loadingChunks.delete(componentName);
      }
    };

    return React.lazy(wrappedImport);
  }

  /**
   * Preload component for better UX
   */
  preloadComponent(
    importFunction: () => Promise<any>,
    componentName: string,
    delay: number = this.lazyLoadConfig.preloadDelay
  ): void {
    if (this.preloadQueue.has(componentName)) {
      return;
    }

    this.preloadQueue.add(componentName);

    setTimeout(async () => {
      try {
        const startTime = Date.now();
        await importFunction();
        const preloadTime = Date.now() - startTime;
        
        performanceMonitor.recordMetric(`preload_time_${componentName}`, preloadTime);
        
        analyticsService.trackEvent('component_preloaded', {
          componentName,
          preloadTime,
          delay,
        });
        
        loggingService.info('Component preloaded', { componentName, preloadTime });
        
      } catch (error) {
        loggingService.warn(`Failed to preload component: ${componentName}`, error as Error);
      } finally {
        this.preloadQueue.delete(componentName);
      }
    }, delay);
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.bundleMetrics.componentRenderTimes[componentName] = renderTime;
    performanceMonitor.recordMetric(`component_render_time_${componentName}`, renderTime);
    
    // Track slow renders
    if (renderTime > 100) { // 100ms threshold
      analyticsService.trackEvent('slow_component_render', {
        componentName,
        renderTime,
      });
    }
  }

  /**
   * Measure initial bundle size
   */
  private measureInitialBundleSize(): void {
    // In React Native, we can estimate bundle size through performance metrics
    const startTime = Date.now();
    
    // Measure time to interactive as proxy for bundle size
    setTimeout(() => {
      const timeToInteractive = Date.now() - startTime;
      this.bundleMetrics.initialBundleSize = timeToInteractive;
      
      performanceMonitor.recordMetric('initial_bundle_load_time', timeToInteractive);
      
      analyticsService.trackEvent('bundle_metrics_measured', {
        timeToInteractive,
        timestamp: new Date().toISOString(),
      });
    }, 100);
  }

  /**
   * Setup performance observer for bundle metrics
   */
  private setupPerformanceObserver(): void {
    // Monitor JavaScript heap size if available
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.bundleMetrics.memoryUsage = memory.usedJSHeapSize;
          performanceMonitor.recordMetric('js_heap_size', memory.usedJSHeapSize);
          
          // Alert on high memory usage
          if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
            analyticsService.trackEvent('high_memory_usage', {
              usedHeapSize: memory.usedJSHeapSize,
              totalHeapSize: memory.totalJSHeapSize,
            });
          }
        }
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    // Monitor component mount/unmount for memory leaks
    let componentCount = 0;
    
    const originalComponentDidMount = React.Component.prototype.componentDidMount;
    const originalComponentWillUnmount = React.Component.prototype.componentWillUnmount;
    
    React.Component.prototype.componentDidMount = function() {
      componentCount++;
      performanceMonitor.recordMetric('active_components', componentCount);
      
      if (originalComponentDidMount) {
        originalComponentDidMount.call(this);
      }
    };
    
    React.Component.prototype.componentWillUnmount = function() {
      componentCount--;
      performanceMonitor.recordMetric('active_components', componentCount);
      
      if (originalComponentWillUnmount) {
        originalComponentWillUnmount.call(this);
      }
    };
  }

  /**
   * Get bundle metrics
   */
  getBundleMetrics(): BundleMetrics {
    return { ...this.bundleMetrics };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.bundleMetrics;
    
    // Check for slow loading chunks
    Object.entries(metrics.chunkLoadTimes).forEach(([chunk, time]) => {
      if (time > 2000) { // 2 second threshold
        recommendations.push(`Consider optimizing ${chunk} - load time: ${time}ms`);
      }
    });
    
    // Check for slow rendering components
    Object.entries(metrics.componentRenderTimes).forEach(([component, time]) => {
      if (time > 100) { // 100ms threshold
        recommendations.push(`Consider optimizing ${component} render - time: ${time}ms`);
      }
    });
    
    // Check memory usage
    if (metrics.memoryUsage > 30 * 1024 * 1024) { // 30MB threshold
      recommendations.push(`High memory usage detected: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Check number of loaded chunks
    if (metrics.loadedChunks.length > 20) {
      recommendations.push(`Many chunks loaded (${metrics.loadedChunks.length}) - consider bundle consolidation`);
    }
    
    return recommendations;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    bundleMetrics: BundleMetrics;
    recommendations: string[];
    summary: {
      averageChunkLoadTime: number;
      averageComponentRenderTime: number;
      totalChunksLoaded: number;
      memoryUsageMB: number;
    };
  } {
    const metrics = this.bundleMetrics;
    const recommendations = this.getOptimizationRecommendations();
    
    const chunkLoadTimes = Object.values(metrics.chunkLoadTimes);
    const componentRenderTimes = Object.values(metrics.componentRenderTimes);
    
    return {
      bundleMetrics: metrics,
      recommendations,
      summary: {
        averageChunkLoadTime: chunkLoadTimes.length > 0 
          ? chunkLoadTimes.reduce((sum, time) => sum + time, 0) / chunkLoadTimes.length 
          : 0,
        averageComponentRenderTime: componentRenderTimes.length > 0
          ? componentRenderTimes.reduce((sum, time) => sum + time, 0) / componentRenderTimes.length
          : 0,
        totalChunksLoaded: metrics.loadedChunks.length,
        memoryUsageMB: metrics.memoryUsage / 1024 / 1024,
      },
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.bundleMetrics = {
      initialBundleSize: 0,
      loadedChunks: [],
      chunkLoadTimes: {},
      memoryUsage: 0,
      componentRenderTimes: {},
    };
    
    loggingService.info('Bundle metrics cleared');
  }
}

export const bundleOptimizationService = new BundleOptimizationService();
