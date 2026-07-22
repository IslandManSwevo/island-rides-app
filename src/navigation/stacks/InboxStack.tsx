import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InboxScreen } from '../../screens/InboxScreen';
import ChatConversationScreen from '../../screens/ChatConversationScreen';
import { ROUTES } from '../routes';
import { InboxStackParamList } from '../types';
import { colors } from '../../styles/theme';

const Stack = createStackNavigator<InboxStackParamList>();

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

export const InboxStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions} initialRouteName={ROUTES.INBOX}>
      <Stack.Screen
        name={ROUTES.INBOX}
        component={InboxScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={ROUTES.CHAT} options={{ title: 'Chat' }}>
        {(props) => <ChatConversationScreen {...(props as any)} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default InboxStack;
