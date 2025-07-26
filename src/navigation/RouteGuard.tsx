/**
 * Route Guard Component
 * Implements role-based access control for navigation routes
 * Resolves the missing route protection vulnerability
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUnifiedAuth } from '../context/UnifiedAuthContext';
import { UserRole } from '../types';
import { colors, typography, spacing } from '../styles/theme';
import { StandardButton } from '../components/templates/StandardButton';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
  requireAuth?: boolean;
  fallbackComponent?: React.ComponentType;
  redirectTo?: string;
}

interface AccessDeniedProps {
  requiredRole?: UserRole;
  requiredPermission?: string;
  onNavigateBack?: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ 
  requiredRole, 
  requiredPermission, 
  onNavigateBack 
}) => {
  const getMessage = () => {
    if (requiredRole) {
      return `This feature requires ${requiredRole} access level.`;
    }
    if (requiredPermission) {
      return `You don't have permission to access this feature.`;
    }
    return 'Access denied.';
  };

  return (
    <View style={styles.accessDeniedContainer}>
      <View style={styles.accessDeniedContent}>
        <Text style={styles.accessDeniedIcon}>🔒</Text>
        <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
        <Text style={styles.accessDeniedMessage}>{getMessage()}</Text>
        
        {requiredRole && (
          <Text style={styles.accessDeniedHint}>
            Contact your administrator to upgrade your account.
          </Text>
        )}
        
        <StandardButton
          title="Go Back"
          onPress={onNavigateBack}
          variant="outline"
          style={styles.backButton}
        />
      </View>
    </View>
  );
};

const LoginRequired: React.FC<{ onNavigateToLogin?: () => void }> = ({ onNavigateToLogin }) => {
  return (
    <View style={styles.accessDeniedContainer}>
      <View style={styles.accessDeniedContent}>
        <Text style={styles.accessDeniedIcon}>🔐</Text>
        <Text style={styles.accessDeniedTitle}>Login Required</Text>
        <Text style={styles.accessDeniedMessage}>
          You need to be logged in to access this feature.
        </Text>
        
        <StandardButton
          title="Login"
          onPress={onNavigateToLogin}
          variant="primary"
          style={styles.loginButton}
        />
      </View>
    </View>
  );
};

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requireAuth = true,
  fallbackComponent: FallbackComponent,
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    hasPermission 
  } = useUnifiedAuth();

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return <LoginRequired />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return <AccessDenied requiredRole={requiredRole} />;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return <AccessDenied requiredPermission={requiredPermission} />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Higher-order component for protecting screens
 */
export const withRouteGuard = <P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: Omit<RouteGuardProps, 'children'>
) => {
  return (props: P) => (
    <RouteGuard {...guardOptions}>
      <Component {...props} />
    </RouteGuard>
  );
};

/**
 * Hook for programmatic access control checks
 */
export const useAccessControl = () => {
  const { isAuthenticated, hasRole, hasPermission } = useUnifiedAuth();

  const canAccess = (options: {
    requireAuth?: boolean;
    requiredRole?: UserRole;
    requiredPermission?: string;
  }) => {
    const { requireAuth = true, requiredRole, requiredPermission } = options;

    if (requireAuth && !isAuthenticated) {
      return false;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return false;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return false;
    }

    return true;
  };

  return { canAccess };
};

/**
 * Route configuration with access control
 */
export interface ProtectedRoute {
  name: string;
  component: React.ComponentType<any>;
  requiredRole?: UserRole;
  requiredPermission?: string;
  requireAuth?: boolean;
  fallbackComponent?: React.ComponentType;
}

/**
 * Utility function to create protected route configurations
 */
export const createProtectedRoute = (
  name: string,
  component: React.ComponentType<any>,
  options: {
    requiredRole?: UserRole;
    requiredPermission?: string;
    requireAuth?: boolean;
    fallbackComponent?: React.ComponentType;
  } = {}
): ProtectedRoute => {
  return {
    name,
    component,
    ...options,
  };
};

/**
 * Role-based route definitions for KeyLo app
 */
export const PROTECTED_ROUTES = {
  // User routes (default access)
  SEARCH: createProtectedRoute('Search', () => null),
  VEHICLE_DETAIL: createProtectedRoute('VehicleDetail', () => null),
  MY_BOOKINGS: createProtectedRoute('MyBookings', () => null),
  FAVORITES: createProtectedRoute('Favorites', () => null),
  PROFILE: createProtectedRoute('Profile', () => null),

  // Host routes
  HOST_DASHBOARD: createProtectedRoute('HostDashboard', () => null, { 
    requiredRole: 'host' 
  }),
  HOST_STOREFRONT: createProtectedRoute('HostStorefront', () => null, { 
    requiredRole: 'host' 
  }),

  // Owner routes
  OWNER_DASHBOARD: createProtectedRoute('OwnerDashboard', () => null, { 
    requiredRole: 'owner' 
  }),
  FLEET_MANAGEMENT: createProtectedRoute('FleetManagement', () => null, { 
    requiredRole: 'owner' 
  }),
  FINANCIAL_REPORTS: createProtectedRoute('FinancialReports', () => null, { 
    requiredRole: 'owner' 
  }),

  // Admin routes
  ADMIN_DASHBOARD: createProtectedRoute('AdminDashboard', () => null, { 
    requiredRole: 'admin' 
  }),
  USER_MANAGEMENT: createProtectedRoute('UserManagement', () => null, { 
    requiredRole: 'admin' 
  }),
};

const styles = StyleSheet.create({
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.large,
  },
  accessDeniedContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  accessDeniedIcon: {
    fontSize: 64,
    marginBottom: spacing.medium,
  },
  accessDeniedTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  accessDeniedMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.medium,
  },
  accessDeniedHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
    fontStyle: 'italic',
  },
  backButton: {
    marginTop: spacing.medium,
  },
  loginButton: {
    marginTop: spacing.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
