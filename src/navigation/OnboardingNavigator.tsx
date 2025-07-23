import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { RoleSelectionScreen } from '../screens/onboarding/RoleSelectionScreen';
import IslandSelectionScreen from '../screens/IslandSelectionScreen';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen';
import { OnboardingCompleteScreen } from '../screens/onboarding/OnboardingCompleteScreen';
import { ROUTES } from './routes';
import { OnboardingStackParamList } from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

const defaultScreenOptions = {
  headerShown: false,
  gestureEnabled: false, // Disable back gesture during onboarding
  cardStyleInterpolator: ({ current, layouts }: any) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
    },
  }),
};

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.ONBOARDING_WELCOME}
    >
      <Stack.Screen 
        name={ROUTES.ONBOARDING_WELCOME}
        component={WelcomeScreen}
        options={{
          title: 'Welcome to KeyLo',
        }}
      />
      <Stack.Screen 
        name={ROUTES.ONBOARDING_ROLE_SELECTION}
        component={RoleSelectionScreen}
        options={{
          title: 'Choose Your Role',
        }}
      />
      <Stack.Screen 
        name={ROUTES.ONBOARDING_ISLAND_SELECTION}
        component={IslandSelectionScreen}
        options={{
          title: 'Select Your Island',
        }}
      />
      <Stack.Screen 
        name={ROUTES.ONBOARDING_PERMISSIONS}
        component={PermissionsScreen}
        options={{
          title: 'App Permissions',
        }}
      />
      <Stack.Screen 
        name={ROUTES.ONBOARDING_COMPLETE}
        component={OnboardingCompleteScreen}
        options={{
          title: 'Setup Complete',
          gestureEnabled: false, // Prevent going back from completion
        }}
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
