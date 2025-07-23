import {
  createError,
  handleError,
  parseApiError,
  getUserFriendlyMessage,
  safeAsync,
  withRetry,
  isRetryableError,
  globalCircuitBreaker,
  ErrorAnalytics,
  ErrorType,
  AppError
} from '../errorHandler';

// Mock dependencies
jest.mock('../../../services/LoggingService', () => ({
  loggingService: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset circuit breaker
    globalCircuitBreaker.reset();
    // Clear error analytics
    ErrorAnalytics.clearErrorStats();
  });

  describe('createError', () => {
    it('should create error with all properties', () => {
      const error = createError(
        ErrorType.VALIDATION,
        'Test error',
        {
          context: 'TestContext',
          code: 'TEST_ERROR',
          details: { field: 'email' }
        }
      );

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toBe('Test error');
      expect(error.context).toBe('TestContext');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ field: 'email' });
      expect(error.timestamp).toBeDefined();
    });

    it('should create error with minimal properties', () => {
      const error = createError(ErrorType.NETWORK, 'Network error');

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.message).toBe('Network error');
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('parseApiError', () => {
    it('should parse network error', () => {
      const networkError = new Error('Network Error');
      (networkError as any).code = 'NETWORK_ERROR';

      const appError = parseApiError(networkError, 'TestContext');

      expect(appError.type).toBe(ErrorType.NETWORK);
      expect(appError.context).toBe('TestContext');
    });

    it('should parse HTTP error responses', () => {
      const httpError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };

      const appError = parseApiError(httpError, 'TestContext');

      expect(appError.type).toBe(ErrorType.AUTHENTICATION);
      expect(appError.message).toBe('Unauthorized');
    });

    it('should handle unknown errors', () => {
      const unknownError = 'Something went wrong';

      const appError = parseApiError(unknownError, 'TestContext');

      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.message).toBe('Something went wrong');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly messages for different error types', () => {
      const networkError = createError(ErrorType.NETWORK, 'Connection failed');
      const authError = createError(ErrorType.AUTHENTICATION, 'Invalid token');
      const validationError = createError(ErrorType.VALIDATION, 'Email is required');

      expect(getUserFriendlyMessage(networkError)).toBe(
        'Please check your internet connection and try again.'
      );
      expect(getUserFriendlyMessage(authError)).toBe(
        'Please log in to continue.'
      );
      expect(getUserFriendlyMessage(validationError)).toBe(
        'Email is required'
      );
    });
  });

  describe('safeAsync', () => {
    it('should return result on success', async () => {
      const successFn = safeAsync(
        async () => 'success',
        'TestContext'
      );

      const result = await successFn();
      expect(result).toBe('success');
    });

    it('should return default value on error', async () => {
      const errorFn = safeAsync(
        async () => {
          throw new Error('Test error');
        },
        'TestContext',
        { defaultValue: 'default' }
      );

      const result = await errorFn();
      expect(result).toBe('default');
    });

    it('should call onError callback', async () => {
      const onError = jest.fn();
      const errorFn = safeAsync(
        async () => {
          throw new Error('Test error');
        },
        'TestContext',
        { onError }
      );

      await errorFn();
      expect(onError).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(operation, {
        maxRetries: 3,
        context: 'TestContext'
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, {
        maxRetries: 3,
        delay: 10,
        context: 'TestContext',
        shouldRetry: () => true
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Validation error'));

      await expect(
        withRetry(operation, {
          maxRetries: 3,
          context: 'TestContext',
          shouldRetry: () => false
        })
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      
      await withRetry(operation, {
        maxRetries: 2,
        delay: 100,
        backoffMultiplier: 2,
        context: 'TestContext',
        shouldRetry: () => true
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have waited at least 100ms + 200ms = 300ms
      expect(duration).toBeGreaterThan(250);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      expect(isRetryableError({ code: 'NETWORK_ERROR' })).toBe(true);
      expect(isRetryableError({ response: { status: 500 } })).toBe(true);
      expect(isRetryableError({ response: { status: 429 } })).toBe(true);
      expect(isRetryableError({ code: 'TIMEOUT' })).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(isRetryableError({ response: { status: 400 } })).toBe(false);
      expect(isRetryableError({ response: { status: 401 } })).toBe(false);
      expect(isRetryableError({ response: { status: 404 } })).toBe(false);
    });
  });

  describe('Circuit Breaker', () => {
    it('should allow requests when closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await globalCircuitBreaker.execute(operation, 'TestContext');

      expect(result).toBe('success');
      expect(globalCircuitBreaker.getState().state).toBe('CLOSED');
    });

    it('should open after threshold failures', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      // Fail 5 times to reach threshold
      for (let i = 0; i < 5; i++) {
        try {
          await globalCircuitBreaker.execute(operation, 'TestContext');
        } catch (error) {
          // Expected to fail
        }
      }

      expect(globalCircuitBreaker.getState().state).toBe('OPEN');

      // Next request should fail immediately
      await expect(
        globalCircuitBreaker.execute(operation, 'TestContext')
      ).rejects.toThrow('Service temporarily unavailable');
    });

    it('should transition to half-open after timeout', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      // Force circuit breaker to open
      for (let i = 0; i < 5; i++) {
        try {
          await globalCircuitBreaker.execute(operation, 'TestContext');
        } catch (error) {
          // Expected to fail
        }
      }

      expect(globalCircuitBreaker.getState().state).toBe('OPEN');

      // Mock time passage
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61000); // 61 seconds later

      // Next request should attempt to execute (half-open state)
      operation.mockResolvedValueOnce('success');
      
      const result = await globalCircuitBreaker.execute(operation, 'TestContext');
      
      expect(result).toBe('success');
      expect(globalCircuitBreaker.getState().state).toBe('CLOSED');

      jest.restoreAllMocks();
    });
  });

  describe('ErrorAnalytics', () => {
    it('should track error metrics', () => {
      const error = createError(ErrorType.NETWORK, 'Network error');
      
      ErrorAnalytics.logError(error, 'TestContext');
      
      const stats = ErrorAnalytics.getErrorStats();
      expect(stats['error_NETWORK_TestContext']).toBe(1);
    });

    it('should accumulate error counts', () => {
      const error = createError(ErrorType.VALIDATION, 'Validation error');
      
      ErrorAnalytics.logError(error, 'TestContext');
      ErrorAnalytics.logError(error, 'TestContext');
      ErrorAnalytics.logError(error, 'TestContext');
      
      const stats = ErrorAnalytics.getErrorStats();
      expect(stats['error_VALIDATION_TestContext']).toBe(3);
    });

    it('should clear error stats', () => {
      const error = createError(ErrorType.SERVER, 'Server error');
      
      ErrorAnalytics.logError(error, 'TestContext');
      
      let stats = ErrorAnalytics.getErrorStats();
      expect(Object.keys(stats)).toHaveLength(1);
      
      ErrorAnalytics.clearErrorStats();
      
      stats = ErrorAnalytics.getErrorStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });
});
