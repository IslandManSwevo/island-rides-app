import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

// Stack Navigators for each tab
import { SearchStack } from './stacks/SearchStack';
import { BookingsStack } from './stacks/BookingsStack';
import { InboxStack } from './stacks/InboxStack';
import { ProfileStack } from './stacks/ProfileStack';

// Types
import { CustomerTabParamList } from './types';
import { ROUTES } from './routes';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

// Brand rule: the active tab is ink, not coral — color stays reserved
// for actions and prices (design/01-brand-identity.md).
const tabBarOptions = {
  activeTintColor: colors.text,
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
    case ROUTES.EXPLORE_TAB:
      iconName = focused ? 'search' : 'search-outline';
      break;
    case ROUTES.TRIPS_TAB:
      iconName = focused ? 'car' : 'car-outline';
      break;
    case ROUTES.INBOX_TAB:
      iconName = focused ? 'chatbubble' : 'chatbubble-outline';
      break;
    case ROUTES.CUSTOMER_PROFILE_TAB:
      iconName = focused ? 'person' : 'person-outline';
      break;
    default:
      iconName = 'help-outline';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

export const CustomerTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) =>
          getTabBarIcon(route.name, focused, color, size),
        headerShown: false,
        ...tabBarOptions,
      })}
      initialRouteName={ROUTES.EXPLORE_TAB}
    >
      <Tab.Screen
        name={ROUTES.EXPLORE_TAB}
        component={SearchStack}
        options={{
          tabBarLabel: 'Explore',
          tabBarAccessibilityLabel: 'Explore vehicles across the islands',
        }}
      />
      <Tab.Screen
        name={ROUTES.TRIPS_TAB}
        component={BookingsStack}
        options={{
          tabBarLabel: 'Trips',
          tabBarAccessibilityLabel: 'View your trips',
        }}
      />
      <Tab.Screen
        name={ROUTES.INBOX_TAB}
        component={InboxStack}
        options={{
          tabBarLabel: 'Inbox',
          tabBarAccessibilityLabel: 'Messages and notifications',
        }}
      />
      <Tab.Screen
        name={ROUTES.CUSTOMER_PROFILE_TAB}
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'View and edit profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default CustomerTabNavigator;
