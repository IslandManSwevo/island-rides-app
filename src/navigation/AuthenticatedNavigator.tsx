/**
 * Authenticated Navigator with Role-Based Access Control
 * Implements secure navigation for authenticated users with proper route protection
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RouteGuard } from './RouteGuard';
import { useUnifiedAuth } from '../context/UnifiedAuthContext';
import { colors } from '../styles/theme';

// Import screens
import { SearchScreen } from '../screens/SearchScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HostDashboardScreen } from '../screens/HostDashboardScreen';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';
import { FleetManagementScreen } from '../screens/FleetManagementScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { MapScreen } from '../screens/MapScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Customer Tab Navigator
const CustomerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'BookingsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'FavoritesTab') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="SearchTab" 
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
      <Tab.Screen 
        name="BookingsTab" 
        component={MyBookingsScreen}
        options={{ title: 'Bookings' }}
      />
      <Tab.Screen 
        name="FavoritesTab" 
        component={FavoritesScreen}
        options={{ title: 'Favorites' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Host Tab Navigator
const HostTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HostDashboardTab') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'BookingsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HostDashboardTab"
        options={{ title: 'Dashboard' }}
      >
        {() => (
          <RouteGuard requiredRole="host">
            <HostDashboardScreen />
          </RouteGuard>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="SearchTab" 
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
      <Tab.Screen 
        name="BookingsTab" 
        component={MyBookingsScreen}
        options={{ title: 'Bookings' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Owner Tab Navigator
const OwnerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'OwnerDashboardTab') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'FleetTab') {
            iconName = focused ? 'car-sport' : 'car-sport-outline';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="OwnerDashboardTab"
        options={{ title: 'Dashboard' }}
      >
        {() => (
          <RouteGuard requiredRole="owner">
            <OwnerDashboardScreen />
          </RouteGuard>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="FleetTab"
        options={{ title: 'Fleet' }}
      >
        {() => (
          <RouteGuard requiredRole="owner">
            <FleetManagementScreen />
          </RouteGuard>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="SearchTab" 
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Role-based tab navigator selector
const RoleBasedTabNavigator = () => {
  const { user, hasRole } = useUnifiedAuth();

  if (!user) {
    return <CustomerTabNavigator />;
  }

  // Determine which navigator to show based on highest role
  if (hasRole('owner')) {
    return <OwnerTabNavigator />;
  } else if (hasRole('host')) {
    return <HostTabNavigator />;
  } else {
    return <CustomerTabNavigator />;
  }
};

// Main Authenticated Navigator
export const AuthenticatedNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={RoleBasedTabNavigator}
      />
      
      {/* Modal and Detail Screens */}
      <Stack.Screen 
        name="SearchResults" 
        component={SearchResultsScreen}
        options={{ 
          headerShown: true,
          title: 'Search Results',
          presentation: 'card',
        }}
      />
      
      <Stack.Screen 
        name="VehicleDetail" 
        component={VehicleDetailScreen}
        options={{ 
          headerShown: true,
          title: 'Vehicle Details',
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ 
          headerShown: true,
          title: 'Checkout',
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen 
        name="Map" 
        component={MapScreen}
        options={{ 
          headerShown: true,
          title: 'Vehicle Map',
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
};
