/**
 * Centralized Error Handling for Frontend
 * Provides consistent error handling patterns across the React Native app
 */

import { Alert } from 'react-native';
import { loggingService } from '../services/LoggingService';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: string;
  context?: string;
}

/**
 * Create a standardized error object
 */
export function createError(
  type: ErrorType,
  message: string,
  options: {
    code?: string;
    statusCode?: number;
    details?: any;
    context?: string;
  } = {}
): AppError {
  return {
    type,
    message,
    code: options.code,
    statusCode: options.statusCode,
    details: options.details,
    context: options.context,
    timestamp: new Date().toISOString()
  };
}

/**
 * Parse API error response into AppError
 */
export function parseApiError(error: any, context?: string): AppError {
  // Network error
  if (!error.response) {
    return createError(ErrorType.NETWORK, 'Network connection failed', {
      context,
      details: { originalError: error.message }
    });
  }

  const { status, data } = error.response;

  // Parse error type based on status code
  let type: ErrorType;
  switch (status) {
    case 400:
      type = ErrorType.VALIDATION;
      break;
    case 401:
      type = ErrorType.AUTHENTICATION;
      break;
    case 403:
      type = ErrorType.AUTHORIZATION;
      break;
    case 404:
      type = ErrorType.NOT_FOUND;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      type = ErrorType.SERVER;
      break;
    default:
      type = ErrorType.UNKNOWN;
  }

  return createError(type, data?.message || data?.error || 'An error occurred', {
    code: data?.code,
    statusCode: status,
    context,
    details: data?.details
  });
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Please check your internet connection and try again.';
    
    case ErrorType.AUTHENTICATION:
      return 'Please log in to continue.';
    
    case ErrorType.AUTHORIZATION:
      return 'You don\'t have permission to perform this action.';
    
    case ErrorType.VALIDATION:
      return error.message || 'Please check your input and try again.';
    
    case ErrorType.NOT_FOUND:
      return 'The requested item could not be found.';
    
    case ErrorType.SERVER:
      return 'Server is temporarily unavailable. Please try again later.';
    
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Show error alert to user
 */
export function showErrorAlert(error: AppError, options: {
  title?: string;
  showRetry?: boolean;
  onRetry?: () => void;
} = {}) {
  const title = options.title || 'Error';
  const message = getUserFriendlyMessage(error);
  
  const buttons = [
    { text: 'OK' }
  ];
  
  if (options.showRetry && options.onRetry) {
    buttons.unshift({ text: 'Retry', onPress: options.onRetry } as any);
  }
  
  Alert.alert(title, message, buttons);
}

/**
 * Handle error with logging and user notification
 */
export function handleError(
  error: any,
  context: string,
  options: {
    showAlert?: boolean;
    alertTitle?: string;
    showRetry?: boolean;
    onRetry?: () => void;
    silent?: boolean;
  } = {}
) {
  const appError = error instanceof Error 
    ? createError(ErrorType.UNKNOWN, error.message, { context, details: { stack: error.stack } })
    : parseApiError(error, context);

  // Log error
  loggingService.error(`Error in ${context}: ${appError.message}`, new Error(appError.message));

  // Show alert if requested
  if (options.showAlert && !options.silent) {
    showErrorAlert(appError, {
      title: options.alertTitle,
      showRetry: options.showRetry,
      onRetry: options.onRetry
    });
  }

  return appError;
}

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Enhanced retry wrapper with exponential backoff and smart retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoffMultiplier?: number;
    context?: string;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    context = 'Operation',
    shouldRetry = isRetryableError
  } = options;

  let lastError: any;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw handleError(error, `${context} (attempt ${attempt}/${maxRetries})`);
      }

      // Log retry attempt
      const errorMessage = error instanceof Error ? error.message : String(error);
      loggingService.error(`${context}.retry: Retry attempt ${attempt}/${maxRetries}: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));

      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Network errors are retryable
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (error.response?.status >= 500) {
    return true;
  }

  // Rate limit errors are retryable
  if (error.response?.status === 429) {
    return true;
  }

  // Timeout errors are retryable
  if (error.code === 'ECONNABORTED' || error.code === 'TIMEOUT') {
    return true;
  }

  return false;
}

/**
 * Safe async wrapper that catches and handles errors
 */
export function safeAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string,
  options: {
    showAlert?: boolean;
    defaultValue?: R;
    onError?: (error: AppError) => void;
  } = {}
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error, context, {
        showAlert: options.showAlert,
        silent: !!options.onError
      });
      
      if (options.onError) {
        options.onError(appError);
      }
      
      return options.defaultValue;
    }
  };
}

/**
 * Validation error helper
 */
export function createValidationError(field: string, message: string): AppError {
  return createError(ErrorType.VALIDATION, message, {
    code: 'VALIDATION_ERROR',
    details: { field }
  });
}

/**
 * Check if error is of specific type
 */
export function isErrorType(error: AppError, type: ErrorType): boolean {
  return error.type === type;
}

/**
 * Check if error requires authentication
 */
export function requiresAuth(error: AppError): boolean {
  return error.type === ErrorType.AUTHENTICATION;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: AppError): boolean {
  return [ErrorType.NETWORK, ErrorType.SERVER].includes(error.type);
}

/**
 * Circuit breaker pattern implementation
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>, context: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw createError(
          ErrorType.SERVER,
          'Service temporarily unavailable',
          { context, code: 'CIRCUIT_BREAKER_OPEN' }
        );
      } else {
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

// Global circuit breaker instance
export const globalCircuitBreaker = new CircuitBreaker();

/**
 * Error analytics for tracking and monitoring
 */
export class ErrorAnalytics {
  static logError(error: AppError, context: string) {
    // Log to console in development
    if (__DEV__) {
      console.error(`[${context}]`, error);
    }

    // Track error metrics
    this.trackErrorMetrics(error, context);

    // TODO: Send to analytics service in production
    // analytics.track('Error Occurred', {
    //   errorType: error.type,
    //   errorCode: error.code,
    //   context,
    //   timestamp: error.timestamp
    // });
  }

  static logErrorResolution(error: AppError, resolution: string) {
    if (__DEV__) {
      console.log(`[Error Resolved] ${error.type}: ${resolution}`);
    }

    // TODO: Send to analytics service
    // analytics.track('Error Resolved', {
    //   errorType: error.type,
    //   resolution,
    //   timestamp: new Date().toISOString()
    // });
  }

  private static trackErrorMetrics(error: AppError, context: string) {
    // Simple in-memory error tracking for development
    if (typeof window !== 'undefined') {
      const errorKey = `error_${error.type}_${context}`;
      const currentCount = parseInt(localStorage.getItem(errorKey) || '0');
      localStorage.setItem(errorKey, (currentCount + 1).toString());
    }
  }

  static getErrorStats(): Record<string, number> {
    if (typeof window === 'undefined') return {};

    const stats: Record<string, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('error_')) {
        stats[key] = parseInt(localStorage.getItem(key) || '0');
      }
    }
    return stats;
  }

  static clearErrorStats() {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('error_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}
