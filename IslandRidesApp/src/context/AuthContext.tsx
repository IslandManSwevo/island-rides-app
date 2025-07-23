import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { User, LoginRequest, RegisterRequest, ProfileData } from '../types';
import { loggingService } from '../services/LoggingService';

interface AuthContextType {
  // State
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track concurrent async operations to prevent race conditions
  const loadingOperationsRef = useRef(0);
  const isUnmountedRef = useRef(false);

  // Helper function to manage loading state with operation counting
  const startOperation = () => {
    loadingOperationsRef.current += 1;
    if (loadingOperationsRef.current === 1) {
      setIsLoading(true);
    }
  };

  const endOperation = () => {
    loadingOperationsRef.current = Math.max(0, loadingOperationsRef.current - 1);
    if (loadingOperationsRef.current === 0 && !isUnmountedRef.current) {
      setIsLoading(false);
    }
  };

  // Check authentication status on app start
  useEffect(() => {
    console.log('🔍 AuthContext: Initializing authentication check on startup');
    setError(null); // Explicitly clear any error state
    
    checkAuthenticationStatus();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  const checkAuthenticationStatus = async () => {
    loggingService.info('AuthContext: Checking authentication status');
    console.log('🔍 AuthContext: Starting authentication check...');
    
    try {
      startOperation();
      setError(null);
      
      const token = await apiService.getToken();
      loggingService.info('AuthContext: Token exists', { hasToken: !!token });
      console.log('🔑 AuthContext: Token check result:', { hasToken: !!token, tokenLength: token?.length || 0 });
      
      if (token) {
        // Validate token by attempting to get current user
        loggingService.info('AuthContext: Validating token');
        console.log('✅ AuthContext: Token found, validating...');
        try {
          const user = await authService.getCurrentUser();
          console.log('👤 AuthContext: User data received:', { userExists: !!user, userEmail: user?.email });
          
          if (user && !isUnmountedRef.current) {
            // Token is valid and user data retrieved successfully
            setCurrentUser(user);
            setIsAuthenticated(true);
            loggingService.info('AuthContext: Token validated successfully', { userEmail: user.email });
            console.log('🎉 AuthContext: Authentication successful!', { userEmail: user.email });
          } else {
            // Token exists but is invalid/expired
            loggingService.warn('AuthContext: Token validation failed - no user data');
            console.log('❌ AuthContext: Token validation failed - clearing token');
            await apiService.clearToken();
            setIsAuthenticated(false);
            setCurrentUser(null);
          }
        } catch (tokenValidationError) {
          // Token validation failed - token is invalid or expired
          loggingService.warn('AuthContext: Token validation failed', { error: tokenValidationError });
          console.log('❌ AuthContext: Token validation error:', tokenValidationError);
          await apiService.clearToken();
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        // No token exists
        setIsAuthenticated(false);
        setCurrentUser(null);
        loggingService.info('AuthContext: No token found');
        console.log('🚫 AuthContext: No token found - user not authenticated');
      }
    } catch (error) {
      loggingService.error('AuthContext: Auth check error', error instanceof Error ? error : undefined);
      console.log('💥 AuthContext: Authentication check error:', error);
      if (!isUnmountedRef.current) {
        setError(error instanceof Error ? error.message : 'Authentication check failed');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } finally {
      endOperation();
      loggingService.info('AuthContext: Auth check complete');
      console.log('🏁 AuthContext: Authentication check complete');
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    loggingService.info('AuthContext: Login attempt', { email });
    
    try {
      startOperation();
      setError(null);
      
      const response = await authService.login({ email, password });
      
      if (!isUnmountedRef.current) {
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        loggingService.info('AuthContext: Login successful', { userEmail: response.user.email });
      }
    } catch (error) {
      loggingService.error('AuthContext: Login failed', error instanceof Error ? error : undefined);
      if (!isUnmountedRef.current) {
        setError(error instanceof Error ? error.message : 'Login failed');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      throw error; // Re-throw so UI can handle it
    } finally {
      endOperation();
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    role: string = 'customer'
  ): Promise<void> => {
    loggingService.info('AuthContext: Registration attempt', { email });
    
    try {
      startOperation();
      setError(null);
      
      const response = await authService.register({ email, password, firstName, lastName, role });
      
      if (!isUnmountedRef.current) {
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        loggingService.info('AuthContext: Registration successful', { userEmail: response.user.email });
      }
    } catch (error) {
      loggingService.error('AuthContext: Registration failed', error instanceof Error ? error : undefined);
      if (!isUnmountedRef.current) {
        setError(error instanceof Error ? error.message : 'Registration failed');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      throw error; // Re-throw so UI can handle it
    } finally {
      endOperation();
    }
  };

  const logout = async (): Promise<void> => {
    loggingService.info('AuthContext: Logout initiated');
    
    try {
      startOperation();
      setError(null);
      
      await authService.logout();
      
      if (!isUnmountedRef.current) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        loggingService.info('AuthContext: Logout successful');
      }
    } catch (error) {
      loggingService.error('AuthContext: Logout error', error instanceof Error ? error : undefined);
      // Even if logout fails on server, clear local state
      if (!isUnmountedRef.current) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setError(error instanceof Error ? error.message : 'Logout failed');
      }
    } finally {
      endOperation();
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const refreshUser = async (): Promise<void> => {
    loggingService.info('AuthContext: Refreshing user data');
    
    try {
      startOperation();
      
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }
      
      // Try to get fresh user data to validate current session
      const user = await authService.getCurrentUser();
      
      if (user && !isUnmountedRef.current) {
        setCurrentUser(user);
        loggingService.info('AuthContext: User data refreshed');
      } else {
        // User data fetch failed, session might be invalid
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      loggingService.error('AuthContext: Failed to refresh user', error instanceof Error ? error : undefined);
      // If refresh fails, might be due to expired token
      if (!isUnmountedRef.current) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        await apiService.clearToken();
      }
      throw error;
    } finally {
      endOperation();
    }
  };

  const updateUserProfile = async (profileData: Partial<User>): Promise<void> => {
    const startOperation = () => {
      setIsLoading(true);
      setError(null);
    };

    const endOperation = () => {
      setIsLoading(false);
    };

    try {
      startOperation();

      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Update user profile via API
      const updatedUser = await apiService.put<User>(`/api/users/${currentUser.id}`, profileData);
      setCurrentUser(updatedUser);

      loggingService.info('User profile updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      loggingService.error('Profile update failed', error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      endOperation();
    }
  };

  const value: AuthContextType = {
    // State
    isAuthenticated,
    currentUser,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    clearError,
    refreshUser,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
