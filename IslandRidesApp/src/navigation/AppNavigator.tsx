import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { IslandProvider } from '../contexts/IslandContext';
import { colors, spacing } from '../styles/theme';

// Import navigators
import { AuthNavigator } from './AuthNavigator';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { HostTabNavigator } from './HostTabNavigator';

// Import shared modal screens
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { BookingConfirmedScreen } from '../screens/BookingConfirmedScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { PayPalConfirmationScreen } from '../screens/PayPalConfirmationScreen';

// Import types and routes
import { RootStackParamList } from './types';
import { ROUTES } from './routes';

const Stack = createStackNavigator<RootStackParamList>();

const defaultScreenOptions = {
  headerShown: false,
  gestureEnabled: true,
  animationEnabled: true,
};

const modalScreenOptions = {
  ...defaultScreenOptions,
  presentation: 'modal' as const,
  headerShown: true,
  headerStyle: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 18,
  },
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, error, currentUser } = useAuth();

  console.log('🧭 AppNavigator: Render state:', {
    isAuthenticated,
    isLoading,
    hasError: !!error,
    userRole: currentUser?.role
  });

  if (isLoading) {
    console.log('⏳ AppNavigator: Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading KeyLo...</Text>
      </View>
    );
  }

  if (error) {
    console.log('❌ AppNavigator: Showing error screen');
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorMessage}>{String(error)}</Text>
      </View>
    );
  }

  const getUserNavigator = () => {
    if (!isAuthenticated) {
      return 'Auth';
    }
    
    const userRole = currentUser?.role;
    if (userRole === 'host' || userRole === 'owner') {
      return 'HostApp';
    }
    
    return 'CustomerApp';
  };

  return (
    <IslandProvider>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Navigation Error:', error, errorInfo);
        }}
      >
        <Stack.Navigator
          screenOptions={defaultScreenOptions}
          initialRouteName={getUserNavigator()}
        >
          {/* Authentication Flow */}
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
          
          {/* Customer App Flow */}
          <Stack.Screen 
            name="CustomerApp" 
            component={CustomerTabNavigator}
            options={{ headerShown: false }}
          />
          
          {/* Host App Flow */}
          <Stack.Screen 
            name="HostApp" 
            component={HostTabNavigator}
            options={{ headerShown: false }}
          />
          
          {/* Shared Modal Screens */}
          <Stack.Group screenOptions={modalScreenOptions}>
            <Stack.Screen
              name={ROUTES.VEHICLE_DETAIL}
              component={VehicleDetailScreen}
              options={({ route }) => ({
                title: route.params?.vehicle?.make 
                  ? `${route.params.vehicle.make} ${route.params.vehicle.model}`
                  : 'Vehicle Details',
              })}
            />
            <Stack.Screen
              name={ROUTES.CHECKOUT}
              component={CheckoutScreen}
              options={{ title: 'Checkout' }}
            />
            <Stack.Screen
              name={ROUTES.BOOKING_CONFIRMED}
              options={{ title: 'Booking Confirmed' }}
            >
              {(props) => <BookingConfirmedScreen {...(props as any)} />}
            </Stack.Screen>
            <Stack.Screen
              name={ROUTES.PAYMENT}
              options={{ title: 'Payment' }}
            >
              {(props) => <PaymentScreen {...(props as any)} />}
            </Stack.Screen>
            <Stack.Screen
              name={ROUTES.PAYPAL_CONFIRMATION}
              options={{ title: 'Payment Confirmation' }}
            >
              {(props) => <PayPalConfirmationScreen {...(props as any)} />}
            </Stack.Screen>
          </Stack.Group>
        </Stack.Navigator>
      </ErrorBoundary>
    </IslandProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export { AppNavigator };
export default AppNavigator;
