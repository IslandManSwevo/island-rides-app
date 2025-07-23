import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MyBookingsScreen } from '../../screens/MyBookingsScreen';
import { VehicleDetailScreen } from '../../screens/VehicleDetailScreen';
import ChatConversationScreen from '../../screens/ChatConversationScreen';
import { WriteReviewScreen } from '../../screens/WriteReviewScreen';
import { ROUTES } from '../routes';
import { BookingsStackParamList } from '../types';
import { colors } from '../../styles/theme';

const Stack = createStackNavigator<BookingsStackParamList>();

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

export const BookingsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
      initialRouteName={ROUTES.MY_BOOKINGS}
    >
      <Stack.Screen
        name={ROUTES.MY_BOOKINGS}
        component={MyBookingsScreen}
        options={{
          title: 'My Bookings',
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
      <Stack.Screen
        name={ROUTES.WRITE_REVIEW}
        options={{
          title: 'Write Review',
          headerShown: true,
        }}
      >
        {(props) => <WriteReviewScreen {...(props as any)} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default BookingsStack;
