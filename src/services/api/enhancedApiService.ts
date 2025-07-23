import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { loggingMiddleware, retryMiddleware, cachingMiddleware, authMiddleware } from './middleware';
import { ErrorHandlingService } from '../errors/ErrorHandlingService';
import { getEnvironmentConfig } from '../../config/environment';

export class EnhancedApiService {
  private axiosInstance: AxiosInstance;
  private initialized = false;

  constructor() {
    this.axiosInstance = axios.create();
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptors (applied in reverse order)
    this.axiosInstance.interceptors.request.use(
      (config) => authMiddleware.onRequest(config as any) as any,
      authMiddleware.onRequestError
    );
    
    this.axiosInstance.interceptors.request.use(
      (config) => cachingMiddleware.onRequest(config as any) as any,
      (error) => Promise.reject(error)
    );
    
    this.axiosInstance.interceptors.request.use(
      (config) => loggingMiddleware.onRequest(config as any) as any,
      loggingMiddleware.onRequestError
    );

    // Response interceptors (applied in order)
    this.axiosInstance.interceptors.response.use(
      loggingMiddleware.onResponse,
      loggingMiddleware.onResponseError
    );
    
    this.axiosInstance.interceptors.response.use(
      cachingMiddleware.onResponse,
      (error) => Promise.reject(error)
    );
    
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      retryMiddleware.onResponseError
    );
    
    this.axiosInstance.interceptors.response.use(
      authMiddleware.onResponse,
      authMiddleware.onResponseError
    );
    
    // Final error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(ErrorHandlingService.handleApiError(error))
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const envConfig = await getEnvironmentConfig();
      
      this.axiosInstance.defaults.baseURL = envConfig.API_BASE_URL;
      this.axiosInstance.defaults.timeout = envConfig.API_TIMEOUT;
      this.axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';
      
      this.initialized = true;
      
      if (__DEV__) {
        console.log('🚀 Enhanced API Service initialized');
      }
    } catch (error) {
      console.error('Failed to initialize Enhanced API Service:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // GET request with enhanced features
  async get<T>(
    url: string,
    config?: AxiosRequestConfig & {
      cache?: { ttl?: number; key?: string; forceRefresh?: boolean };
      retry?: { maxRetries?: number; retryDelay?: number };
      auth?: { skipAuth?: boolean; requiresAuth?: boolean };
    }
  ): Promise<T> {
    await this.ensureInitialized();
    
    let requestConfig: AxiosRequestConfig = { ...config };
    
    // Apply middleware configurations
    if (config?.cache) {
      requestConfig = cachingMiddleware.withCache(requestConfig, config.cache);
    }
    
    if (config?.retry) {
      requestConfig = retryMiddleware.withRetry(requestConfig, config.retry);
    }
    
    if (config?.auth) {
      requestConfig = authMiddleware.withAuth(requestConfig, config.auth);
    }

    const response = await this.axiosInstance.get<T>(url, requestConfig);
    return response.data;
  }

  // POST request with enhanced features
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & {
      retry?: { maxRetries?: number; retryDelay?: number };
      auth?: { skipAuth?: boolean; requiresAuth?: boolean };
    }
  ): Promise<T> {
    await this.ensureInitialized();
    
    let requestConfig: AxiosRequestConfig = { ...config };
    
    if (config?.retry) {
      requestConfig = retryMiddleware.withRetry(requestConfig, config.retry);
    }
    
    if (config?.auth) {
      requestConfig = authMiddleware.withAuth(requestConfig, config.auth);
    }

    const response = await this.axiosInstance.post<T>(url, data, requestConfig);
    return response.data;
  }

  // PUT request with enhanced features
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & {
      retry?: { maxRetries?: number; retryDelay?: number };
      auth?: { skipAuth?: boolean; requiresAuth?: boolean };
    }
  ): Promise<T> {
    await this.ensureInitialized();
    
    let requestConfig: AxiosRequestConfig = { ...config };
    
    if (config?.retry) {
      requestConfig = retryMiddleware.withRetry(requestConfig, config.retry);
    }
    
    if (config?.auth) {
      requestConfig = authMiddleware.withAuth(requestConfig, config.auth);
    }

    const response = await this.axiosInstance.put<T>(url, data, requestConfig);
    return response.data;
  }

  // DELETE request with enhanced features
  async delete<T>(
    url: string,
    config?: AxiosRequestConfig & {
      retry?: { maxRetries?: number; retryDelay?: number };
      auth?: { skipAuth?: boolean; requiresAuth?: boolean };
    }
  ): Promise<T> {
    await this.ensureInitialized();
    
    let requestConfig: AxiosRequestConfig = { ...config };
    
    if (config?.retry) {
      requestConfig = retryMiddleware.withRetry(requestConfig, config.retry);
    }
    
    if (config?.auth) {
      requestConfig = authMiddleware.withAuth(requestConfig, config.auth);
    }

    const response = await this.axiosInstance.delete<T>(url, requestConfig);
    return response.data;
  }

  // File upload with enhanced features
  async uploadFile<T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig & {
      onUploadProgress?: (progressEvent: any) => void;
      retry?: { maxRetries?: number; retryDelay?: number };
    }
  ): Promise<T> {
    await this.ensureInitialized();
    
    let requestConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    };
    
    if (config?.retry) {
      requestConfig = retryMiddleware.withRetry(requestConfig, config.retry);
    }

    const response = await this.axiosInstance.post<T>(url, formData, requestConfig);
    return response.data;
  }

  // Utility methods
  async clearCache(pattern?: string): Promise<void> {
    await cachingMiddleware.clearCache(pattern);
  }

  async getCacheSize(): Promise<number> {
    return await cachingMiddleware.getCacheSize();
  }

  // Access to raw axios instance for advanced use cases
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const enhancedApiService = new EnhancedApiService();