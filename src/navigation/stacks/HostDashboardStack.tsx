import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HostDashboardScreen } from '../../screens/HostDashboardScreen';
import { HostStorefrontScreen } from '../../screens/HostStorefrontScreen';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ROUTES } from '../routes';
import { HostDashboardStackParamList } from '../types';
import { colors } from '../../styles/theme';

const Stack = createStackNavigator<HostDashboardStackParamList>();

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

export const HostDashboardStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.HOST_DASHBOARD}
    >
      <Stack.Screen
        name={ROUTES.HOST_DASHBOARD}
        options={{ headerShown: false }}
      >
        {(props) => (
          <ProtectedRoute requiredRole="host">
            <HostDashboardScreen {...props} />
          </ProtectedRoute>
        )}
      </Stack.Screen>
      
      <Stack.Screen
        name={ROUTES.HOST_STOREFRONT}
        component={HostStorefrontScreen}
        options={{
          title: 'My Storefront',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default HostDashboardStack;
