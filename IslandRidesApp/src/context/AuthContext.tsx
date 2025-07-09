import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { User, LoginRequest, RegisterRequest, ProfileData } from '../types';

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
    checkAuthenticationStatus();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  const checkAuthenticationStatus = async () => {
    console.log('🔍 AuthContext: Checking authentication status...');
    
    try {
      startOperation();
      setError(null);
      
      const token = await apiService.getToken();
      console.log('🔍 AuthContext: Token exists:', !!token);
      
      if (token) {
        // Validate token by attempting to get current user
        console.log('🔍 AuthContext: Validating token...');
        try {
          const user = await authService.getCurrentUser();
          
          if (user && !isUnmountedRef.current) {
            // Token is valid and user data retrieved successfully
            setCurrentUser(user);
            setIsAuthenticated(true);
            console.log('✅ AuthContext: Token validated successfully for user:', user.email);
          } else {
            // Token exists but is invalid/expired
            console.log('❌ AuthContext: Token validation failed - no user data');
            await apiService.clearToken();
            setIsAuthenticated(false);
            setCurrentUser(null);
          }
        } catch (tokenValidationError) {
          // Token validation failed - token is invalid or expired
          console.log('❌ AuthContext: Token validation failed:', tokenValidationError);
          await apiService.clearToken();
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        // No token exists
        setIsAuthenticated(false);
        setCurrentUser(null);
        console.log('ℹ️ AuthContext: No token found');
      }
    } catch (error) {
      console.error('❌ AuthContext: Auth check error:', error);
      if (!isUnmountedRef.current) {
        setError(error instanceof Error ? error.message : 'Authentication check failed');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } finally {
      endOperation();
      console.log('🔍 AuthContext: Auth check complete');
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    console.log('🔐 AuthContext: Login attempt for:', email);
    
    try {
      startOperation();
      setError(null);
      
      const response = await authService.login({ email, password });
      
      if (!isUnmountedRef.current) {
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        console.log('✅ AuthContext: Login successful for:', response.user.email);
      }
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
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
    console.log('📝 AuthContext: Registration attempt for:', email);
    
    try {
      startOperation();
      setError(null);
      
      const response = await authService.register({ email, password, firstName, lastName, role });
      
      if (!isUnmountedRef.current) {
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        console.log('✅ AuthContext: Registration successful for:', response.user.email);
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration failed:', error);
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
    console.log('🚪 AuthContext: Logout initiated');
    
    try {
      startOperation();
      setError(null);
      
      await authService.logout();
      
      if (!isUnmountedRef.current) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        console.log('✅ AuthContext: Logout successful');
      }
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
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
    console.log('🔄 AuthContext: Refreshing user data...');
    
    try {
      startOperation();
      
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }
      
      // Try to get fresh user data to validate current session
      const user = await authService.getCurrentUser();
      
      if (user && !isUnmountedRef.current) {
        setCurrentUser(user);
        console.log('✅ AuthContext: User data refreshed');
      } else {
        // User data fetch failed, session might be invalid
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('❌ AuthContext: Failed to refresh user:', error);
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
