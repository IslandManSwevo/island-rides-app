import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { FavoritesScreen } from '../../screens/FavoritesScreen';
import { VehicleDetailScreen } from '../../screens/VehicleDetailScreen';
import { ROUTES } from '../routes';
import { FavoritesStackParamList } from '../types';
import { colors } from '../../styles/theme';

const Stack = createStackNavigator<FavoritesStackParamList>();

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

export const FavoritesStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.FAVORITES}
    >
      <Stack.Screen
        name={ROUTES.FAVORITES}
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
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

export default FavoritesStack;
