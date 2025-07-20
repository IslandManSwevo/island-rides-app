import React, { lazy, Suspense, useMemo } from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { ROUTES, RootStackParamList } from './routes';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { colors, typography, spacing } from '../styles/theme';

// Lazy load screens for better performance
const BookingConfirmedScreen = lazy(() => import('../screens/BookingConfirmedScreen').then(module => ({ default: module.BookingConfirmedScreen })));
const ChatConversationScreen = lazy(() => import('../screens/ChatConversationScreen'));
const CheckoutScreen = lazy(() => import('../screens/CheckoutScreen').then(module => ({ default: module.CheckoutScreen })));
const FavoritesScreen = lazy(() => import('../screens/FavoritesScreen').then(module => ({ default: module.FavoritesScreen })));
const FinancialReportsScreen = lazy(() => import('../screens/FinancialReportsScreen').then(module => ({ default: module.FinancialReportsScreen })));
const FleetManagementScreen = lazy(() => import('../screens/FleetManagementScreen').then(module => ({ default: module.FleetManagementScreen })));
const IslandSelectionScreen = lazy(() => import('../screens/IslandSelectionScreen'));
const LoginScreen = lazy(() => import('../screens/LoginScreen').then(module => ({ default: module.LoginScreen })));
const MyBookingsScreen = lazy(() => import('../screens/MyBookingsScreen').then(module => ({ default: module.MyBookingsScreen })));
const NotificationPreferencesScreen = lazy(() => import('../screens/NotificationPreferencesScreen').then(module => ({ default: module.NotificationPreferencesScreen })));
const OwnerDashboardScreen = lazy(() => import('../screens/OwnerDashboardScreen').then(module => ({ default: module.OwnerDashboardScreen })));
const HostDashboardScreen = lazy(() => import('../screens/HostDashboardScreen').then(module => ({ default: module.HostDashboardScreen })));
const HostStorefrontScreen = lazy(() => import('../screens/HostStorefrontScreen').then(module => ({ default: module.HostStorefrontScreen })));
const PaymentHistoryScreen = lazy(() => import('../screens/PaymentHistoryScreen').then(module => ({ default: module.PaymentHistoryScreen })));
const PaymentScreen = lazy(() => import('../screens/PaymentScreen').then(module => ({ default: module.PaymentScreen })));
const PayPalConfirmationScreen = lazy(() => import('../screens/PayPalConfirmationScreen').then(module => ({ default: module.PayPalConfirmationScreen })));
const ProfileScreen = lazy(() => import('../screens/ProfileScreen').then(module => ({ default: module.ProfileScreen })));
const RegistrationScreen = lazy(() => import('../screens/RegistrationScreen').then(module => ({ default: module.RegistrationScreen })));
const SearchResultsScreen = lazy(() => import('../screens/SearchResultsScreen').then(module => ({ default: module.SearchResultsScreen })));
const SearchScreen = lazy(() => import('../screens/SearchScreen').then(module => ({ default: module.SearchScreen })));
const VehicleDetailScreen = lazy(() => import('../screens/VehicleDetailScreen').then(module => ({ default: module.VehicleDetailScreen })));
const VehiclePerformanceScreen = lazy(() => import('../screens/VehiclePerformanceScreen').then(module => ({ default: module.VehiclePerformanceScreen })));
const VehicleDocumentManagementScreen = lazy(() => import('../screens/VehicleDocumentManagementScreen').then(module => ({ default: module.VehicleDocumentManagementScreen })));
const WriteReviewScreen = lazy(() => import('../screens/WriteReviewScreen').then(module => ({ default: module.WriteReviewScreen })));

const Stack = createStackNavigator<RootStackParamList>();

// Loading component for lazy-loaded screens
const ScreenLoader: React.FC = () => (
  <View style={styles.screenLoader}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

// Wrapper component for lazy-loaded screens
const LazyScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<ScreenLoader />}>
    {children}
  </Suspense>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, error } = useAuth();

  // Memoize screen options for better performance
  const defaultScreenOptions = useMemo(() => ({
    headerShown: false,
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    animationEnabled: true,
    cardStyle: { backgroundColor: colors.background },
  }), []);

  const modalScreenOptions = useMemo(() => ({
    ...defaultScreenOptions,
    cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
    gestureDirection: 'vertical' as const,
  }), [defaultScreenOptions]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading KeyLo...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorMessage}>{String(error)}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('🚨 Navigation Error:', error);
        console.error('Error Info:', errorInfo);
      }}
    >
      <Stack.Navigator
        screenOptions={defaultScreenOptions}
      >
        {/* Public routes available to all users */}
        <Stack.Screen 
          name={ROUTES.HOST_STOREFRONT} 
          options={defaultScreenOptions}
        >
          {(props) => (
            <LazyScreen>
              <HostStorefrontScreen {...props} />
            </LazyScreen>
          )}
        </Stack.Screen>
        
        {isAuthenticated ? (
          <>
            <Stack.Screen 
              name={ROUTES.ISLAND_SELECTION} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <IslandSelectionScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.SEARCH} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <SearchScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.SEARCH_RESULTS} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <SearchResultsScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.VEHICLE_DETAIL} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <VehicleDetailScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.CHECKOUT} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <CheckoutScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.BOOKING_CONFIRMED} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <BookingConfirmedScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.PROFILE} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <ProfileScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.MY_BOOKINGS} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <MyBookingsScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.PAYMENT_HISTORY} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <PaymentHistoryScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.CHAT} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <ChatConversationScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.PAYMENT} 
              options={modalScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <PaymentScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.PAYPAL_CONFIRMATION} 
              options={modalScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <PayPalConfirmationScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.FAVORITES} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <FavoritesScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.NOTIFICATION_PREFERENCES} 
              options={modalScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <NotificationPreferencesScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.WRITE_REVIEW} 
              options={modalScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <WriteReviewScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.OWNER_DASHBOARD} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <OwnerDashboardScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.HOST_DASHBOARD} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <HostDashboardScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.VEHICLE_PERFORMANCE} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <VehiclePerformanceScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.FINANCIAL_REPORTS} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <FinancialReportsScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.FLEET_MANAGEMENT} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <FleetManagementScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.VEHICLE_DOCUMENT_MANAGEMENT} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <VehicleDocumentManagementScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen 
              name={ROUTES.LOGIN} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <LoginScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name={ROUTES.REGISTRATION} 
              options={defaultScreenOptions}
            >
              {(props) => (
                <LazyScreen>
                  <RegistrationScreen {...props} />
                </LazyScreen>
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  screenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    ...typography.heading3,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default AppNavigator;
