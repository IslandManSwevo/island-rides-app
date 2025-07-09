import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { BaseService } from './base/BaseService';
import { storageService } from './storageService';
import { getEnvironmentConfig } from '../config/environment';

interface ApiErrorResponse {
  message: string;
  code: string;
  details?: Record<string, any>;
}

export class ApiService extends BaseService {
  private axiosInstance!: AxiosInstance;
  private axiosInstanceWithoutAuth!: AxiosInstance;

  constructor() {
    super();
  }

  protected async onInit(): Promise<void> {
    // Get environment config asynchronously
    const envConfig = await getEnvironmentConfig();
    
    this.axiosInstance = axios.create({
      baseURL: envConfig.API_BASE_URL,
      timeout: envConfig.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstanceWithoutAuth = axios.create({
      baseURL: envConfig.API_BASE_URL,
      timeout: envConfig.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authenticated requests
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            await this.refreshToken();
            const newToken = await this.getToken();
            
            if (newToken && originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.warn('Token refresh failed:', refreshError);
            await this.clearToken();
            // Let the error fall through
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor for non-authenticated requests
    this.axiosInstanceWithoutAuth.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => Promise.reject(this.handleError(error))
    );
  }

  private handleError(error: AxiosError): ApiErrorResponse {
    if (error.response?.data) {
      return error.response.data as ApiErrorResponse;
    }
    
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timeout - please check your connection',
        code: 'TIMEOUT',
      };
    }
    
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      };
    }
    
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  async get<T>(endpoint: string, params?: object): Promise<T> {
    await this.waitForInitialization();
    const response = await this.axiosInstance.get(endpoint, { params });
    return response.data;
  }

  async post<T>(endpoint:string, data: object): Promise<T> {
    await this.waitForInitialization();
    const response = await this.axiosInstance.post(endpoint, data);
    return response.data;
  }

  async postWithoutAuth<T>(endpoint: string, data: object): Promise<T> {
    await this.waitForInitialization();
    const response = await this.axiosInstanceWithoutAuth.post(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data: object): Promise<T> {
    await this.waitForInitialization();
    const response = await this.axiosInstance.put(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    await this.waitForInitialization();
    const response = await this.axiosInstance.delete(endpoint);
    return response.data;
  }

  // Token management methods
  async storeToken(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await storageService.setAuthToken(accessToken);
      await storageService.setRefreshToken(refreshToken);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await storageService.getAuthToken();
    } catch (error) {
      console.warn('Failed to get token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await storageService.clearAuthToken();
      await storageService.clearRefreshToken();
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  async refreshToken(): Promise<void> {
    await this.waitForInitialization();
    const refreshToken = await storageService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.axiosInstanceWithoutAuth.post('/api/auth/refresh', {
        refreshToken,
      });
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      if (accessToken && newRefreshToken) {
        await this.storeToken(accessToken, newRefreshToken);
      } else {
        throw new Error('Invalid token refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearToken();
      throw error;
    }
  }
}

export const apiService = ApiService.getInstance<ApiService>();