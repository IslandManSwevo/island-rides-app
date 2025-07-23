import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

// Stack Navigators for each tab
import { SearchStack } from './stacks/SearchStack';
import { BookingsStack } from './stacks/BookingsStack';
import { FavoritesStack } from './stacks/FavoritesStack';
import { ProfileStack } from './stacks/ProfileStack';

// Types
import { CustomerTabParamList } from './types';
import { ROUTES } from './routes';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

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
    case ROUTES.CUSTOMER_SEARCH_TAB:
      iconName = focused ? 'search' : 'search-outline';
      break;
    case ROUTES.CUSTOMER_BOOKINGS_TAB:
      iconName = focused ? 'calendar' : 'calendar-outline';
      break;
    case ROUTES.CUSTOMER_FAVORITES_TAB:
      iconName = focused ? 'heart' : 'heart-outline';
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
      initialRouteName={ROUTES.CUSTOMER_SEARCH_TAB}
    >
      <Tab.Screen
        name={ROUTES.CUSTOMER_SEARCH_TAB}
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarAccessibilityLabel: 'Search for vehicles',
        }}
      />
      <Tab.Screen
        name={ROUTES.CUSTOMER_BOOKINGS_TAB}
        component={BookingsStack}
        options={{
          tabBarLabel: 'Bookings',
          tabBarAccessibilityLabel: 'View your bookings',
        }}
      />
      <Tab.Screen
        name={ROUTES.CUSTOMER_FAVORITES_TAB}
        component={FavoritesStack}
        options={{
          tabBarLabel: 'Favorites',
          tabBarAccessibilityLabel: 'View favorite vehicles',
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
