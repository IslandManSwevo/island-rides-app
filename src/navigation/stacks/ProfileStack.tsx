import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../../screens/ProfileScreen';
import { PaymentHistoryScreen } from '../../screens/PaymentHistoryScreen';
import { NotificationPreferencesScreen } from '../../screens/NotificationPreferencesScreen';
import { FavoritesScreen } from '../../screens/FavoritesScreen';
import { SavedSearchesScreen } from '../../screens/SavedSearchesScreen';
import { VehicleDetailScreen } from '../../screens/VehicleDetailScreen';
import { ROUTES } from '../routes';
import { ProfileStackParamList } from '../types';
import { colors } from '../../styles/theme';

const Stack = createStackNavigator<ProfileStackParamList>();

const defaultScreenOptions = {
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
  headerBackTitleVisible: false,
  gestureEnabled: true,
};

const modalScreenOptions = {
  ...defaultScreenOptions,
  presentation: 'modal' as const,
  headerStyle: {
    ...defaultScreenOptions.headerStyle,
    backgroundColor: colors.background,
  },
};

export const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.PROFILE}
    >
      <Stack.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={ROUTES.PAYMENT_HISTORY}
        component={PaymentHistoryScreen}
        options={{
          title: 'Payment History',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={ROUTES.NOTIFICATION_PREFERENCES}
        component={NotificationPreferencesScreen}
        options={{
          ...modalScreenOptions,
          title: 'Notifications',
          headerShown: true,
        }}
      />
      {/* Favorites and saved searches live under Profile in the new IA */}
      <Stack.Screen
        name={ROUTES.FAVORITES}
        options={{ title: 'Favorites', headerShown: true }}
      >
        {(props) => <FavoritesScreen {...(props as any)} />}
      </Stack.Screen>
      <Stack.Screen
        name={ROUTES.SAVED_SEARCHES}
        options={{ title: 'Saved searches', headerShown: true }}
      >
        {(props) => <SavedSearchesScreen {...(props as any)} />}
      </Stack.Screen>
      <Stack.Screen
        name={ROUTES.VEHICLE_DETAIL}
        options={{ title: 'Vehicle' }}
      >
        {(props) => <VehicleDetailScreen {...(props as any)} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default ProfileStack;
