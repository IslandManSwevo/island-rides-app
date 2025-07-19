import { AxiosError, isAxiosError } from 'axios';
import { notificationService } from '../notificationService';
import { loggingService } from '../LoggingService';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServerError,
  NetworkError,
  UnknownError,
} from './AppError';

export class ErrorHandlingService {
  /**
   * Handles API errors and converts them to appropriate AppError instances
   */
  static handleApiError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (isAxiosError(error)) {
      if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new ValidationError(
            data.message || 'Invalid request data',
            error,
            { status, data }
          );
        case 401:
          return new AuthenticationError(
            'Authentication required',
            error,
            { status, data }
          );
        case 403:
          return new AuthorizationError(
            'Access forbidden',
            error,
            { status, data }
          );
        case 404:
          return new NotFoundError(
            'Resource not found',
            error,
            { status, data }
          );
        case 422:
          return new ValidationError(
            data.message || 'Validation failed',
            error,
            { status, data, validationErrors: data.errors }
          );
        case 429:
          return new ServerError(
            'Too many requests. Please try again later.',
            error,
            { status, data }
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new ServerError(
            'Server error occurred',
            error,
            { status, data }
          );
        default:
          return new UnknownError(
            `Unexpected server response: ${status}`,
            error,
            { status, data }
          );
      }
    } else if (error.request) {
      // Network error
      return new NetworkError(
        'Network request failed',
        error,
        { request: error.request }
      );
    } else {
      // Other error
      return new UnknownError(
        error.message || 'An unexpected error occurred',
        error
      );
    }
  } else if (error instanceof Error) {
      return new UnknownError(
        error.message || 'An unexpected error occurred',
        error
      );
    } else {
      return new UnknownError(
        String(error) || 'An unexpected error occurred'
      );
    }
  }

  /**
   * Shows user-friendly error notification
   */
  static showUserFriendlyError(error: AppError, options?: {
    duration?: number;
    showDetails?: boolean;
  }) {
    const { duration = 5000, showDetails = false } = options || {};
    
    notificationService.error(error.userMessage, {
      title: error.title,
      duration,
      action: error.recoveryAction,
      // Show technical details in development
      persistent: showDetails && __DEV__,
    });

    // Log the detailed error for debugging
    if (__DEV__) {
      console.error('Error details:', error.toJSON());
    }
  }

  /**
   * Logs error with appropriate severity
   */
  static logError(error: AppError, context?: string) {
    const errorData = {
      ...error.toJSON(),
      context,
      timestamp: new Date().toISOString(),
    };

    try {
      loggingService.error(
        `${context ? `[${context}] ` : ''}${error.message}`,
        error.originalError || error,
        errorData
      );
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      console.error('Original error:', errorData);
    }
  }

  /**
   * Handles error with comprehensive reporting and user notification
   */
  static handleError(
    error: unknown,
    context?: string,
    options?: {
      showNotification?: boolean;
      logError?: boolean;
      notificationOptions?: {
        duration?: number;
        showDetails?: boolean;
      };
    }
  ): AppError {
    const {
      showNotification = true,
      logError = true,
      notificationOptions,
    } = options || {};

    const appError = this.handleApiError(error);

    if (logError) {
      this.logError(appError, context);
    }

    if (showNotification) {
      this.showUserFriendlyError(appError, notificationOptions);
    }

    return appError;
  }

  /**
   * Wraps async operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
    options?: {
      showNotification?: boolean;
      logError?: boolean;
      retryCount?: number;
      retryDelay?: number;
    }
  ): Promise<T> {
    const {
      showNotification = true,
      logError = true,
      retryCount = 0,
      retryDelay = 1000,
    } = options || {};

    let lastError: unknown;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 408, 429
        if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
          if (error.response.status !== 408 && error.response.status !== 429) {
            break;
          }
        }

        // If we have more retries, wait before retrying
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
      }
    }

    // All retries failed, handle the error
    throw this.handleError(lastError, context, {
      showNotification,
      logError,
    });
  }

  /**
   * Creates a safe error boundary function
   */
  static createErrorBoundary(context: string) {
    return (error: unknown, errorInfo?: unknown) => {
      const appError = this.handleApiError(error);
      
      this.logError(appError, `ErrorBoundary:${context}`);
      
      // Don't show notification for error boundary catches
      // as they're usually handled by the UI
      
      console.error(`Error boundary caught error in ${context}:`, {
        error: appError.toJSON(),
        errorInfo,
      });
    };
  }

  /**
   * Validates and normalizes error responses
   */
  static isRetryableError(error: AppError): boolean {
    return error instanceof NetworkError || 
           error instanceof ServerError ||
           (typeof error.metadata?.status === 'number' && [408, 429].includes(error.metadata.status));
  }

  /**
   * Gets error severity level
   */
  static getErrorSeverity(error: AppError): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof NetworkError) return 'medium';
    if (error instanceof ValidationError) return 'low';
    if (error instanceof AuthenticationError) return 'medium';
    if (error instanceof AuthorizationError) return 'medium';
    if (error instanceof NotFoundError) return 'low';
    if (error instanceof ServerError) return 'high';
    return 'critical';
  }
}