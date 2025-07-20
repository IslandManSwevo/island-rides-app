import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { apiService } from '../../../services/apiService';
import { setAuthToken, clearAuth, selectIsAuthenticated, selectUser } from '../../../store/slices/authSlice';

export const useAuthPersistence = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  
  // Refs to track previous state and prevent multiple dispatches
  const prevIsAuthenticatedRef = useRef<boolean>(isAuthenticated);
  const isTokenRefreshActiveRef = useRef<boolean>(false);
  const isAuthenticatedRef = useRef<boolean>(isAuthenticated);

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

  // Update refs when authentication state changes
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Monitor auth state transitions and handle logout
  useEffect(() => {
    const wasAuthenticated = prevIsAuthenticatedRef.current;
    const isCurrentlyAuthenticated = isAuthenticated;
    
    // Detect logout: was authenticated but now is not
    if (wasAuthenticated && !isCurrentlyAuthenticated) {
      // User logged out, clear stored tokens
      apiService.clearToken().catch(console.warn);
    }
    
    // Update previous state for next comparison
    prevIsAuthenticatedRef.current = isCurrentlyAuthenticated;
  }, [isAuthenticated]);


  // Setup token refresh scheduling
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    
    if (isAuthenticated) {
      // Inline the token refresh logic to avoid dependency on scheduleTokenRefresh
      const refreshInterval = 15 * 60 * 1000; // 15 minutes
      
      intervalId = setInterval(async () => {
        // Use ref to get current authentication state to avoid stale closure
        if (isAuthenticatedRef.current) {
          // Prevent multiple concurrent refresh attempts
          if (isTokenRefreshActiveRef.current) {
            return;
          }
          
          try {
            isTokenRefreshActiveRef.current = true;
            await apiService.refreshToken();
            const newToken = await apiService.getToken();
            if (newToken) {
              dispatch(setAuthToken(newToken));
            }
          } catch (error) {
            console.warn('Token refresh failed:', error);
            // Only dispatch clearAuth if we're still supposed to be authenticated
            // and this isn't already being cleared by another process
            if (isAuthenticatedRef.current) {
              dispatch(clearAuth());
            }
          } finally {
            isTokenRefreshActiveRef.current = false;
          }
        }
      }, refreshInterval);
    }
    
    // Cleanup function to clear intervals when component unmounts or auth state changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Reset refresh flag when cleaning up
      isTokenRefreshActiveRef.current = false;
    };
  }, [isAuthenticated, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset all flags when component unmounts
      isTokenRefreshActiveRef.current = false;
    };
  }, []);

  return {
    initializeAuth,
  };
};