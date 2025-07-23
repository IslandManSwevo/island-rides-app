import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../../screens/ProfileScreen';
import { PaymentHistoryScreen } from '../../screens/PaymentHistoryScreen';
import { NotificationPreferencesScreen } from '../../screens/NotificationPreferencesScreen';
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
    </Stack.Navigator>
  );
};

export default ProfileStack;
