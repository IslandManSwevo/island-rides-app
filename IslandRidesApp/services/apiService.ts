import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEnvironmentConfig } from '../src/config/environment';

export class ApiService {
  private static readonly TOKEN_KEY = 'auth_token';
  private baseUrl: string;
  private static instance: ApiService | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || 'http://localhost:3003/api'; // Fallback URL
  }

  private async initializeBaseUrl(): Promise<void> {
    try {
      const config = await getEnvironmentConfig();
      this.baseUrl = `${config.API_BASE_URL}/api`;
    } catch (error) {
      console.warn('Failed to load environment config, using fallback URL:', error);
      // Keep the fallback URL set in constructor
    }
  }

  // Singleton pattern to ensure consistent configuration
  static async getInstance(): Promise<ApiService> {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
      await ApiService.instance.initializeBaseUrl();
    }
    return ApiService.instance;
  }

  // Token management methods
  static async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ApiService.TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store auth token:', error);
      throw new Error('Could not store authentication token');
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ApiService.TOKEN_KEY);    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  }

  static async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ApiService.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear auth token:', error);
      throw new Error('Could not clear authentication token');
    }
  }

  // HTTP request methods
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const token = await ApiService.getToken();
    return this.request<T>(endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const token = await ApiService.getToken();
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(data),
    });
  }

  async postWithoutAuth<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const token = await ApiService.getToken();
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    const token = await ApiService.getToken();
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  async refreshToken(): Promise<void> {
    try {
      // Use postWithoutAuth to avoid circular dependency when token is expired
      const response = await this.postWithoutAuth<{ token: string }>('/auth/refresh', {});
      if (response.token) {
        await ApiService.storeToken(response.token);
      } else {
        throw new Error('No token received during refresh');
      }
    } catch (error) {
      await ApiService.clearToken();
      throw error;
    }
  }
}

// Create and export a singleton instance factory
let apiServiceInstance: ApiService | null = null;

export const getApiService = async (): Promise<ApiService> => {
  if (!apiServiceInstance) {
    apiServiceInstance = await ApiService.getInstance();
  }
  return apiServiceInstance;
};

// For backward compatibility, create a default instance
// Note: This will use fallback URL until getApiService() is called
const defaultApiService = new ApiService();

// Named export for backward compatibility
export const apiService = defaultApiService;

export default defaultApiService;
