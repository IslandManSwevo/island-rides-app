import { AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry {
  data: Record<string, unknown>;
  timestamp: number;
  etag?: string;
}

interface CacheConfig extends AxiosRequestConfig {
  cache?: {
    ttl?: number; // Time to live in milliseconds
    key?: string; // Custom cache key
    skipCache?: boolean; // Skip cache for this request
    forceRefresh?: boolean; // Force refresh cache
  };
}

const CACHE_PREFIX = '@api_cache:';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const generateCacheKey = (config: AxiosRequestConfig): string => {
  const { method, url, params } = config;
  const key = `${method}:${url}:${JSON.stringify(params || {})}`;
  return `${CACHE_PREFIX}${key}`;
};

const isCacheable = (config: AxiosRequestConfig): boolean => {
  // Only cache GET requests by default
  return config.method?.toLowerCase() === 'get';
};

const isDataFresh = (entry: CacheEntry, ttl: number): boolean => {
  const now = Date.now();
  return (now - entry.timestamp) < ttl;
};

export const cachingMiddleware = {
  onRequest: async (config: CacheConfig): Promise<CacheConfig> => {
    const cacheConfig = config.cache;
    
    if (!cacheConfig || cacheConfig.skipCache || !isCacheable(config)) {
      return config;
    }

    const cacheKey = cacheConfig.key || generateCacheKey(config);
    const ttl = cacheConfig.ttl || DEFAULT_TTL;

    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached && !cacheConfig.forceRefresh) {
        const entry: CacheEntry = JSON.parse(cached);
        
        if (isDataFresh(entry, ttl)) {
          if (__DEV__) {
            console.log(`💾 Cache hit for ${config.method?.toUpperCase()} ${config.url}`);
          }
          
          // Create a mock response from cache
          const mockResponse = {
            data: entry.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          };
          
          // Return a resolved promise to bypass the actual request
          return Promise.resolve(mockResponse) as any;
        }
        
        // If data is stale but we have ETag, add If-None-Match header
        if (entry.etag) {
          config.headers = {
            ...config.headers,
            'If-None-Match': entry.etag,
          };
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Cache read error:', error);
      }
    }

    return config;
  },

  onResponse: async (response: AxiosResponse): Promise<AxiosResponse> => {
    const config = response.config as CacheConfig;
    const cacheConfig = config.cache;
    
    if (!cacheConfig || cacheConfig.skipCache || !isCacheable(config)) {
      return response;
    }

    const cacheKey = cacheConfig.key || generateCacheKey(config);
    
    try {
      const entry: CacheEntry = {
        data: response.data,
        timestamp: Date.now(),
        etag: response.headers.etag,
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      
      if (__DEV__) {
        console.log(`💾 Cached response for ${config.method?.toUpperCase()} ${config.url}`);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Cache write error:', error);
      }
    }

    return response;
  },

  // Helper to configure cache options for specific requests
  withCache: (config: AxiosRequestConfig, options?: {
    ttl?: number;
    key?: string;
    skipCache?: boolean;
    forceRefresh?: boolean;
  }): CacheConfig => {
    return {
      ...config,
      cache: {
        ttl: options?.ttl ?? DEFAULT_TTL,
        key: options?.key,
        skipCache: options?.skipCache ?? false,
        forceRefresh: options?.forceRefresh ?? false,
      },
    };
  },

  // Utility functions
  clearCache: async (pattern?: string): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key: string) => {
        if (!key.startsWith(CACHE_PREFIX)) return false;
        if (pattern) {
          return key.includes(pattern);
        }
        return true;
      });
      
      await AsyncStorage.multiRemove(cacheKeys);
      
      if (__DEV__) {
        console.log(`💾 Cleared ${cacheKeys.length} cache entries`);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Cache clear error:', error);
      }
    }
  },

  getCacheSize: async (): Promise<number> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key: string) => key.startsWith(CACHE_PREFIX));
      return cacheKeys.length;
    } catch (error) {
      if (__DEV__) {
        console.warn('Cache size check error:', error);
      }
      return 0;
    }
  },
};