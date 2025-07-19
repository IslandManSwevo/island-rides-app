import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { apiService } from '../../../services/apiService';
import { setAuthToken, clearAuth, selectIsAuthenticated, selectUser } from '../../../store/slices/authSlice';

export const useAuthPersistence = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // Initialize auth state from stored tokens
  const initializeAuth = useCallback(async () => {
    try {
      const token = await apiService.getToken();
      if (token) {
        dispatch(setAuthToken(token));
        
        // Optionally verify token is still valid
        // This could be done by making a lightweight API call
        // await apiService.get('/api/auth/verify');
      }
    } catch (error) {
      // Token is invalid, clear auth state
      console.warn('Failed to initialize auth from stored token:', error);
      dispatch(clearAuth());
      await apiService.clearToken();
    }
  }, [dispatch]);

  // Monitor auth state and persist tokens
  useEffect(() => {
    if (!isAuthenticated && user) {
      // User logged out, clear stored tokens
      apiService.clearToken().catch(console.warn);
    }
  }, [isAuthenticated, user]);

  // Auto-refresh token before expiration
  const scheduleTokenRefresh = useCallback(() => {
    // Implementation would depend on your token structure
    // This is a basic example
    const refreshInterval = 15 * 60 * 1000; // 15 minutes
    
    const intervalId = setInterval(async () => {
      if (isAuthenticated) {
        try {
          await apiService.refreshToken();
          const newToken = await apiService.getToken();
          if (newToken) {
            dispatch(setAuthToken(newToken));
          }
        } catch (error) {
          console.warn('Token refresh failed:', error);
          dispatch(clearAuth());
        }
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, dispatch]);

  // Setup token refresh scheduling
  useEffect(() => {
    if (isAuthenticated) {
      return scheduleTokenRefresh();
    }
  }, [isAuthenticated, scheduleTokenRefresh]);

  return {
    initializeAuth,
  };
};