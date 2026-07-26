import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { VehiclePerformanceScreen } from '../../screens/VehiclePerformanceScreen';
import { FinancialReportsScreen } from '../../screens/FinancialReportsScreen';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ROUTES } from '../routes';
import { HostAnalyticsStackParamList } from '../types';
import { colors } from '../../styles/theme';

const Stack = createStackNavigator<HostAnalyticsStackParamList>();

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
  headerBackButtonDisplayMode: 'minimal' as const,
  gestureEnabled: true,
};

export const HostAnalyticsStack: React.FC = () => {
  return (
    // Earnings is the tab (design/02-user-flows.md); FinancialReportsScreen is
    // the rebuilt surface on keyloApi.hostEarnings, so it leads. Per-vehicle
    // performance is a push from it, not the landing screen.
    <Stack.Navigator
      id={undefined}
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.FINANCIAL_REPORTS}
    >
      <Stack.Screen
        name={ROUTES.FINANCIAL_REPORTS}
        options={{ headerShown: false }}
      >
        {(props) => (
          <ProtectedRoute requiredRole={['host', 'owner']}>
            <FinancialReportsScreen {...props} />
          </ProtectedRoute>
        )}
      </Stack.Screen>

      <Stack.Screen
        name={ROUTES.VEHICLE_PERFORMANCE}
        options={{
          title: 'Per-vehicle performance',
          headerShown: true,
        }}
      >
        {(props) => (
          <ProtectedRoute requiredRole={['host', 'owner']}>
            <VehiclePerformanceScreen {...props} />
          </ProtectedRoute>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default HostAnalyticsStack;
