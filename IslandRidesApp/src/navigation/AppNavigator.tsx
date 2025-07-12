import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { BookingConfirmedScreen } from '../screens/BookingConfirmedScreen';
import ChatConversationScreen from '../screens/ChatConversationScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { FinancialReportsScreen } from '../screens/FinancialReportsScreen';
import { FleetManagementScreen } from '../screens/FleetManagementScreen';
import IslandSelectionScreen from '../screens/IslandSelectionScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';
import { PaymentHistoryScreen } from '../screens/PaymentHistoryScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { VehiclePerformanceScreen } from '../screens/VehiclePerformanceScreen';
import { WriteReviewScreen } from '../screens/WriteReviewScreen';
import { ROUTES, RootStackParamList } from './routes';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <>
          <Stack.Screen name={ROUTES.ISLAND_SELECTION} component={IslandSelectionScreen} options={{ title: 'Select an Island' }} />
          <Stack.Screen name={ROUTES.SEARCH_RESULTS} component={SearchResultsScreen} options={{ title: 'Available Vehicles' }} />
          <Stack.Screen name={ROUTES.VEHICLE_DETAIL} component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
          <Stack.Screen name={ROUTES.CHECKOUT} component={CheckoutScreen} options={{ title: 'Checkout' }} />
          <Stack.Screen name={ROUTES.BOOKING_CONFIRMED} component={BookingConfirmedScreen} options={{ title: 'Booking Confirmed' }} />
          <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} options={{ title: 'Profile' }} />
          <Stack.Screen name={ROUTES.PAYMENT_HISTORY} component={PaymentHistoryScreen} options={{ title: 'Payment History' }} />
          <Stack.Screen name={ROUTES.CHAT} component={ChatConversationScreen} options={{ title: 'Chat' }} />
          <Stack.Screen name={ROUTES.PAYMENT} component={PaymentScreen} options={{ title: 'Payment' }} />
          <Stack.Screen name={ROUTES.FAVORITES} component={FavoritesScreen} options={{ title: 'Favorites' }} />
          <Stack.Screen name={ROUTES.NOTIFICATION_PREFERENCES} component={NotificationPreferencesScreen} options={{ title: 'Notification Preferences' }} />
          <Stack.Screen name={ROUTES.WRITE_REVIEW} component={WriteReviewScreen} options={{ title: 'Write Review' }} />
          <Stack.Screen name={ROUTES.OWNER_DASHBOARD} component={OwnerDashboardScreen} options={{ title: 'Owner Dashboard' }} />
          <Stack.Screen name={ROUTES.VEHICLE_PERFORMANCE} component={VehiclePerformanceScreen} options={{ title: 'Vehicle Performance' }} />
          <Stack.Screen name={ROUTES.FINANCIAL_REPORTS} component={FinancialReportsScreen} options={{ title: 'Financial Reports' }} />
          <Stack.Screen name={ROUTES.FLEET_MANAGEMENT} component={FleetManagementScreen} options={{ title: 'Fleet Management' }} />
        </>
      ) : (
        <>
          <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} options={{ title: 'Login' }} />
          <Stack.Screen name={ROUTES.REGISTRATION} component={RegistrationScreen} options={{ title: 'Register' }} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;