import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ExploreScreen } from '../../screens/ExploreScreen';
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
  headerBackButtonDisplayMode: 'minimal' as const,
  gestureEnabled: true,
};

export const SearchStack: React.FC = () => {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.SEARCH}
    >
      {/* Search, SearchResults and Map all merged into Explore
          (design/03-screen-inventory.md) — one screen, filters in a sheet. */}
      <Stack.Screen
        name={ROUTES.SEARCH}
        component={ExploreScreen as never}
        options={{ headerShown: false }}
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
