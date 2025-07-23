import { PayloadAction } from '@reduxjs/toolkit';
import { ErrorState } from '../../components/errors/ErrorStateDisplay';

/**
 * Standardized error state structure for Redux slices
 */
export interface StandardErrorState {
  error: ErrorState | null;
  isLoading: boolean;
  lastError?: ErrorState | null;
  retryCount?: number;
}

/**
 * Creates initial error state for Redux slices
 */
export const createInitialErrorState = (): StandardErrorState => ({
  error: null,
  isLoading: false,
  lastError: null,
  retryCount: 0,
});

/**
 * Standardized error state reducers for Redux slices
 */
export const createErrorStateReducers = <T extends StandardErrorState>() => ({
  /**
   * Clear current error
   */
  clearError: (state: T) => {
    state.error = null;
  },

  /**
   * Clear all error history
   */
  clearAllErrors: (state: T) => {
    state.error = null;
    state.lastError = null;
    state.retryCount = 0;
  },

  /**
   * Set loading state
   */
  setLoading: (state: T, action: PayloadAction<boolean>) => {
    state.isLoading = action.payload;
    if (action.payload) {
      // Clear error when starting new operation
      state.error = null;
    }
  },

  /**
   * Set error state
   */
  setError: (state: T, action: PayloadAction<ErrorState | string>) => {
    const errorState: ErrorState = typeof action.payload === 'string'
      ? { message: action.payload, type: 'unknown', timestamp: Date.now() }
      : { ...action.payload, timestamp: action.payload.timestamp || Date.now() };

    state.error = errorState;
    state.lastError = errorState;
    state.isLoading = false;
    state.retryCount = (state.retryCount || 0) + 1;
  },

  /**
   * Increment retry count
   */
  incrementRetryCount: (state: T) => {
    state.retryCount = (state.retryCount || 0) + 1;
  },

  /**
   * Reset retry count
   */
  resetRetryCount: (state: T) => {
    state.retryCount = 0;
  },
});

/**
 * Standardized async thunk error handling
 */
export const handleAsyncThunkError = (error: any): ErrorState => {
  // Handle different error types
  if (error?.response) {
    // API error with response
    const status = error.response.status;
    const data = error.response.data;

    return {
      message: data?.error?.message || data?.message || 'An error occurred',
      code: data?.error?.code || `HTTP_${status}`,
      type: getErrorTypeFromStatus(status),
      retryable: isRetryableStatus(status),
      timestamp: Date.now(),
    };
  }

  if (error?.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      type: 'network',
      retryable: true,
      timestamp: Date.now(),
    };
  }

  if (error?.userMessage) {
    // Handled error from ErrorHandlingService
    return {
      message: error.userMessage,
      code: error.code || 'HANDLED_ERROR',
      type: error.type || 'unknown',
      retryable: error.retryable !== false,
      timestamp: Date.now(),
    };
  }

  // Generic error
  return {
    message: error?.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    type: 'unknown',
    retryable: true,
    timestamp: Date.now(),
  };
};

/**
 * Get error type from HTTP status code
 */
const getErrorTypeFromStatus = (status: number): ErrorState['type'] => {
  if (status >= 400 && status < 500) {
    if (status === 401) return 'authentication';
    if (status === 422) return 'validation';
    return 'validation';
  }
  if (status >= 500) return 'server';
  return 'unknown';
};

/**
 * Check if HTTP status is retryable
 */
const isRetryableStatus = (status: number): boolean => {
  // Retry on server errors and some client errors
  return status >= 500 || status === 408 || status === 429;
};

/**
 * Standardized extra reducers for async thunks
 */
export const createAsyncThunkExtraReducers = <T extends StandardErrorState, PayloadType = any>(
  asyncThunk: any,
  options?: {
    onPending?: (state: T, action: any) => void;
    onFulfilled?: (state: T, action: PayloadAction<PayloadType>) => void;
    onRejected?: (state: T, action: any) => void;
  }
) => (builder: any) => {
  builder
    .addCase(asyncThunk.pending, (state: T, action: any) => {
      state.isLoading = true;
      state.error = null;
      options?.onPending?.(state, action);
    })
    .addCase(asyncThunk.fulfilled, (state: T, action: PayloadAction<PayloadType>) => {
      state.isLoading = false;
      state.error = null;
      state.retryCount = 0;
      options?.onFulfilled?.(state, action);
    })
    .addCase(asyncThunk.rejected, (state: T, action: any) => {
      state.isLoading = false;
      const errorState = handleAsyncThunkError(action.payload || action.error);
      state.error = errorState;
      state.lastError = errorState;
      state.retryCount = (state.retryCount || 0) + 1;
      options?.onRejected?.(state, action);
    });
};

/**
 * Hook for error state management in components
 */
export const useErrorState = (error: ErrorState | null, clearError: () => void) => {
  const hasError = !!error;
  const isRetryable = error?.retryable !== false;
  const errorMessage = error?.message || '';
  const errorType = error?.type || 'unknown';

  const dismissError = () => {
    clearError();
  };

  return {
    hasError,
    isRetryable,
    errorMessage,
    errorType,
    error,
    dismissError,
  };
};

/**
 * Utility to create error-aware selectors
 */
export const createErrorAwareSelector = <T extends StandardErrorState, R>(
  selector: (state: T) => R,
  errorSelector: (state: T) => ErrorState | null
) => (state: T) => {
  const error = errorSelector(state);
  const data = selector(state);
  
  return {
    data,
    error,
    hasError: !!error,
    isLoading: state.isLoading,
  };
};

export default {
  createInitialErrorState,
  createErrorStateReducers,
  handleAsyncThunkError,
  createAsyncThunkExtraReducers,
  useErrorState,
  createErrorAwareSelector,
};
