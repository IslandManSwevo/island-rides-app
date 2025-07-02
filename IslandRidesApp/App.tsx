import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegistrationScreen } from './src/screens/RegistrationScreen';
import { IslandSelectionScreen } from './src/screens/IslandSelectionScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { VehicleDetailScreen } from './src/screens/VehicleDetailScreen';
import { ListVehicleScreen } from './src/screens/ListVehicleScreen';
import { colors } from './src/styles/theme';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
        <Stack.Screen name="Registration" component={RegistrationScreen} options={{ title: 'Create Account' }} />
        <Stack.Screen name="IslandSelection" component={IslandSelectionScreen} options={{ title: 'Select Island' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search Vehicles' }} />
        <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
        <Stack.Screen name="ListVehicle" component={ListVehicleScreen} options={{ title: 'List Your Car' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
