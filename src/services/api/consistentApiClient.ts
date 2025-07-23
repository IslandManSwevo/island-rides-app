import { apiService } from '../apiService';
import { offlineApiService } from './offlineApiService';
import { ErrorHandlingService } from '../errors/ErrorHandlingService';
import { performanceMonitor } from '../PerformanceMonitor';
import { loggingService } from '../LoggingService';

interface ApiRequestOptions {
  // Error handling options
  showNotification?: boolean;
  logError?: boolean;
  retryCount?: number;
  retryDelay?: number;
  
  // Offline support options
  offlineSupport?: boolean;
  cacheFirst?: boolean;
  cacheTTL?: number;
  queueIfOffline?: boolean;
  priority?: 'high' | 'normal' | 'low';
  
  // Performance monitoring
  trackPerformance?: boolean;
  performanceContext?: string;
  
  // Request metadata
  context?: string;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: any;
  fromCache?: boolean;
  requestId?: string;
}

/**
 * Consistent API Client
 * 
 * Provides a unified interface for all API calls with:
 * - Consistent error handling across all requests
 * - Automatic retry logic with exponential backoff
 * - Offline support with request queuing
 * - Performance monitoring and logging
 * - Cache-first strategies for GET requests
 * - Request/response transformation
 * - Timeout handling
 */
class ConsistentApiClient {
  private static instance: ConsistentApiClient;
  private requestCounter = 0;

  private constructor() {}

  static getInstance(): ConsistentApiClient {
    if (!ConsistentApiClient.instance) {
      ConsistentApiClient.instance = new ConsistentApiClient();
    }
    return ConsistentApiClient.instance;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Enhanced GET request with full error handling and offline support
   */
  async get<T>(
    endpoint: string,
    params?: object,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const {
      showNotification = true,
      logError = true,
      retryCount = 2,
      retryDelay = 1000,
      offlineSupport = true,
      cacheFirst = true,
      cacheTTL = 300000, // 5 minutes
      trackPerformance = true,
      performanceContext = `GET_${endpoint}`,
      context = `GET ${endpoint}`,
      timeout = 10000,
    } = options;

    const stopTimer = trackPerformance 
      ? performanceMonitor.startTimer(performanceContext)
      : () => {};

    try {
      loggingService.info(`🚀 API Request: ${context}`, { requestId, params });

      const data = await ErrorHandlingService.withErrorHandling<T>(
        async () => {
          if (offlineSupport) {
            return offlineApiService.get<T>(endpoint, params, {
              cacheFirst,
              cacheTTL,
              offlineSupport,
            });
          } else {
            return apiService.get<T>(endpoint, params);
          }
        },
        context,
        {
          showNotification,
          logError,
          retryCount,
          retryDelay,
        }
      );

      loggingService.info(`✅ API Success: ${context}`, { requestId });

      return {
        data,
        success: true,
        requestId,
      };
    } catch (error) {
      loggingService.error(`❌ API Error: ${context}`, error, { requestId });
      
      return {
        data: {} as T,
        success: false,
        error,
        requestId,
      };
    } finally {
      stopTimer();
    }
  }

  /**
   * Enhanced POST request with full error handling and offline support
   */
  async post<T>(
    endpoint: string,
    data: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const {
      showNotification = true,
      logError = true,
      retryCount = 1, // Less retries for POST to avoid duplicates
      retryDelay = 1000,
      offlineSupport = true,
      queueIfOffline = true,
      priority = 'normal',
      trackPerformance = true,
      performanceContext = `POST_${endpoint}`,
      context = `POST ${endpoint}`,
    } = options;

    const stopTimer = trackPerformance 
      ? performanceMonitor.startTimer(performanceContext)
      : () => {};

    try {
      loggingService.info(`🚀 API Request: ${context}`, { requestId, dataSize: JSON.stringify(data).length });

      const responseData = await ErrorHandlingService.withErrorHandling<T>(
        async () => {
          if (offlineSupport) {
            return offlineApiService.post<T>(endpoint, data, {
              queueIfOffline,
              priority,
            });
          } else {
            return apiService.post<T>(endpoint, data);
          }
        },
        context,
        {
          showNotification,
          logError,
          retryCount,
          retryDelay,
        }
      );

      loggingService.info(`✅ API Success: ${context}`, { requestId });

      return {
        data: responseData,
        success: true,
        requestId,
      };
    } catch (error) {
      loggingService.error(`❌ API Error: ${context}`, error, { requestId });
      
      return {
        data: {} as T,
        success: false,
        error,
        requestId,
      };
    } finally {
      stopTimer();
    }
  }

  /**
   * Enhanced PUT request with full error handling and offline support
   */
  async put<T>(
    endpoint: string,
    data: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const {
      showNotification = true,
      logError = true,
      retryCount = 1,
      retryDelay = 1000,
      offlineSupport = true,
      queueIfOffline = true,
      priority = 'normal',
      trackPerformance = true,
      performanceContext = `PUT_${endpoint}`,
      context = `PUT ${endpoint}`,
    } = options;

    const stopTimer = trackPerformance 
      ? performanceMonitor.startTimer(performanceContext)
      : () => {};

    try {
      loggingService.info(`🚀 API Request: ${context}`, { requestId, dataSize: JSON.stringify(data).length });

      const responseData = await ErrorHandlingService.withErrorHandling<T>(
        async () => {
          if (offlineSupport) {
            return offlineApiService.put<T>(endpoint, data, {
              queueIfOffline,
              priority,
            });
          } else {
            return apiService.put<T>(endpoint, data);
          }
        },
        context,
        {
          showNotification,
          logError,
          retryCount,
          retryDelay,
        }
      );

      loggingService.info(`✅ API Success: ${context}`, { requestId });

      return {
        data: responseData,
        success: true,
        requestId,
      };
    } catch (error) {
      loggingService.error(`❌ API Error: ${context}`, error, { requestId });
      
      return {
        data: {} as T,
        success: false,
        error,
        requestId,
      };
    } finally {
      stopTimer();
    }
  }

  /**
   * Enhanced DELETE request with full error handling and offline support
   */
  async delete<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const {
      showNotification = true,
      logError = true,
      retryCount = 1,
      retryDelay = 1000,
      offlineSupport = true,
      queueIfOffline = true,
      priority = 'high', // Delete operations are usually high priority
      trackPerformance = true,
      performanceContext = `DELETE_${endpoint}`,
      context = `DELETE ${endpoint}`,
    } = options;

    const stopTimer = trackPerformance 
      ? performanceMonitor.startTimer(performanceContext)
      : () => {};

    try {
      loggingService.info(`🚀 API Request: ${context}`, { requestId });

      const responseData = await ErrorHandlingService.withErrorHandling<T>(
        async () => {
          if (offlineSupport) {
            return offlineApiService.delete<T>(endpoint, {
              queueIfOffline,
              priority,
            });
          } else {
            return apiService.delete<T>(endpoint);
          }
        },
        context,
        {
          showNotification,
          logError,
          retryCount,
          retryDelay,
        }
      );

      loggingService.info(`✅ API Success: ${context}`, { requestId });

      return {
        data: responseData,
        success: true,
        requestId,
      };
    } catch (error) {
      loggingService.error(`❌ API Error: ${context}`, error, { requestId });
      
      return {
        data: {} as T,
        success: false,
        error,
        requestId,
      };
    } finally {
      stopTimer();
    }
  }

  /**
   * Batch API requests with consistent error handling
   */
  async batch<T>(
    requests: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      endpoint: string;
      data?: any;
      params?: object;
      options?: ApiRequestOptions;
    }>
  ): Promise<Array<ApiResponse<T>>> {
    const batchId = this.generateRequestId();
    loggingService.info(`🚀 Batch API Request: ${requests.length} requests`, { batchId });

    const results = await Promise.allSettled(
      requests.map(async (request, index) => {
        const requestOptions = {
          ...request.options,
          context: `Batch[${index}] ${request.method} ${request.endpoint}`,
        };

        switch (request.method) {
          case 'GET':
            return this.get<T>(request.endpoint, request.params, requestOptions);
          case 'POST':
            return this.post<T>(request.endpoint, request.data, requestOptions);
          case 'PUT':
            return this.put<T>(request.endpoint, request.data, requestOptions);
          case 'DELETE':
            return this.delete<T>(request.endpoint, requestOptions);
          default:
            throw new Error(`Unsupported method: ${request.method}`);
        }
      })
    );

    const responses = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        loggingService.error(`❌ Batch request ${index} failed`, result.reason, { batchId });
        return {
          data: {} as T,
          success: false,
          error: result.reason,
          requestId: `${batchId}_${index}`,
        };
      }
    });

    const successCount = responses.filter(r => r.success).length;
    loggingService.info(`✅ Batch API Complete: ${successCount}/${requests.length} successful`, { batchId });

    return responses;
  }

  /**
   * Get API client status
   */
  getStatus() {
    return {
      isOnline: offlineApiService.isOnline(),
      networkState: offlineApiService.getNetworkState(),
      offlineQueue: offlineApiService.getOfflineQueueStatus(),
    };
  }
}

// Export singleton instance
export const consistentApiClient = ConsistentApiClient.getInstance();
export default consistentApiClient;
