/**
 * RoleBasedView - Advanced role-based UI components extending ProtectedRoute
 * Part of Initiative 5: Role-Based UI Components (Week 2)
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../features/auth/hooks/useAuth';
import { usePermissions, UserRole } from './ProtectedRoute';
import { colors, spacing, typography } from '../styles/theme';

interface RoleBasedViewProps {
  customer?: ReactNode;
  host?: ReactNode;
  owner?: ReactNode;
  admin?: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
  showRoleIndicator?: boolean;
  requireAuth?: boolean;
}

/**
 * RoleBasedView - Renders different content based on user role
 * 
 * Example usage:
 * <RoleBasedView
 *   customer={<CustomerDashboard />}
 *   host={<HostDashboard />}
 *   owner={<OwnerDashboard />}
 *   admin={<AdminPanel />}
 *   fallback={<AccessDenied />}
 * />
 */
export const RoleBasedView: React.FC<RoleBasedViewProps> = ({
  customer,
  host,
  owner,
  admin,
  fallback,
  loading,
  showRoleIndicator = false,
  requireAuth = true
}) => {
  const { isAuthenticated, currentUser: user, isLoading } = useAuth();
  const { userRole } = usePermissions();

  // Show loading state
  if (isLoading) {
    return loading ? <>{loading}</> : <DefaultLoadingComponent />;
  }

  // Check authentication requirement
  if (requireAuth && (!isAuthenticated || !user)) {
    return fallback ? <>{fallback}</> : <DefaultFallbackComponent />;
  }

  // Render role indicator if requested
  const RoleIndicator = showRoleIndicator ? (
    <View style={styles.roleIndicator}>
      <Text style={styles.roleText}>
        {getRoleDisplayName(userRole)}
      </Text>
    </View>
  ) : null;

  // Render based on user role
  const renderContent = () => {
    switch (userRole) {
      case 'customer':
        return customer;
      case 'host':
        return host;
      case 'owner':
        return owner;
      case 'admin':
        return admin;
      default:
        return fallback;
    }
  };

  const content = renderContent();

  return (
    <View style={styles.container}>
      {RoleIndicator}
      {content}
    </View>
  );
};

interface ConditionalRenderProps {
  children: ReactNode;
  roles: UserRole | UserRole[];
  fallback?: ReactNode;
  inverse?: boolean; // Show content when user DOESN'T have the role
}

/**
 * ConditionalRender - Conditionally render content based on user roles
 * 
 * Example usage:
 * <ConditionalRender roles={['host', 'owner']}>
 *   <HostOnlyFeature />
 * </ConditionalRender>
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  roles,
  fallback = null,
  inverse = false
}) => {
  const { hasRole } = usePermissions();
  
  const hasRequiredRole = hasRole(roles);
  const shouldRender = inverse ? !hasRequiredRole : hasRequiredRole;

  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

interface RoleSpecificButtonProps {
  customer?: { text: string; onPress: () => void; style?: any };
  host?: { text: string; onPress: () => void; style?: any };
  owner?: { text: string; onPress: () => void; style?: any };
  admin?: { text: string; onPress: () => void; style?: any };
  fallback?: { text: string; onPress: () => void; style?: any };
}

/**
 * RoleSpecificButton - Renders different buttons based on user role
 * 
 * Example usage:
 * <RoleSpecificButton
 *   customer={{ text: "Rent Vehicle", onPress: () => navigate('Booking') }}
 *   host={{ text: "Manage Fleet", onPress: () => navigate('HostDashboard') }}
 *   owner={{ text: "View Analytics", onPress: () => navigate('Analytics') }}
 * />
 */
export const RoleSpecificButton: React.FC<RoleSpecificButtonProps> = ({
  customer,
  host,
  owner,
  admin,
  fallback
}) => {
  const { userRole } = usePermissions();

  const getButtonConfig = () => {
    switch (userRole) {
      case 'customer': return customer;
      case 'host': return host;
      case 'owner': return owner;
      case 'admin': return admin;
      default: return fallback;
    }
  };

  const buttonConfig = getButtonConfig();

  if (!buttonConfig) {
    return null;
  }

  return (
    <View style={[styles.button, buttonConfig.style]}>
      <Text 
        style={styles.buttonText}
        onPress={buttonConfig.onPress}
      >
        {buttonConfig.text}
      </Text>
    </View>
  );
};

interface RoleBasedNavigationProps {
  children: ReactNode;
  customerRoutes?: string[];
  hostRoutes?: string[];
  ownerRoutes?: string[];
  adminRoutes?: string[];
  currentRoute: string;
  fallback?: ReactNode;
}

/**
 * RoleBasedNavigation - Controls navigation access based on user role
 * 
 * Example usage:
 * <RoleBasedNavigation
 *   currentRoute="HostDashboard"
 *   hostRoutes={['HostDashboard', 'VehicleManagement']}
 *   ownerRoutes={['OwnerDashboard', 'Analytics', 'HostDashboard']}
 *   fallback={<NavigationDenied />}
 * >
 *   <HostDashboardScreen />
 * </RoleBasedNavigation>
 */
export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  children,
  customerRoutes = [],
  hostRoutes = [],
  ownerRoutes = [],
  adminRoutes = [],
  currentRoute,
  fallback
}) => {
  const { userRole } = usePermissions();

  const getAllowedRoutes = (): string[] => {
    switch (userRole) {
      case 'customer': return customerRoutes;
      case 'host': return [...customerRoutes, ...hostRoutes];
      case 'owner': return [...customerRoutes, ...hostRoutes, ...ownerRoutes];
      case 'admin': return [...customerRoutes, ...hostRoutes, ...ownerRoutes, ...adminRoutes];
      default: return [];
    }
  };

  const allowedRoutes = getAllowedRoutes();
  const isRouteAllowed = allowedRoutes.includes(currentRoute);

  if (!isRouteAllowed) {
    return fallback ? <>{fallback}</> : <DefaultNavigationDenied />;
  }

  return <>{children}</>;
};

// Additional hook for advanced role checking
export const useRoleBasedFeatures = () => {
  const { userRole, hasRole } = usePermissions();

  const features = {
    canRentVehicles: hasRole(['customer', 'host', 'owner', 'admin']),
    canListVehicles: hasRole(['host', 'owner', 'admin']),
    canManageFleet: hasRole(['owner', 'admin']),
    canViewAnalytics: hasRole(['owner', 'admin']),
    canManageUsers: hasRole(['admin']),
    canAccessHostFeatures: hasRole(['host', 'owner', 'admin']),
    canAccessOwnerFeatures: hasRole(['owner', 'admin']),
    canAccessAdminFeatures: hasRole(['admin']),
    
    // Business-specific features
    canSetPricing: hasRole(['host', 'owner', 'admin']),
    canApproveBookings: hasRole(['host', 'owner', 'admin']),
    canManageCalendar: hasRole(['host', 'owner', 'admin']),
    canViewDetailedMetrics: hasRole(['owner', 'admin']),
    canConfigureSettings: hasRole(['admin']),
  };

  const userTier = {
    isBasicUser: userRole === 'customer',
    isBusinessUser: hasRole(['host', 'owner']),
    isPowerUser: hasRole(['owner', 'admin']),
    isSystemAdmin: userRole === 'admin'
  };

  return {
    userRole,
    features,
    userTier,
    hasRole
  };
};

// Helper function to get role display name
function getRoleDisplayName(role?: UserRole): string {
  switch (role) {
    case 'customer': return 'Customer';
    case 'host': return 'Host';
    case 'owner': return 'Business Owner';
    case 'admin': return 'Administrator';
    default: return 'Guest';
  }
}

// Default components
const DefaultLoadingComponent: React.FC = () => (
  <View style={styles.defaultContainer}>
    <Text style={styles.defaultText}>Loading user permissions...</Text>
  </View>
);

const DefaultFallbackComponent: React.FC = () => (
  <View style={styles.defaultContainer}>
    <Text style={styles.defaultTitle}>Authentication Required</Text>
    <Text style={styles.defaultText}>
      Please log in to access this content.
    </Text>
  </View>
);

const DefaultNavigationDenied: React.FC = () => (
  <View style={styles.defaultContainer}>
    <Text style={styles.defaultTitle}>Access Restricted</Text>
    <Text style={styles.defaultText}>
      You don't have permission to access this page.
    </Text>
  </View>
);

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  roleIndicator: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  roleText: {
    color: colors.white,
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  defaultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.offWhite,
  },
  defaultTitle: {
    fontSize: typography.heading2.fontSize,
    fontWeight: 'bold',
    color: colors.darkGrey,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  defaultText: {
    fontSize: typography.body.fontSize,
    color: colors.lightGrey,
    textAlign: 'center',
  },
});

export default RoleBasedView;