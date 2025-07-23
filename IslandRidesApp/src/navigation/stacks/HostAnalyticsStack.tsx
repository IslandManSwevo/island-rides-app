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
  headerBackTitleVisible: false,
  gestureEnabled: true,
};

export const HostAnalyticsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.VEHICLE_PERFORMANCE}
    >
      <Stack.Screen
        name={ROUTES.VEHICLE_PERFORMANCE}
        options={{
          title: 'Vehicle Performance',
          headerShown: true,
        }}
      >
        {(props) => (
          <ProtectedRoute requiredRole={['host', 'owner']}>
            <VehiclePerformanceScreen {...props} />
          </ProtectedRoute>
        )}
      </Stack.Screen>
      
      <Stack.Screen
        name={ROUTES.FINANCIAL_REPORTS}
        options={{
          title: 'Financial Reports',
          headerShown: true,
        }}
      >
        {(props) => (
          <ProtectedRoute requiredRole={['host', 'owner']}>
            <FinancialReportsScreen {...props} />
          </ProtectedRoute>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default HostAnalyticsStack;
