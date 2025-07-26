/**
 * Unified Authentication Context
 * Replaces the dual authentication system with a single, secure JWT-based approach
 * Integrates with UnifiedAuthService for centralized authentication management
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { unifiedAuthService, AuthState, AuthEventListener } from '../services/auth/UnifiedAuthService';
import { User, AuthResponse, LoginRequest, RegisterRequest, UserRole } from '../types';
import { loggingService } from '../services/LoggingService';

interface AuthContextValue {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: Date | null;
  
  // Authentication actions
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  
  // Role and permission checks
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  
  // Utility functions
  updateActivity: () => void;
  getCurrentToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const UnifiedAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => unifiedAuthService.getAuthState());

  useEffect(() => {
    // Initialize the auth service
    const initializeAuth = async () => {
      try {
        await unifiedAuthService.waitForInitialization();
        setAuthState(unifiedAuthService.getAuthState());
      } catch (error) {
        loggingService.error('Failed to initialize auth service', error instanceof Error ? error : undefined);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const authListener: AuthEventListener = {
      onAuthStateChanged: (newState: AuthState) => {
        setAuthState(newState);
      },
      onTokenRefreshed: (token: string) => {
        loggingService.info('Token refreshed in context');
      },
      onAuthError: (error) => {
        loggingService.error('Auth error in context', error);
      },
    };

    const unsubscribe = unifiedAuthService.addListener(authListener);

    return () => {
      unsubscribe();
    };
  }, []);

  // Authentication actions
  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      loggingService.info('AuthContext: Login attempt', { email: credentials.email });
      const response = await unifiedAuthService.login(credentials);
      loggingService.info('AuthContext: Login successful', { userId: response.user.id });
      return response;
    } catch (error) {
      loggingService.error('AuthContext: Login failed', error instanceof Error ? error : undefined);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      loggingService.info('AuthContext: Registration attempt', { email: userData.email });
      const response = await unifiedAuthService.register(userData);
      loggingService.info('AuthContext: Registration successful', { userId: response.user.id });
      return response;
    } catch (error) {
      loggingService.error('AuthContext: Registration failed', error instanceof Error ? error : undefined);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      loggingService.info('AuthContext: Logout initiated');
      await unifiedAuthService.logout();
      loggingService.info('AuthContext: Logout successful');
    } catch (error) {
      loggingService.error('AuthContext: Logout failed', error instanceof Error ? error : undefined);
      throw error;
    }
  };

  // Role and permission checks
  const hasRole = (role: UserRole): boolean => {
    return unifiedAuthService.hasRole(role);
  };

  const hasPermission = (permission: string): boolean => {
    return unifiedAuthService.hasPermission(permission);
  };

  // Utility functions
  const updateActivity = (): void => {
    unifiedAuthService.updateActivity();
  };

  const getCurrentToken = (): string | null => {
    return unifiedAuthService.getCurrentToken();
  };

  const contextValue: AuthContextValue = {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    lastActivity: authState.lastActivity,
    
    // Actions
    login,
    register,
    logout,
    
    // Role/Permission checks
    hasRole,
    hasPermission,
    
    // Utilities
    updateActivity,
    getCurrentToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the unified authentication context
 */
export const useUnifiedAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

/**
 * Hook for role-based conditional rendering
 */
export const useRoleCheck = (requiredRole: UserRole) => {
  const { hasRole, isAuthenticated } = useUnifiedAuth();
  return isAuthenticated && hasRole(requiredRole);
};

/**
 * Hook for permission-based conditional rendering
 */
export const usePermissionCheck = (permission: string) => {
  const { hasPermission, isAuthenticated } = useUnifiedAuth();
  return isAuthenticated && hasPermission(permission);
};

/**
 * Higher-order component for role-based access control
 */
export const withRoleAccess = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole,
  fallbackComponent?: React.ComponentType<P>
) => {
  return (props: P) => {
    const hasAccess = useRoleCheck(requiredRole);
    
    if (!hasAccess) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      return null;
    }
    
    return <Component {...props} />;
  };
};

/**
 * Higher-order component for permission-based access control
 */
export const withPermissionAccess = <P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  fallbackComponent?: React.ComponentType<P>
) => {
  return (props: P) => {
    const hasAccess = usePermissionCheck(permission);
    
    if (!hasAccess) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      return null;
    }
    
    return <Component {...props} />;
  };
};

// Export the context for advanced usage
export { AuthContext };
