import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { OnboardingIslandScreen } from '../screens/onboarding/OnboardingIslandScreen';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen';
import { ROUTES } from './routes';
import { OnboardingStackParamList } from './types';

const Stack = createStackNavigator<OnboardingStackParamList>();

// 3-step onboarding (design/02-user-flows.md): Welcome → Island → Notifications.
// Role selection is cut (everyone starts as a guest); location is asked
// contextually at first map use, not during onboarding.
const defaultScreenOptions = {
  headerShown: false,
  gestureEnabled: false,
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
    <Stack.Navigator screenOptions={defaultScreenOptions} initialRouteName={ROUTES.ONBOARDING_WELCOME}>
      <Stack.Screen name={ROUTES.ONBOARDING_WELCOME} component={WelcomeScreen} />
      <Stack.Screen name={ROUTES.ONBOARDING_ISLAND_SELECTION} component={OnboardingIslandScreen} />
      <Stack.Screen name={ROUTES.ONBOARDING_PERMISSIONS} component={PermissionsScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
