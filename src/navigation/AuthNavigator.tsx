import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { OnboardingNavigator } from './OnboardingNavigator';
import { ROUTES } from './routes';
import { AuthStackParamList } from './types';

const Stack = createStackNavigator<AuthStackParamList>();

const defaultScreenOptions = {
  headerShown: false,
  gestureEnabled: true,
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

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.LOGIN}
    >
      <Stack.Screen 
        name={ROUTES.LOGIN}
        component={LoginScreen}
        options={{
          title: 'Welcome to KeyLo',
        }}
      />
      <Stack.Screen 
        name={ROUTES.REGISTRATION}
        component={RegistrationScreen}
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen 
        name={ROUTES.ONBOARDING}
        component={OnboardingNavigator}
        options={{
          title: 'Getting Started',
          gestureEnabled: false, // Prevent back gesture during onboarding
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
