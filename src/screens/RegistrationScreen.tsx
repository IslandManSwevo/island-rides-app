import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { LoginScreen } from './LoginScreen';

interface RegistrationScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

/**
 * The design merges sign-in and create-account into one screen (LoginScreen).
 * This route is kept for existing navigate('Registration') callers and simply
 * opens the combined auth screen in create mode.
 */
export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => (
  <LoginScreen navigation={navigation} initialMode="create" />
);

export default RegistrationScreen;
