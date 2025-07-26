import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { colors } from '../styles/theme';

// Import original screens (preserved as fallbacks)
import { SearchScreen } from '../screens/SearchScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { MapScreen } from '../screens/MapScreen';

// Import enhanced screens
import { EnhancedHomeScreen } from '../screens/enhanced/EnhancedHomeScreen';

// Import navigation types and routes
import { RootStackParamList, ROUTES } from './routes';
import { linking } from './linking';

/**
 * Enhanced App Navigator
 * 
 * This navigator provides enhanced navigation experiences when feature flags
 * are enabled. It conditionally renders enhanced screens while preserving
 * original screens as fallbacks.
 * 
 * BROWNFIELD SAFETY:
 * - Only renders enhanced screens when feature flags are enabled
 * - Falls back to original screens when flags are disabled
 * - Preserves all existing navigation patterns and routes
 * - Can be instantly rolled back via Epic 1 procedures
 */

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/**
 * Enhanced Search Stack
 * 
 * Conditionally renders enhanced home screen or original search screen
 * based on ENHANCED_HOME_SCREEN feature flag.
 */
const EnhancedSearchStack: React.FC = () => {
  const isEnhancedHomeEnabled = useFeatureFlag('ENHANCED_HOME_SCREEN');

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {/* Conditional home screen rendering */}
      <Stack.Screen
        name={ROUTES.SEARCH}
        component={isEnhancedHomeEnabled ? EnhancedHomeScreen : SearchScreen}
        options={{
          title: isEnhancedHomeEnabled ? 'KeyLo' : 'Find Your Ride',
          headerShown: true,
        }}
      />
      
      {/* Existing screens remain unchanged */}
      <Stack.Screen
        name={ROUTES.SEARCH_RESULTS}
        component={SearchResultsScreen}
        options={{
          title: 'Search Results',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name={ROUTES.VEHICLE_DETAIL}
        component={VehicleDetailScreen}
        options={({ route }) => ({
          title: route.params?.vehicle?.make 
            ? `${route.params.vehicle.make} ${route.params.vehicle.model}`
            : 'Vehicle Details',
          headerShown: true,
        })}
      />
    </Stack.Navigator>
  );
};

/**
 * Enhanced Customer Tab Navigator
 * 
 * Provides enhanced tab navigation with conditional rendering
 * based on feature flags.
 */
const EnhancedCustomerTabNavigator: React.FC = () => {
  const isOptimizedNavigationEnabled = useFeatureFlag('OPTIMIZED_NAVIGATION');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
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
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: isOptimizedNavigationEnabled ? 65 : 60, // Slightly taller for enhanced navigation
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="SearchTab"
        component={EnhancedSearchStack}
        options={{
          tabBarLabel: isOptimizedNavigationEnabled ? 'Home' : 'Search',
        }}
      />
      
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      
      <Tab.Screen
        name="BookingsTab"
        component={SearchScreen} // Placeholder - would be BookingsScreen
        options={{
          tabBarLabel: 'Bookings',
        }}
      />
      
      <Tab.Screen
        name="ProfileTab"
        component={SearchScreen} // Placeholder - would be ProfileScreen
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Enhanced Main Navigator
 * 
 * Root navigator that handles authentication flow and main app navigation
 * with enhanced features when flags are enabled.
 */
const EnhancedMainNavigator: React.FC = () => {
  const isOptimizedNavigationEnabled = useFeatureFlag('OPTIMIZED_NAVIGATION');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: isOptimizedNavigationEnabled, // Enhanced gestures when optimized
      }}
    >
      {/* Authentication screens would go here */}
      
      {/* Main app navigation */}
      <Stack.Screen
        name="CustomerApp"
        component={EnhancedCustomerTabNavigator}
        options={{
          headerShown: false,
        }}
      />
      
      {/* Modal screens and other navigation would go here */}
    </Stack.Navigator>
  );
};

/**
 * Enhanced App Navigator
 * 
 * Main enhanced navigation component that wraps the entire app
 * with enhanced navigation features when flags are enabled.
 */
export const EnhancedAppNavigator: React.FC = () => {
  const isOptimizedNavigationEnabled = useFeatureFlag('OPTIMIZED_NAVIGATION');

  return (
    <NavigationContainer
      linking={linking}
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.error,
        },
      }}
      documentTitle={{
        formatter: (options, route) => {
          const routeName = route?.name ?? 'KeyLo';
          return isOptimizedNavigationEnabled 
            ? `KeyLo - ${routeName}` 
            : `KeyLo Bahamas - ${routeName}`;
        },
      }}
    >
      <EnhancedMainNavigator />
    </NavigationContainer>
  );
};

export default EnhancedAppNavigator;
