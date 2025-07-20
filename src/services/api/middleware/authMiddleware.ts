import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { apiService } from '../../apiService';

interface AuthRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  requiresAuth?: boolean;
}

export const authMiddleware = {
  onRequest: async (config: AuthRequestConfig): Promise<AuthRequestConfig> => {
    // Skip auth for specific endpoints
    if (config.skipAuth) {
      return config;
    }

    // Add auth token to requests
    try {
      const token = await apiService.getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      } else if (config.requiresAuth) {
        throw new Error('Authentication required but no token available');
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Auth middleware error:', error);
      }
      
      if (config.requiresAuth) {
        throw error;
      }
    }

    return config;
  },

  onRequestError: (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  },

  onResponse: (response: AxiosResponse): AxiosResponse => {
    return response;
  },

  onResponseError: async (error: AxiosError): Promise<AxiosError> => {
    const config = error.config as AuthRequestConfig;
    
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && !config.skipAuth) {
      try {
        // Try to refresh the token
        await apiService.refreshToken();
        const newToken = await apiService.getToken();
        
        if (newToken && config) {
          // Update the request with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          };
          
          // Retry the original request
          const { default: axios } = await import('axios');
          return axios(config);
        }
      } catch (refreshError) {
        if (__DEV__) {
          console.warn('Token refresh failed:', refreshError);
        }
        
        // Clear invalid tokens
        await apiService.clearToken();
        
        // Redirect to login (in a real app, you'd dispatch an action)
        // This is a simplified example
        throw new Error('Authentication expired. Please log in again.');
      }
    }

    return Promise.reject(error);
  },

  // Helper to configure auth options for specific requests
  withAuth: (config: AxiosRequestConfig, options?: {
    skipAuth?: boolean;
    requiresAuth?: boolean;
  }): AuthRequestConfig => {
    return {
      ...config,
      skipAuth: options?.skipAuth ?? false,
      requiresAuth: options?.requiresAuth ?? true,
    };
  },

  // Helper to make unauthenticated requests
  withoutAuth: (config: AxiosRequestConfig): AuthRequestConfig => {
    return {
      ...config,
      skipAuth: true,
      requiresAuth: false,
    };
  },
};