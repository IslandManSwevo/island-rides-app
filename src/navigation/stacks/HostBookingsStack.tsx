import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MyBookingsScreen } from '../../screens/MyBookingsScreen';
import { VehicleDetailScreen } from '../../screens/VehicleDetailScreen';
import ChatConversationScreen from '../../screens/ChatConversationScreen';
import { ROUTES } from '../routes';
import { HostBookingsStackParamList } from '../types';
import { colors } from '../../styles/theme';

const Stack = createStackNavigator<HostBookingsStackParamList>();

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

export const HostBookingsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.MY_BOOKINGS}
    >
      <Stack.Screen
        name={ROUTES.MY_BOOKINGS}
        component={MyBookingsScreen}
        options={{
          title: 'Host Bookings',
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
      <Stack.Screen
        name={ROUTES.CHAT}
        options={{
          title: 'Messages',
          headerShown: true,
        }}
      >
        {(props) => <ChatConversationScreen {...(props as any)} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default HostBookingsStack;
