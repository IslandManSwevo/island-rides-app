import AsyncStorage from '@react-native-async-storage/async-storage';
import { transformToCamelCase, transformToSnakeCase } from '../utils/caseTransform';
import { BaseService } from './base/BaseService';

export class StorageService extends BaseService {
  async set(key: string, value: any): Promise<void> {
    try {
      const snakeCaseValue = transformToSnakeCase(value);
      await AsyncStorage.setItem(key, JSON.stringify(snakeCaseValue));
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;

      try {
        const parsedValue = JSON.parse(value);
        return transformToCamelCase(parsedValue) as T;
      } catch (parseError) {
        console.error(`Error parsing JSON for key "${key}":`, parseError);
        throw new Error(`Failed to parse stored data for key: ${key}`);
      }
    } catch (error) {
      console.error(`Error retrieving data for key "${key}":`, error);
      throw new Error(`Failed to retrieve data for key: ${key}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Utility method for storing auth token
  async setAuthToken(token: string): Promise<void> {
    await this.set('authToken', token);
  }

  async getAuthToken(): Promise<string | null> {
    return this.get<string>('authToken');
  }

  async clearAuthToken(): Promise<void> {
    await this.remove('authToken');
  }

  async setRefreshToken(token: string): Promise<void> {
    await this.set('refreshToken', token);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.get<string>('refreshToken');
  }

  async clearRefreshToken(): Promise<void> {
    await this.remove('refreshToken');
  }

  // User preferences storage
  async setUserPreferences(preferences: Record<string, any>): Promise<void> {
    await this.set('userPreferences', preferences);
  }

  async getUserPreferences<T>(): Promise<T | null> {
    return this.get<T>('userPreferences');
  }

  protected async onInit(): Promise<void> {
    // StorageService doesn't need special initialization
    // AsyncStorage is ready to use immediately
  }
}

export const storageService = StorageService.getInstance();
