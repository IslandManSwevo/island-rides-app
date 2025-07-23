import { useCallback, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import PerformanceMonitoringService from '../services/PerformanceMonitoringService';
import AlertingService from '../services/AlertingService';

interface AlertFilters {
  severity?: 'critical' | 'warning' | 'info';
  type?: 'performance' | 'error' | 'system' | 'custom';
  acknowledged?: boolean;
  resolved?: boolean;
  since?: number;
}

interface UseMonitoringOptions {
  componentName?: string;
  trackRenders?: boolean;
  trackNavigation?: boolean;
  trackMemory?: boolean;
  customThresholds?: {
    slowRender?: number;
    slowNavigation?: number;
    highMemory?: number;
  };
}

export const useMonitoring = (options: UseMonitoringOptions = {}) => {
  const {
    componentName = 'Unknown Component',
    trackRenders = true,
    trackNavigation = true,
    trackMemory = false,
    customThresholds = {}
  } = options;

  const performanceService = PerformanceMonitoringService.getInstance();
  const alertingService = AlertingService.getInstance();
  const navigation = useNavigation();
  
  const renderStartTime = useRef<number>(Date.now());
  const navigationStartTime = useRef<number | null>(null);
  const lastScreenName = useRef<string | null>(null);
  const renderCount = useRef(0);

  // Track component renders
  useEffect(() => {
    if (!trackRenders) return;

    const renderTime = Date.now() - renderStartTime.current;
    renderCount.current++;

    // Record render metric
    performanceService.recordRenderMetric(componentName, renderTime, {
      renderCount: renderCount.current
    });

    // Check for slow render alert
    const threshold = customThresholds.slowRender || 16;
    if (renderTime > threshold) {
      alertingService.checkRules({
        type: 'render',
        name: 'slow_render',
        value: renderTime,
        componentName,
        threshold,
        source: componentName
      });
    }

    // Reset render timer
    renderStartTime.current = Date.now();
  });

  // Track navigation performance
  useEffect(() => {
    if (!trackNavigation) return;

    const unsubscribe = navigation.addListener('state', (e) => {
      const currentRoute = e.data?.state?.routes?.[e.data.state.index]?.name;
      
      if (currentRoute && lastScreenName.current && navigationStartTime.current) {
        const navigationTime = Date.now() - navigationStartTime.current;
        
        // Record navigation metric
        performanceService.recordNavigation(
          lastScreenName.current,
          currentRoute,
          navigationTime
        );

        // Check for slow navigation alert
        const threshold = customThresholds.slowNavigation || 1000;
        if (navigationTime > threshold) {
          alertingService.checkRules({
            type: 'navigation',
            name: 'slow_navigation',
            value: navigationTime,
            fromScreen: lastScreenName.current,
            toScreen: currentRoute,
            threshold,
            source: 'Navigation'
          });
        }
      }

      lastScreenName.current = currentRoute;
      navigationStartTime.current = Date.now();
    });

    return unsubscribe;
  }, [navigation, trackNavigation, customThresholds.slowNavigation]);

  // Track memory usage
  useEffect(() => {
    if (!trackMemory) return;

    const interval = setInterval(() => {
      performanceService.recordMemoryUsage();
      
      // Check memory usage
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memoryMB = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
        const threshold = customThresholds.highMemory || 150;
        
        if (memoryMB > threshold) {
          alertingService.checkRules({
            type: 'memory',
            name: 'high_memory',
            value: memoryMB,
            threshold,
            source: componentName
          });
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [trackMemory, componentName, customThresholds.highMemory]);

  // API call tracking utility
  const trackApiCall = useCallback(async <T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    options: {
      timeout?: number;
      retryCount?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<T> => {
    const startTime = Date.now();
    const { timeout = 30000, retryCount = 0, metadata = {} } = options;

    try {
      // Add timeout to API call
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      const result = await Promise.race([apiCall(), timeoutPromise]);
      const responseTime = Date.now() - startTime;

      // Record successful API call
      performanceService.recordApiCall(endpoint, responseTime, 200, {
        retryCount,
        ...metadata
      });

      // Check for slow API response
      if (responseTime > 2000) {
        alertingService.checkRules({
          type: 'api',
          name: 'slow_api',
          value: responseTime,
          endpoint,
          statusCode: 200,
          source: 'API Client'
        });
      }

      return result;
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const statusCode = (error as any)?.response?.status || 500;

      // Record failed API call
      performanceService.recordApiCall(endpoint, responseTime, statusCode, {
        error: error instanceof Error ? error.message : String(error),
        retryCount,
        ...metadata
      });

      // Trigger API error alert
      alertingService.checkRules({
        type: 'api',
        name: 'api_error',
        value: responseTime,
        endpoint,
        statusCode,
        error: error instanceof Error ? error.message : String(error),
        source: 'API Client'
      });

      throw error;
    }
  }, []);

  // Custom metric tracking
  const trackCustomMetric = useCallback((
    metricName: string,
    value: number,
    metadata?: Record<string, unknown>
  ) => {
    performanceService.recordCustomMetric(metricName, value, {
      source: componentName,
      ...metadata
    });

    // Allow custom alert checking
    alertingService.checkRules({
      type: 'custom',
      name: metricName,
      value,
      source: componentName,
      ...metadata
    });
  }, [componentName]);

  // Operation timing utility
  const measureOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T> | T,
    options: {
      alertThreshold?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<T> => {
    const { alertThreshold = 100, metadata = {} } = options;
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      // Track the operation
      trackCustomMetric(`${operationName}_duration`, duration, {
        operationType: 'operation',
        success: true,
        ...metadata
      });

      // Alert if operation is slow
      if (duration > alertThreshold) {
        alertingService.checkRules({
          type: 'custom',
          name: 'slow_operation',
          value: duration,
          operationName,
          threshold: alertThreshold,
          source: componentName
        });
      }

      return result;
    } catch (error: Error | unknown) {
      const duration = Date.now() - startTime;
      
      // Track failed operation
      trackCustomMetric(`${operationName}_duration`, duration, {
        operationType: 'operation',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        ...metadata
      });

      // Alert about operation failure
      alertingService.checkRules({
        type: 'error',
        name: 'operation_error',
        value: duration,
        operationName,
        error: error instanceof Error ? error.message : String(error),
        source: componentName
      });

      throw error;
    }
  }, [trackCustomMetric, componentName]);

  // Get current performance metrics
  const getMetrics = useCallback(() => {
    const report = performanceService.generateReport();
    return report;
  }, []);

  // Get current alerts
  const getAlerts = useCallback((filters?: AlertFilters) => {
    return alertingService.getAlerts(filters);
  }, []);

  // Test alert system
  const testAlert = useCallback((severity: 'critical' | 'warning' | 'info' = 'info') => {
    alertingService.testAlert(severity);
  }, []);

  return {
    // Monitoring utilities
    trackApiCall,
    trackCustomMetric,
    measureOperation,
    
    // Data access
    getMetrics,
    getAlerts,
    
    // Testing
    testAlert,
    
    // Component stats
    renderCount: renderCount.current
  };
};

// Hook specifically for screen-level monitoring
export const useScreenMonitoring = (screenName: string) => {
  const baseMonitoring = useMonitoring({
    componentName: screenName,
    trackRenders: true,
    trackNavigation: true,
    trackMemory: true
  });

  const screenLoadStartTime = useRef<number>(Date.now());
  const isScreenLoaded = useRef(false);

  // Track screen load time
  const markScreenLoaded = useCallback(() => {
    if (!isScreenLoaded.current) {
      const loadTime = Date.now() - screenLoadStartTime.current;
      baseMonitoring.trackCustomMetric('screen_load_time', loadTime, {
        screenName,
        type: 'screen_load'
      });
      isScreenLoaded.current = true;
    }
  }, [baseMonitoring, screenName]);

  // Track user interactions
  const trackUserInteraction = useCallback((interactionType: string, duration?: number) => {
    baseMonitoring.trackCustomMetric('user_interaction', duration || 1, {
      screenName,
      interactionType,
      type: 'user_interaction'
    });
  }, [baseMonitoring, screenName]);

  return {
    ...baseMonitoring,
    markScreenLoaded,
    trackUserInteraction
  };
};

// Hook for API service monitoring
export const useApiMonitoring = (serviceName: string) => {
  const performanceService = PerformanceMonitoringService.getInstance();
  const alertingService = AlertingService.getInstance();

  const trackRequest = useCallback(async <T>(
    endpoint: string,
    request: () => Promise<T>,
    options: {
      timeout?: number;
      retries?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<T> => {
    const { timeout = 30000, retries = 0, metadata = {} } = options;
    const startTime = Date.now();
    let attempt = 0;

    const executeRequest = async (): Promise<T> => {
      attempt++;
      
      try {
        const result = await Promise.race([
          request(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);

        const responseTime = Date.now() - startTime;
        
        // Record successful request
        performanceService.recordApiCall(endpoint, responseTime, 200, {
          service: serviceName,
          attempt,
          ...metadata
        });

        return result;
      } catch (error: unknown) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const statusCode = (error as any)?.response?.status || (errorMessage === 'Request timeout' ? 408 : 500);

        if (attempt <= retries && statusCode >= 500) {
          // Retry for server errors
          return executeRequest();
        }

        // Record failed request
        performanceService.recordApiCall(endpoint, responseTime, statusCode, {
          service: serviceName,
          attempt,
          error: errorMessage,
          ...metadata
        });

        // Trigger alert for errors
        alertingService.checkRules({
          type: 'api',
          name: 'api_error',
          value: responseTime,
          endpoint,
          statusCode,
          service: serviceName,
          error: errorMessage,
          source: serviceName
        });

        throw error;
      }
    };

    return executeRequest();
  }, [serviceName]);

  return {
    trackRequest
  };
};

export default useMonitoring;