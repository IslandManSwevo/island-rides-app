import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { TripCheckInPanel } from '../components/TripCheckInPanel';

interface CheckInParams {
  bookingId: string;
  phase: 'check_in' | 'check_out';
  vehicleName: string;
  driveSide: 'LHD' | 'RHD';
  hostName?: string;
  otherPartyDone?: boolean;
}

interface TripCheckInScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  route: RouteProp<{ TripCheckIn: CheckInParams }, 'TripCheckIn'>;
}

/**
 * Standalone check-in route — design/mockups/08-trip-checkin.html.
 *
 * The design's primary entry point is now the bottom sheet on Trip Detail
 * (11-trip-detail.html); this full-screen push survives as the deep-link target
 * and the host-side entry from their own bookings stack. Both render the same
 * `TripCheckInPanel`.
 */
export const TripCheckInScreen: React.FC<TripCheckInScreenProps> = ({ navigation, route }) => (
  <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
    <TripCheckInPanel {...route.params} onDone={() => navigation.goBack()} />
  </SafeAreaView>
);

export default TripCheckInScreen;
