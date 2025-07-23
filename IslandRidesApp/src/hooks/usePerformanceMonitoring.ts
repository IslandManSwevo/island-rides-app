import { useEffect, useRef, useCallback } from 'react';

declare global {
  var global: typeof globalThis;
}

// Extended Performance interface to include memory property
interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// Polyfill for performance API if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    memory: undefined,
  } as ExtendedPerformance;
}

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  slowRenderCount: number;
}

interface PerformanceConfig {
  slowRenderThreshold?: number; // ms, default 16ms (60fps)
  enableLogging?: boolean;
  trackMemory?: boolean;
}

export const usePerformanceMonitoring = (
  componentName: string,
  config: PerformanceConfig = {}
) => {
  const {
    slowRenderThreshold = 16,
    enableLogging = __DEV__,
    trackMemory = false,
  } = config;

  const renderCount = useRef(0);
  const startTime = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);
  const slowRenderCount = useRef(0);
  const memoryBaseline = useRef<number | null>(null);

  // Initialize memory baseline
  useEffect(() => {
    if (trackMemory && (performance as ExtendedPerformance)?.memory) {
      memoryBaseline.current = (performance as ExtendedPerformance).memory!.usedJSHeapSize;
    }
  }, [trackMemory]);

  // Track render performance
  useEffect(() => {
    const renderEndTime = Date.now();
    const renderTime = renderEndTime - startTime.current;
    
    renderCount.current++;
    renderTimes.current.push(renderTime);
    
    // Keep only last 10 render times for average calculation
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }
    
    // Check for slow renders
    if (renderTime > slowRenderThreshold) {
      slowRenderCount.current++;
      
      if (enableLogging) {
        console.warn(
          `🐌 Slow render detected in ${componentName}: ${renderTime}ms ` +
          `(threshold: ${slowRenderThreshold}ms)`
        );
      }
    }
    
    // Log performance summary every 20 renders (in development)
    if (enableLogging && renderCount.current % 20 === 0) {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      console.log(
        `📊 Performance summary for ${componentName}:`,
        {
          renders: renderCount.current,
          avgRenderTime: Math.round(avgRenderTime * 100) / 100,
          slowRenders: slowRenderCount.current,
          slowRenderPercentage: Math.round((slowRenderCount.current / renderCount.current) * 100),
        }
      );
    }
    
    // Reset start time for next render
    startTime.current = Date.now();
  });

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const avgRenderTime = renderTimes.current.length > 0
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      : 0;
    
    return {
      renderCount: renderCount.current,
      averageRenderTime: Math.round(avgRenderTime * 100) / 100,
      lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
      slowRenderCount: slowRenderCount.current,
    };
  }, []);

  // Get memory usage (if available)
  const getMemoryUsage = useCallback(() => {
    if (!trackMemory || !(performance as ExtendedPerformance)?.memory) {
      return null;
    }
    
    const current = (performance as ExtendedPerformance).memory!.usedJSHeapSize;
    const baseline = memoryBaseline.current || 0;
    
    return {
      current: Math.round(current / 1024 / 1024), // MB
      baseline: Math.round(baseline / 1024 / 1024), // MB
      difference: Math.round((current - baseline) / 1024 / 1024), // MB
    };
  }, [trackMemory]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    renderCount.current = 0;
    renderTimes.current = [];
    slowRenderCount.current = 0;
    startTime.current = Date.now();
    
    if (trackMemory && (performance as ExtendedPerformance)?.memory) {
      memoryBaseline.current = (performance as ExtendedPerformance).memory!.usedJSHeapSize;
    }
  }, [trackMemory]);

  return {
    getMetrics,
    getMemoryUsage,
    resetMetrics,
    renderCount: renderCount.current,
  };
};

// Hook for monitoring expensive operations
export const useOperationMonitoring = (operationName: string) => {
  const measureOperation = useCallback(async <T>(
    operation: () => Promise<T> | T
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (__DEV__ && duration > 100) { // 100ms threshold
        console.warn(
          `⏱️ Slow operation detected: ${operationName} took ${Math.round(duration)}ms`
        );
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (__DEV__) {
        console.error(
          `❌ Operation failed: ${operationName} (${Math.round(duration)}ms)`,
          error
        );
      }
      
      throw error;
    }
  }, [operationName]);

  return { measureOperation };
};