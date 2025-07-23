import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SearchScreen } from '../../screens/SearchScreen';
import { SearchResultsScreen } from '../../screens/SearchResultsScreen';
import { VehicleDetailScreen } from '../../screens/VehicleDetailScreen';
import { ROUTES } from '../routes';
import { SearchStackParamList } from '../types';
import { colors } from '../../styles/theme';

const Stack = createStackNavigator<SearchStackParamList>();

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

export const SearchStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.SEARCH}
    >
      <Stack.Screen
        name={ROUTES.SEARCH}
        component={SearchScreen}
        options={{
          title: 'Find Your Ride',
          headerShown: true,
        }}
      />
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

export default SearchStack;
