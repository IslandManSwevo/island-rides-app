import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../features/auth/hooks/useAuth';
import { colors, spacing, typography } from '../styles/theme';

export type UserRole = 'customer' | 'host' | 'owner' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallbackComponent?: React.ComponentType;
}

/**
 * ProtectedRoute component that handles role-based access control
 * 
 * @param children - The component to render if access is granted
 * @param requiredRole - Single role or array of roles that can access this route
 * @param fallbackComponent - Component to render if access is denied
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackComponent: FallbackComponent = UnauthorizedScreen,
}) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  // User must be authenticated
  if (!isAuthenticated || !currentUser) {
    return <FallbackComponent />;
  }

  // If no specific role is required, just check authentication
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Check if user has required role
  const userRole = currentUser.role as UserRole;
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  if (!allowedRoles.includes(userRole)) {
    return <FallbackComponent />;
  }

  // User has required permissions
  return <>{children}</>;
};

/**
 * Default unauthorized screen component
 */
const UnauthorizedScreen: React.FC = () => {
  return (
    <View style={styles.unauthorizedContainer}>
      <Text style={styles.unauthorizedTitle}>Access Denied</Text>
      <Text style={styles.unauthorizedMessage}>
        You don't have permission to access this screen.
      </Text>
      <Text style={styles.unauthorizedSubtext}>
        Please contact support if you believe this is an error.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
  loadingText: {
    fontSize: typography.body.fontSize,
    color: colors.lightGrey,
    marginTop: spacing.md,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    padding: spacing.lg,
  },
  unauthorizedTitle: {
    fontSize: typography.heading1.fontSize,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  unauthorizedMessage: {
    fontSize: typography.body.fontSize,
    color: colors.darkGrey,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  unauthorizedSubtext: {
    fontSize: typography.caption.fontSize,
    color: colors.lightGrey,
    textAlign: 'center',
  },
});

/**
 * Hook for checking user permissions in components
 */
export const usePermissions = () => {
  const { currentUser, isAuthenticated } = useAuth();

  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!isAuthenticated || !currentUser) return false;
    
    const userRole = currentUser.role as UserRole;
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    return allowedRoles.includes(userRole);
  };

  const isOwner = (): boolean => hasRole('owner');
  const isHost = (): boolean => hasRole('host');
  const isCustomer = (): boolean => hasRole('customer');
  const isAdmin = (): boolean => hasRole('admin');
  const isHostOrOwner = (): boolean => hasRole(['host', 'owner']);

  return {
    hasRole,
    isOwner,
    isHost,
    isCustomer,
    isAdmin,
    isHostOrOwner,
    userRole: currentUser?.role as UserRole,
  };
};

export default ProtectedRoute;