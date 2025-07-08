import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import IslandSelectionScreen from '../screens/IslandSelectionScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { BookingConfirmedScreen } from '../screens/BookingConfirmedScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PaymentHistoryScreen } from '../screens/PaymentHistoryScreen';
import ChatConversationScreen from '../screens/ChatConversationScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { NotificationPreferencesScreen } from '../screens/NotificationPreferencesScreen';
import { WriteReviewScreen } from '../screens/WriteReviewScreen';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';
import { VehiclePerformanceScreen } from '../screens/VehiclePerformanceScreen';
import { FinancialReportsScreen } from '../screens/FinancialReportsScreen';
import { FleetManagementScreen } from '../screens/FleetManagementScreen';
import { ROUTES, RootStackParamList } from './routes';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
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

export default AppNavigator;