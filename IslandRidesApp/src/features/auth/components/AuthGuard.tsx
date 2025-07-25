import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../../../styles/theme';
import { UserRole } from '../../../types';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  allowedRoles?: UserRole[];
  fallbackScreen?: string;
  loadingComponent?: React.ComponentType;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requireVerification = false,
  allowedRoles = ['user', 'host', 'owner', 'admin'],
  fallbackScreen = 'LoginScreen',
  loadingComponent: LoadingComponent,
}) => {
  const navigation = useNavigation();
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      navigation.navigate(fallbackScreen as never);
      return;
    }

    // Check verification requirement
    if (requireVerification && currentUser && !currentUser.isVerified) {
      navigation.navigate('EmailVerificationScreen' as never);
      return;
    }

    // Check role requirement
    if (currentUser && !allowedRoles.includes(currentUser.role)) {
      navigation.navigate('UnauthorizedScreen' as never);
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    currentUser,
    requireAuth,
    requireVerification,
    allowedRoles,
    fallbackScreen,
    navigation,
  ]);

  // Show loading state
  if (isLoading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show children if all checks pass
  if (
    (!requireAuth || isAuthenticated) &&
    (!requireVerification || (currentUser && currentUser.isVerified)) &&
    (!currentUser || allowedRoles.includes(currentUser.role))
  ) {
    return <>{children}</>;
  }

  // Return null while navigation is in progress
  return null;
};