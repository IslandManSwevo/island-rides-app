import NetInfo from '@react-native-community/netinfo';
import { apiService } from '../apiService';
import { storageService } from '../storageService';
import { notificationService } from '../notificationService';
import { ErrorHandlingService } from '../errors/ErrorHandlingService';

interface OfflineRequest {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

/**
 * Enhanced API Service with Offline Support
 * 
 * Provides:
 * - Network state monitoring
 * - Offline request queuing
 * - Automatic retry when connection is restored
 * - Cache-first strategies for GET requests
 * - User-friendly offline notifications
 */
class OfflineApiService {
  private static instance: OfflineApiService;
  private networkState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: 'unknown',
  };
  private offlineQueue: OfflineRequest[] = [];
  private isProcessingQueue = false;
  private readonly OFFLINE_QUEUE_KEY = 'offline_api_queue';
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly MAX_OFFLINE_RETRIES = 3;

  private constructor() {
    this.initializeNetworkMonitoring();
    this.loadOfflineQueue();
  }

  static getInstance(): OfflineApiService {
    if (!OfflineApiService.instance) {
      OfflineApiService.instance = new OfflineApiService();
    }
    return OfflineApiService.instance;
  }

  /**
   * Initialize network state monitoring
   */
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener((state) => {
      const wasConnected = this.networkState.isConnected;
      
      this.networkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };

      console.log('🌐 Network state changed:', this.networkState);

      // If we just came back online, process the offline queue
      if (!wasConnected && this.networkState.isConnected) {
        this.onConnectionRestored();
      }

      // If we just went offline, notify the user
      if (wasConnected && !this.networkState.isConnected) {
        this.onConnectionLost();
      }
    });
  }

  /**
   * Handle connection restored
   */
  private onConnectionRestored(): void {
    notificationService.success('Connection restored', {
      title: 'Back Online',
      duration: 3000,
    });

    this.processOfflineQueue();
  }

  /**
   * Handle connection lost
   */
  private onConnectionLost(): void {
    notificationService.warning('You are now offline. Some features may be limited.', {
      title: 'Connection Lost',
      duration: 5000,
      persistent: true,
    });
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.networkState.isConnected && this.networkState.isInternetReachable !== false;
  }

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Enhanced GET request with offline support
   */
  async get<T>(
    endpoint: string,
    params?: object,
    options?: {
      cacheFirst?: boolean;
      cacheTTL?: number;
      offlineSupport?: boolean;
    }
  ): Promise<T> {
    const { cacheFirst = true, cacheTTL = 300000, offlineSupport = true } = options || {};

    // If offline and cache-first is enabled, try to get from cache
    if (!this.isOnline() && cacheFirst && offlineSupport) {
      try {
        const cachedData = await this.getCachedData<T>(endpoint, params);
        if (cachedData) {
          notificationService.info('Showing cached data', {
            duration: 2000,
          });
          return cachedData;
        }
      } catch (error) {
        console.warn('Failed to get cached data:', error);
      }
    }

    // If offline and no cache, throw offline error
    if (!this.isOnline() && offlineSupport) {
      throw ErrorHandlingService.handleApiError({
        message: 'You are offline. Please check your connection.',
        code: 'OFFLINE_ERROR',
        type: 'network',
      });
    }

    try {
      const data = await apiService.get<T>(endpoint, params);
      
      // Cache successful GET requests
      if (cacheFirst) {
        await this.setCachedData(endpoint, params, data, cacheTTL);
      }
      
      return data;
    } catch (error) {
      // If online request fails and we have cache, fall back to cache
      if (cacheFirst && offlineSupport) {
        try {
          const cachedData = await this.getCachedData<T>(endpoint, params);
          if (cachedData) {
            notificationService.warning('Using cached data due to network error', {
              duration: 3000,
            });
            return cachedData;
          }
        } catch (cacheError) {
          console.warn('Failed to get cached data as fallback:', cacheError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Enhanced POST request with offline queuing
   */
  async post<T>(
    endpoint: string,
    data: any,
    options?: {
      queueIfOffline?: boolean;
      priority?: 'high' | 'normal' | 'low';
    }
  ): Promise<T> {
    const { queueIfOffline = true, priority = 'normal' } = options || {};

    if (!this.isOnline() && queueIfOffline) {
      return this.queueRequest<T>('POST', endpoint, data, priority);
    }

    return apiService.post<T>(endpoint, data);
  }

  /**
   * Enhanced PUT request with offline queuing
   */
  async put<T>(
    endpoint: string,
    data: any,
    options?: {
      queueIfOffline?: boolean;
      priority?: 'high' | 'normal' | 'low';
    }
  ): Promise<T> {
    const { queueIfOffline = true, priority = 'normal' } = options || {};

    if (!this.isOnline() && queueIfOffline) {
      return this.queueRequest<T>('PUT', endpoint, data, priority);
    }

    return apiService.put<T>(endpoint, data);
  }

  /**
   * Enhanced DELETE request with offline queuing
   */
  async delete<T>(
    endpoint: string,
    options?: {
      queueIfOffline?: boolean;
      priority?: 'high' | 'normal' | 'low';
    }
  ): Promise<T> {
    const { queueIfOffline = true, priority = 'normal' } = options || {};

    if (!this.isOnline() && queueIfOffline) {
      return this.queueRequest<T>('DELETE', endpoint, undefined, priority);
    }

    return apiService.delete<T>(endpoint);
  }

  /**
   * Queue request for offline processing
   */
  private async queueRequest<T>(
    method: 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    const request: OfflineRequest = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_OFFLINE_RETRIES,
    };

    // Add to queue based on priority
    if (priority === 'high') {
      this.offlineQueue.unshift(request);
    } else {
      this.offlineQueue.push(request);
    }

    // Limit queue size
    if (this.offlineQueue.length > this.MAX_QUEUE_SIZE) {
      this.offlineQueue = this.offlineQueue.slice(-this.MAX_QUEUE_SIZE);
    }

    await this.saveOfflineQueue();

    notificationService.info(`Request queued for when you're back online`, {
      duration: 3000,
    });

    // Return a promise that will be resolved when the request is processed
    // For now, we'll return a placeholder response
    return Promise.resolve({} as T);
  }

  /**
   * Process offline queue when connection is restored
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.isProcessingQueue || this.offlineQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`📤 Processing ${this.offlineQueue.length} offline requests...`);

    const processedRequests: string[] = [];

    for (const request of [...this.offlineQueue]) {
      try {
        await this.executeOfflineRequest(request);
        processedRequests.push(request.id);
        console.log(`✅ Processed offline request: ${request.method} ${request.endpoint}`);
      } catch (error) {
        console.warn(`❌ Failed to process offline request: ${request.method} ${request.endpoint}`, error);
        
        request.retryCount++;
        if (request.retryCount >= request.maxRetries) {
          processedRequests.push(request.id);
          console.warn(`🚫 Giving up on offline request after ${request.maxRetries} retries`);
        }
      }
    }

    // Remove processed requests from queue
    this.offlineQueue = this.offlineQueue.filter(
      request => !processedRequests.includes(request.id)
    );

    await this.saveOfflineQueue();
    this.isProcessingQueue = false;

    if (processedRequests.length > 0) {
      notificationService.success(`Synced ${processedRequests.length} offline requests`, {
        duration: 3000,
      });
    }
  }

  /**
   * Execute a queued offline request
   */
  private async executeOfflineRequest(request: OfflineRequest): Promise<any> {
    switch (request.method) {
      case 'POST':
        return apiService.post(request.endpoint, request.data);
      case 'PUT':
        return apiService.put(request.endpoint, request.data);
      case 'DELETE':
        return apiService.delete(request.endpoint);
      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  }

  /**
   * Get cached data
   */
  private async getCachedData<T>(endpoint: string, params?: object): Promise<T | null> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = await storageService.getItem(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Set cached data
   */
  private async setCachedData(
    endpoint: string,
    params: object | undefined,
    data: any,
    ttl: number
  ): Promise<void> {
    const cacheKey = this.getCacheKey(endpoint, params);
    await storageService.setItem(cacheKey, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Generate cache key
   */
  private getCacheKey(endpoint: string, params?: object): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `api_cache_${endpoint}_${paramString}`;
  }

  /**
   * Load offline queue from storage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const queue = await storageService.getItem(this.OFFLINE_QUEUE_KEY);
      if (queue && Array.isArray(queue)) {
        this.offlineQueue = queue;
        console.log(`📥 Loaded ${this.offlineQueue.length} offline requests from storage`);
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
    }
  }

  /**
   * Save offline queue to storage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await storageService.setItem(this.OFFLINE_QUEUE_KEY, this.offlineQueue);
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }

  /**
   * Clear offline queue
   */
  async clearOfflineQueue(): Promise<void> {
    this.offlineQueue = [];
    await storageService.removeItem(this.OFFLINE_QUEUE_KEY);
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus() {
    return {
      queueLength: this.offlineQueue.length,
      isProcessing: this.isProcessingQueue,
      isOnline: this.isOnline(),
    };
  }
}

// Export singleton instance
export const offlineApiService = OfflineApiService.getInstance();
export default offlineApiService;
