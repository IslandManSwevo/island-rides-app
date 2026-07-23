import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Card, Chip, DisplayText, VehicleImage } from '../components/ui';
import { keyloApi, ApiBooking, formatDollars, primaryPhotoUrl } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type MyBookingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyBookings'>;

interface MyBookingsScreenProps {
  navigation: MyBookingsScreenNavigationProp;
}

type TripFilter = 'upcoming' | 'active' | 'past';

const FILTERS: { id: TripFilter; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'active', label: 'Active' },
  { id: 'past', label: 'Past' },
];

const inFilter = (b: ApiBooking, f: TripFilter): boolean => {
  if (f === 'active') return b.status === 'active';
  if (f === 'upcoming') return b.status === 'pending' || b.status === 'confirmed';
  return ['completed', 'reviewed', 'cancelled', 'declined', 'expired'].includes(b.status);
};

const dayRange = (b: ApiBooking) => {
  const opts = { month: 'short', day: 'numeric' } as const;
  return `${new Date(b.startAt).toLocaleDateString('en-US', opts)} – ${new Date(b.endAt).toLocaleDateString('en-US', opts)}`;
};

const hoursLeft = (deadline: string) =>
  Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / (60 * 60 * 1000)));

/** Trips — design/mockups/05-trips.html. The booking lifecycle made visible. */
export const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({ navigation }) => {
  const [filter, setFilter] = useState<TripFilter>('upcoming');
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await apiService.getToken();
      if (!token) {
        setSignedOut(true);
        setBookings([]);
        return;
      }
      const res = await keyloApi.myBookings(token);
      setBookings(res.bookings);
      setSignedOut(false);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const visible = useMemo(() => bookings.filter((b) => inFilter(b, filter)), [bookings, filter]);

  const renderBooking = ({ item }: { item: ApiBooking }) => {
    const vehicleName = item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : 'Vehicle';
    const isActive = item.status === 'active';

    return (
      <Card
        hero={isActive}
        className={`mb-3.5 overflow-hidden ${isActive ? 'border-teal' : ''}`}
      >
        {isActive && (
          <View className="flex-row justify-between bg-teal px-card-pad py-2">
            <Text className="font-ui-bold text-overline uppercase text-white">● Active trip</Text>
            <Text className="font-ui-bold text-overline text-white">
              Returns {new Date(item.endAt).toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
          </View>
        )}
        <View className="flex-row items-center gap-3 p-card-pad">
          <VehicleImage url={primaryPhotoUrl(item.vehicle ?? {})} iconSize={30} className="h-14 w-[72px] rounded-field" />
          <View className="flex-1">
            <DisplayText size="title" numberOfLines={1}>
              {vehicleName}
            </DisplayText>
            <Text className="mt-0.5 font-ui text-meta text-stone dark:text-night-muted">
              {dayRange(item)} · {formatDollars(item.totalCents)}
              {item.flightNumber ? ` · ✈ ${item.flightNumber}` : ''}
            </Text>
            {item.status === 'pending' && item.approvalDeadline && (
              <Badge
                label={`⏳ Awaiting host approval · ${hoursLeft(item.approvalDeadline)}h left`}
                tone="gold"
                className="mt-1.5"
              />
            )}
            {item.status === 'completed' && (
              <Pressable
                onPress={() =>
                  (navigation as { navigate: (r: string, p: object) => void }).navigate(ROUTES.WRITE_REVIEW, {
                    bookingId: item.id,
                    vehicleName,
                  })
                }
                className="mt-1.5 self-start"
              >
                <Badge label="Leave a review" tone="coral" />
              </Pressable>
            )}
            {item.status === 'cancelled' && <Badge label="Cancelled" tone="danger" className="mt-1.5" />}
            {item.status === 'declined' && <Badge label="Declined by host" tone="danger" className="mt-1.5" />}
          </View>
        </View>
        {(isActive || item.status === 'confirmed') && (
          <View className="flex-row gap-2 px-card-pad pb-card-pad">
            <Chip
              label={isActive ? 'Check out' : 'Check in'}
              active
              className="flex-1 justify-center"
              onPress={() =>
                (navigation as { navigate: (route: string, params: object) => void }).navigate(
                  ROUTES.TRIP_CHECK_IN,
                  {
                    bookingId: item.id,
                    phase: isActive ? 'check_out' : 'check_in',
                    vehicleName,
                    driveSide: item.vehicle?.driveSide ?? 'LHD',
                  }
                )
              }
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top']}>
      <View className="px-gutter pt-2">
        <DisplayText size="headline">Trips</DisplayText>
        <View className="mt-3.5 flex-row gap-2">
          {FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
          ))}
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(b) => b.id}
        renderItem={renderBooking}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
        contentContainerClassName="px-gutter pb-8 pt-4"
        ListEmptyComponent={
          loading ? null : (
            <Card className="items-center p-8">
              <Text className="font-display text-title text-ink dark:text-night-text">
                {signedOut ? 'Sign in to see your trips' : 'No trips here yet'}
              </Text>
              <Text className="mt-2 text-center font-ui text-body text-stone dark:text-night-muted">
                {signedOut
                  ? 'Your bookings live here once you sign in.'
                  : 'When you book a car, your trip shows up here with check-in, receipts, and reviews.'}
              </Text>
              {!signedOut && (
                <Pressable onPress={() => navigation.navigate('CustomerApp' as never)} className="mt-4">
                  <Badge label="Explore cars →" tone="coral" />
                </Pressable>
              )}
            </Card>
          )
        }
      />
    </SafeAreaView>
  );
};

export default MyBookingsScreen;
