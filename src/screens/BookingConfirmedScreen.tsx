import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Linking, Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Button, Card, Chip, DisplayText, SectionLabel, VehicleImage } from '../components/ui';
import { keyloApi, ApiBookingDetailResponse, formatDollars, primaryPhotoUrl } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type BookingConfirmedScreenNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.BOOKING_CONFIRMED>;
type BookingConfirmedScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.BOOKING_CONFIRMED>;

interface BookingConfirmedScreenProps {
  navigation: BookingConfirmedScreenNavigationProp;
  route: BookingConfirmedScreenRouteProp;
}

const longDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/**
 * Booking confirmed — design/mockups/10-booking-confirmed.html.
 *
 * This is the app's single celebratory moment (design/07-prototype-plan.md):
 * the coral circle springs 0→1, the headline fades in at 150ms, and the trip
 * summary slides up 16px behind it. Nothing else in KeyLo animates like this.
 * Reduced motion drops every transform and keeps only the opacity fades.
 */
export const BookingConfirmedScreen: React.FC<BookingConfirmedScreenProps> = ({ navigation, route }) => {
  const { bookingId } = route.params;

  const [data, setData] = useState<ApiBookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const circleScale = useRef(new Animated.Value(0)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const summaryOpacity = useRef(new Animated.Value(0)).current;
  const summaryShift = useRef(new Animated.Value(16)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const token = await apiService.getToken();
      if (!token) return;
      setData(await keyloApi.booking(bookingId, token));
    } catch {
      // The booking exists — the fetch didn't. Show the confirmation without
      // the summary rather than an error wall on the happiest screen in the app.
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => setReduceMotion(false));
    load();
  }, [load]);

  // Fires once the API resolves, so the celebration lands on real data.
  useEffect(() => {
    if (loading) return;

    if (reduceMotion) {
      circleScale.setValue(1);
      Animated.timing(headlineOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      summaryShift.setValue(0);
      Animated.timing(summaryOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Animated.timing(actionsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      return;
    }

    Animated.sequence([
      Animated.spring(circleScale, { toValue: 1, damping: 11, stiffness: 180, useNativeDriver: true }),
      Animated.delay(150),
      Animated.timing(headlineOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      // 100ms stagger between the summary and the quick actions below it
      Animated.parallel([
        Animated.timing(summaryOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(summaryShift, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.timing(actionsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [loading, reduceMotion, circleScale, headlineOpacity, summaryOpacity, summaryShift, actionsOpacity]);

  const booking = data?.booking;
  const vehicle = booking?.vehicle;
  const hostName = vehicle?.host?.displayName ?? vehicle?.host?.user?.firstName ?? 'your host';
  const isRequest = booking?.status === 'pending';

  const openDirections = () => {
    const target = booking?.pickupAddress ?? vehicle?.address;
    if (!target) return;
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(target)}`).catch(() => {
      notificationService.error("Couldn't open maps.");
    });
  };

  const openMessages = () => {
    if (!booking?.conversation?.id) {
      notificationService.info(`${hostName} will message you before pickup.`);
      return;
    }
    navigation.navigate(ROUTES.CHAT, { conversationId: booking.conversation.id as never, title: hostName });
  };

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* The one celebratory moment */}
        <View className="items-center px-gutter pt-8">
          <Animated.View
            style={{ transform: [{ scale: circleScale }] }}
            className="h-[88px] w-[88px] items-center justify-center rounded-pill bg-coral shadow-float"
          >
            <Ionicons name="checkmark" size={44} color="#FFFFFF" />
          </Animated.View>

          <Animated.View style={{ opacity: headlineOpacity }} className="items-center">
            <DisplayText size="headline" className="mt-5 text-center">
              {isRequest ? 'Request sent.' : "You've got the keys."}
            </DisplayText>
            <Text className="mt-2 max-w-[28ch] text-center font-ui text-body leading-6 text-stone dark:text-night-muted">
              {isRequest
                ? `${hostName} has 24 hours to respond. Nothing is charged until they approve.`
                : booking
                  ? `Your trip starts ${new Date(booking.startAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                    })}. ${hostName} will message you with pickup details.`
                  : `${hostName} will message you with pickup details.`}
            </Text>
          </Animated.View>
        </View>

        {/* Trip summary */}
        {booking && vehicle && (
          <Animated.View
            style={{ opacity: summaryOpacity, transform: [{ translateY: summaryShift }] }}
            className="px-gutter pt-6"
          >
            <SectionLabel>Trip details</SectionLabel>
            <Card hero className="mt-2 p-card-pad">
              <View className="flex-row items-center gap-3 border-b border-sand pb-3.5 dark:border-night-line">
                <VehicleImage url={primaryPhotoUrl(vehicle)} iconSize={26} className="h-14 w-[72px] rounded-field" />
                <View className="flex-1">
                  <DisplayText size="title" numberOfLines={1}>
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </DisplayText>
                  <Text className="mt-0.5 font-ui text-meta text-stone dark:text-night-muted">
                    Hosted by {hostName}
                    {vehicle.averageRating ? ` · ★ ${vehicle.averageRating.toFixed(1)}` : ''}
                  </Text>
                </View>
              </View>

              <View className="gap-2.5 pt-3.5">
                <View className="flex-row gap-2.5">
                  <Text className="w-5 text-center text-coral">●</Text>
                  <View className="flex-1">
                    <Text className="font-ui-bold text-meta text-ink dark:text-night-text">
                      Pickup — {longDateTime(booking.startAt)}
                    </Text>
                    <Text className="mt-0.5 font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                      {booking.pickupAddress ?? vehicle.address ?? "Host's location"}
                      {booking.flightNumber ? ` · ✈ ${booking.flightNumber}` : ''}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2.5">
                  <Text className="w-5 text-center text-teal">●</Text>
                  <View className="flex-1">
                    <Text className="font-ui-bold text-meta text-ink dark:text-night-text">
                      Return — {longDateTime(booking.endAt)}
                    </Text>
                    <Text className="mt-0.5 font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                      {vehicle.island?.name ?? vehicle.address ?? 'Same location'}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-3.5 flex-row justify-between border-t border-sand pt-3.5 dark:border-night-line">
                <Text className="font-ui text-meta text-stone dark:text-night-muted">
                  {isRequest ? 'Total on approval (USD)' : 'Total paid (USD)'}
                </Text>
                <Text className="font-display text-emphasis text-coral">{formatDollars(booking.totalCents)}</Text>
              </View>
              {vehicle.securityDepositCents > 0 && (
                <Text className="mt-1 font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                  + {formatDollars(vehicle.securityDepositCents)} refundable deposit hold · Free cancellation until{' '}
                  {longDateTime(data.freeCancelUntil)}
                </Text>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Quick actions + what's next */}
        <Animated.View style={{ opacity: actionsOpacity }} className="px-gutter pb-8 pt-5">
          <View className="flex-row gap-2.5">
            <Chip label="📅 Calendar" className="flex-1 justify-center" />
            <Chip label="🧭 Directions" className="flex-1 justify-center" onPress={openDirections} />
            <Chip label="✉ Message" className="flex-1 justify-center" onPress={openMessages} />
          </View>

          <Card className="mt-5 border-0 bg-sand-soft p-card-pad dark:bg-night-raised">
            <Text className="font-ui-bold text-meta text-ink dark:text-night-text">What's next</Text>
            <Text className="mt-1 font-ui text-meta leading-6 text-stone dark:text-night-muted">
              {hostName} will confirm the pickup time the night before. When you arrive, open the Trips tab and tap{' '}
              <Text className="font-ui-bold text-ink dark:text-night-text">Check in</Text> to photograph the car before
              you drive. Same at return — that's what protects you both.
            </Text>
          </Card>

          <Button
            label="Go to my trips"
            className="mt-4"
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'CustomerApp' as never, params: { screen: ROUTES.TRIPS_TAB } as never }],
              })
            }
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingConfirmedScreen;
