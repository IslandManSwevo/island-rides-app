import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { BookingConfirmedScreen } from '../screens/BookingConfirmedScreen';
import ChatConversationScreen from '../screens/ChatConversationScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { FinancialReportsScreen } from '../screens/FinancialReportsScreen';
import { FleetManagementScreen } from '../screens/FleetManagementScreen';
import IslandSelectionScreen from '../screens/IslandSelectionScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';
import { HostDashboardScreen } from '../screens/HostDashboardScreen';
import { HostStorefrontScreen } from '../screens/HostStorefrontScreen';
import { PaymentHistoryScreen } from '../screens/PaymentHistoryScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { PayPalConfirmationScreen } from '../screens/PayPalConfirmationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { VehiclePerformanceScreen } from '../screens/VehiclePerformanceScreen';
import { VehicleDocumentManagementScreen } from '../screens/VehicleDocumentManagementScreen';
import { WriteReviewScreen } from '../screens/WriteReviewScreen';
import { ROUTES, RootStackParamList } from './routes';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { colors, typography, spacing } from '../styles/theme';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, error } = useAuth();

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
        screenOptions={{
          headerShown: false, // Let individual screens control their headers
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {/* Public routes available to all users */}
        <Stack.Screen name={ROUTES.HOST_STOREFRONT} component={HostStorefrontScreen} options={{ title: 'Host Profile' }} />
        
        {isAuthenticated ? (
          <>
            <Stack.Screen name={ROUTES.ISLAND_SELECTION} component={IslandSelectionScreen} options={{ title: 'Select an Island' }} />
            <Stack.Screen name={ROUTES.SEARCH} component={SearchScreen} options={{ title: 'Search Vehicles' }} />
            <Stack.Screen name={ROUTES.SEARCH_RESULTS} component={SearchResultsScreen} options={{ title: 'Available Vehicles' }} />
            <Stack.Screen name={ROUTES.VEHICLE_DETAIL} component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
            <Stack.Screen name={ROUTES.CHECKOUT} component={CheckoutScreen} options={{ title: 'Checkout' }} />
            <Stack.Screen name={ROUTES.BOOKING_CONFIRMED} component={BookingConfirmedScreen} options={{ title: 'Booking Confirmed' }} />
            <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} options={{ title: 'Profile' }} />
            <Stack.Screen name={ROUTES.MY_BOOKINGS} component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
            <Stack.Screen name={ROUTES.PAYMENT_HISTORY} component={PaymentHistoryScreen} options={{ title: 'Payment History' }} />
            <Stack.Screen name={ROUTES.CHAT} component={ChatConversationScreen} options={{ title: 'Chat' }} />
            <Stack.Screen name={ROUTES.PAYMENT} component={PaymentScreen} options={{ title: 'Payment' }} />
            <Stack.Screen name={ROUTES.PAYPAL_CONFIRMATION} component={PayPalConfirmationScreen} options={{ title: 'Payment Confirmation' }} />
            <Stack.Screen name={ROUTES.FAVORITES} component={FavoritesScreen} options={{ title: 'Favorites' }} />
            <Stack.Screen name={ROUTES.NOTIFICATION_PREFERENCES} component={NotificationPreferencesScreen} options={{ title: 'Notification Preferences' }} />
            <Stack.Screen name={ROUTES.WRITE_REVIEW} component={WriteReviewScreen} options={{ title: 'Write Review' }} />
            <Stack.Screen name={ROUTES.OWNER_DASHBOARD} component={OwnerDashboardScreen} options={{ title: 'Owner Dashboard' }} />
            <Stack.Screen name={ROUTES.HOST_DASHBOARD} component={HostDashboardScreen} options={{ title: 'Host Dashboard' }} />
            <Stack.Screen name={ROUTES.VEHICLE_PERFORMANCE} component={VehiclePerformanceScreen} options={{ title: 'Vehicle Performance' }} />
            <Stack.Screen name={ROUTES.FINANCIAL_REPORTS} component={FinancialReportsScreen} options={{ title: 'Financial Reports' }} />
            <Stack.Screen name={ROUTES.FLEET_MANAGEMENT} component={FleetManagementScreen} options={{ title: 'Fleet Management' }} />
            <Stack.Screen name={ROUTES.VEHICLE_DOCUMENT_MANAGEMENT} component={VehicleDocumentManagementScreen} options={{ title: 'Vehicle Documents' }} />
          </>
        ) : (
          <>
            <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} options={{ title: 'Login' }} />
            <Stack.Screen name={ROUTES.REGISTRATION} component={RegistrationScreen} options={{ title: 'Register' }} />
          </>
        )}
      </Stack.Navigator>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
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
