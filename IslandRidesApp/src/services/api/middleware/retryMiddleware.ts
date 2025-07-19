import { AxiosError, AxiosRequestConfig } from 'axios';

interface RetryConfig extends AxiosRequestConfig {
  __retryCount?: number;
  __maxRetries?: number;
  __retryDelay?: number;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

const isRetryableError = (error: AxiosError): boolean => {
  // Don't retry client errors (4xx) except for specific cases
  if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
    // Retry these specific 4xx errors
    return [408, 429].includes(error.response.status);
  }

  // Retry network errors and server errors (5xx)
  return !error.response || (error.response.status >= 500);
};

const calculateDelay = (retryCount: number, baseDelay: number): number => {
  // Exponential backoff with jitter
  const delay = baseDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000;
  return delay + jitter;
};

export const retryMiddleware = {
  onResponseError: async (error: AxiosError): Promise<any> => {
    const config = error.config as RetryConfig;
    
    if (!config || !isRetryableError(error)) {
      return Promise.reject(error);
    }

    const maxRetries = config.__maxRetries ?? DEFAULT_MAX_RETRIES;
    const retryDelay = config.__retryDelay ?? DEFAULT_RETRY_DELAY;
    const retryCount = config.__retryCount ?? 0;

    if (retryCount >= maxRetries) {
      if (__DEV__) {
        console.warn(`🔄 Max retries (${maxRetries}) exceeded for ${config.method?.toUpperCase()} ${config.url}`);
      }
      return Promise.reject(error);
    }

    const newRetryCount = retryCount + 1;
    const delay = calculateDelay(newRetryCount, retryDelay);

    if (__DEV__) {
      console.log(`🔄 Retrying request ${newRetryCount}/${maxRetries} in ${delay}ms: ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, delay));

    // Update retry config
    config.__retryCount = newRetryCount;

    // Re-import axios to avoid circular dependency
    const { default: axios } = await import('axios');
    
    try {
      const response = await axios(config);
      return response;
    } catch (retryError) {
      return retryMiddleware.onResponseError(retryError as AxiosError);
    }
  },

  // Helper to configure retry options for specific requests
  withRetry: (config: AxiosRequestConfig, options?: {
    maxRetries?: number;
    retryDelay?: number;
  }): RetryConfig => {
    return {
      ...config,
      __maxRetries: options?.maxRetries ?? DEFAULT_MAX_RETRIES,
      __retryDelay: options?.retryDelay ?? DEFAULT_RETRY_DELAY,
      __retryCount: 0,
    };
  },
};