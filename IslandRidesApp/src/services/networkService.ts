import { ApiErrorCode, ErrorMeta } from '../types';
import { isAxiosError } from 'axios';
import { notificationService } from './notificationService';

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
}

class NetworkService {
  private static defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffFactor: 2
  };

  static async retryRequest<T>(
    requestFn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: unknown;
    let attempt = 1;
    let delay = retryConfig.delayMs;

    while (attempt <= retryConfig.maxAttempts) {
      try {
        return await requestFn();
      } catch (error: unknown) {
        lastError = error;
        
        // Don't retry on certain error types
        if (isAxiosError(error) && (
            error.response?.status === 401 || // Unauthorized
            error.response?.status === 403 || // Forbidden
            error.response?.status === 422)) { // Validation error
          throw error;
        }

        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        // Show retry notification
        notificationService.warning(`Retrying request (${attempt}/${retryConfig.maxAttempts})...`, {
          duration: delay
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= retryConfig.backoffFactor;
        attempt++;
      }
    }

    throw lastError;
  }

  static isNetworkError(error: unknown): boolean {
    return isAxiosError(error) && !error.response && !!error.request;
  }

  static isServerError(error: unknown): boolean {
    return isAxiosError(error) && !!error.response && error.response.status >= 500;
  }

  static isClientError(error: unknown): boolean {
    return isAxiosError(error) && !!error.response && error.response.status >= 400 && error.response.status < 500;
  }

  static getErrorCode(error: unknown): ApiErrorCode {
    if (this.isNetworkError(error)) {
      return 'NETWORK_ERROR';
    }
    if (this.isServerError(error)) {
      return 'SERVER_ERROR';
    }
    if (isAxiosError(error) && error.response?.data?.code) {
      return error.response.data.code;
    }
    return 'UNKNOWN_ERROR';
  }
}

export default NetworkService;
