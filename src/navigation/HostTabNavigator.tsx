import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

// Stack Navigators for each tab
import { HostDashboardStack } from './stacks/HostDashboardStack';
import { VehicleManagementStack } from './stacks/VehicleManagementStack';
import { HostBookingsStack } from './stacks/HostBookingsStack';
import { HostAnalyticsStack } from './stacks/HostAnalyticsStack';

// Types
import { HostTabParamList } from './types';
import { ROUTES } from './routes';

const Tab = createBottomTabNavigator<HostTabParamList>();

const tabBarOptions = {
  activeTintColor: colors.primary,
  inactiveTintColor: colors.textSecondary,
  style: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
  },
  labelStyle: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
};

const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
  let iconName: keyof typeof Ionicons.glyphMap;

  switch (routeName) {
    case ROUTES.HOST_DASHBOARD_TAB:
      iconName = focused ? 'speedometer' : 'speedometer-outline';
      break;
    case ROUTES.HOST_VEHICLES_TAB:
      iconName = focused ? 'car' : 'car-outline';
      break;
    case ROUTES.HOST_BOOKINGS_TAB:
      iconName = focused ? 'calendar' : 'calendar-outline';
      break;
    case ROUTES.HOST_ANALYTICS_TAB:
      iconName = focused ? 'analytics' : 'analytics-outline';
      break;
    default:
      iconName = 'help-outline';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

export const HostTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) =>
          getTabBarIcon(route.name, focused, color, size),
        headerShown: false,
        ...tabBarOptions,
      })}
      initialRouteName={ROUTES.HOST_DASHBOARD_TAB}
    >
      <Tab.Screen
        name={ROUTES.HOST_DASHBOARD_TAB}
        component={HostDashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarAccessibilityLabel: 'Host dashboard overview',
        }}
      />
      <Tab.Screen
        name={ROUTES.HOST_VEHICLES_TAB}
        component={VehicleManagementStack}
        options={{
          tabBarLabel: 'Vehicles',
          tabBarAccessibilityLabel: 'Manage your vehicles',
        }}
      />
      <Tab.Screen
        name={ROUTES.HOST_BOOKINGS_TAB}
        component={HostBookingsStack}
        options={{
          tabBarLabel: 'Bookings',
          tabBarAccessibilityLabel: 'View and manage bookings',
        }}
      />
      <Tab.Screen
        name={ROUTES.HOST_ANALYTICS_TAB}
        component={HostAnalyticsStack}
        options={{
          tabBarLabel: 'Analytics',
          tabBarAccessibilityLabel: 'View performance analytics',
        }}
      />
    </Tab.Navigator>
  );
};

export default HostTabNavigator;
