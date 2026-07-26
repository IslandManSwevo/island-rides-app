import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Button, Card, DisplayText, SectionLabel, Sheet, VehicleImage } from '../components/ui';
import { TripCheckInPanel } from '../components/TripCheckInPanel';
import {
  keyloApi,
  ApiBookingDetailResponse,
  formatDollars,
  primaryPhotoUrl,
} from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { ROUTES } from '../navigation/routes';

interface TripDetailParams {
  bookingId: string;
}

interface TripDetailScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  route: RouteProp<{ TripDetail: TripDetailParams }, 'TripDetail'>;
}

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const PICKUP_LABEL: Record<string, string> = {
  host_location: "Host's location",
  airport: 'Nassau Airport (LPIA)',
  delivery: 'Delivered to you',
};

/** "2 days 8 hours 22 minutes" — the upcoming-state countdown. */
const countdown = (iso: string): string | null => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  const parts = [
    days > 0 ? `${days} day${days === 1 ? '' : 's'}` : null,
    hours > 0 ? `${hours} hour${hours === 1 ? '' : 's'}` : null,
    days === 0 ? `${minutes} minute${minutes === 1 ? '' : 's'}` : null,
  ].filter(Boolean);
  return parts.join(' ');
};

/** One label/value row with the Sand hairline the mockups use between rows. */
const Row: React.FC<{ label: string; value: string; accent?: boolean; first?: boolean }> = ({
  label,
  value,
  accent = false,
  first = false,
}) => (
  <View
    className={`flex-row items-center justify-between py-2.5 ${
      first ? '' : 'border-t border-sand dark:border-night-line'
    }`}
  >
    <Text className="font-ui text-meta text-stone dark:text-night-muted">{label}</Text>
    <Text
      className={`flex-1 text-right font-ui text-meta ${accent ? 'text-teal' : 'text-ink dark:text-night-text'}`}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);

/**
 * Trip Detail — design/mockups/11-trip-detail.html.
 *
 * Three states off booking.status:
 *   upcoming  → Ink countdown header, cancel action
 *   active    → Teal header, check-in/out sheet + extend + message
 *   completed → muted card, review prompt replaces the actions
 */
export const TripDetailScreen: React.FC<TripDetailScreenProps> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const [data, setData] = useState<ApiBookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await apiService.getToken();
      if (!token) {
        setFailed(true);
        return;
      }
      setData(await keyloApi.booking(bookingId, token));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  if (loading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-paper px-gutter dark:bg-night" edges={['bottom']}>
        {/* Skeleton matching the real layout geometry, per the state matrix */}
        <View className="mt-4 h-20 rounded-card bg-sand-soft dark:bg-night-raised" />
        <View className="mt-3.5 h-56 rounded-card bg-sand-soft dark:bg-night-raised" />
        <View className="mt-3.5 h-24 rounded-card bg-sand-soft dark:bg-night-raised" />
      </SafeAreaView>
    );
  }

  if (failed || !data) {
    return (
      <SafeAreaView className="flex-1 bg-paper px-gutter dark:bg-night" edges={['bottom']}>
        <Card className="mt-6 border-l-4 border-l-coral p-5">
          <Text className="font-display text-title text-ink dark:text-night-text">Couldn't load this trip.</Text>
          <Text className="mt-2 font-ui text-body text-stone dark:text-night-muted">
            Check your connection and try again.
          </Text>
          <Button label="Retry" variant="ghost" className="mt-4" onPress={load} />
        </Card>
      </SafeAreaView>
    );
  }

  const { booking, viewerRole, freeCancelUntil, inspectionState, viewerHasReviewed } = data;
  const vehicle = booking.vehicle;
  const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
  const hostName = vehicle.host?.displayName ?? vehicle.host?.user?.firstName ?? 'your host';
  const viewerIsGuest = viewerRole === 'guest';

  const isActive = booking.status === 'active';
  const isUpcoming = booking.status === 'pending' || booking.status === 'confirmed';
  const isClosed = ['completed', 'reviewed', 'cancelled', 'declined', 'expired'].includes(booking.status);

  // Whose evidence is outstanding for this viewer, and has the other side filed theirs.
  const phase: 'check_in' | 'check_out' = isActive ? 'check_out' : 'check_in';
  const otherPartyDone = isActive
    ? viewerIsGuest
      ? inspectionState.checkOutHost
      : inspectionState.checkOutGuest
    : viewerIsGuest
      ? inspectionState.checkInHost
      : inspectionState.checkInGuest;
  const viewerDone = isActive
    ? viewerIsGuest
      ? inspectionState.checkOutGuest
      : inspectionState.checkOutHost
    : viewerIsGuest
      ? inspectionState.checkInGuest
      : inspectionState.checkInHost;

  const openMessages = () => {
    if (!booking.conversation?.id) {
      notificationService.info('No thread yet — a conversation opens once the host replies.');
      return;
    }
    navigation.navigate(ROUTES.CHAT, {
      conversationId: booking.conversation.id,
      title: hostName,
    });
  };

  const confirmCancel = () => {
    const free = Date.now() < new Date(freeCancelUntil).getTime();
    Alert.alert(
      'Cancel this trip?',
      free
        ? `Free cancellation until ${dateTime(freeCancelUntil)} — you'll be refunded in full.`
        : 'Inside 24 hours of pickup, half the trip cost is refunded. After the trip starts, nothing is.',
      [
        { text: 'Keep trip', style: 'cancel' },
        {
          text: 'Cancel trip',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await apiService.getToken();
              if (!token) return;
              const res = await keyloApi.cancelBooking(booking.id, undefined, token);
              notificationService.success(
                `Trip cancelled. ${formatDollars(res.refundCents)} is on its way back to you.`
              );
              load();
            } catch {
              notificationService.error("Couldn't cancel — try again in a moment.");
            }
          },
        },
      ]
    );
  };

  const openDirections = () => {
    const target = booking.pickupAddress ?? vehicle.address;
    if (!target) return;
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(target)}`).catch(() => {
      notificationService.error("Couldn't open maps.");
    });
  };

  const pickupLabel = `${PICKUP_LABEL[booking.pickupKind] ?? booking.pickupKind}${
    booking.deliveryCents > 0 ? ` · ${formatDollars(booking.deliveryCents)}` : ''
  }`;

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
      <ScrollView className="flex-1 px-gutter" showsVerticalScrollIndicator={false}>
        {/* State header — Teal band when active, Ink countdown when upcoming */}
        <View className="flex-row items-center gap-3 pt-3">
          <DisplayText size="title" className="flex-1">
            Trip detail
          </DisplayText>
          {isActive && (
            <Badge
              label={`Active · returns ${new Date(booking.endAt).toLocaleDateString('en-US', {
                weekday: 'short',
                hour: 'numeric',
              })}`}
              tone="teal"
            />
          )}
          {booking.status === 'pending' && <Badge label="Awaiting host approval" tone="gold" />}
          {booking.status === 'cancelled' && <Badge label="Cancelled" tone="danger" />}
          {booking.status === 'declined' && <Badge label="Declined" tone="danger" />}
        </View>

        {isUpcoming && countdown(booking.startAt) && (
          <View className="mt-3.5 rounded-card bg-ink p-4 dark:bg-night-raised">
            <Text className="font-ui text-overline uppercase tracking-widest text-night-muted">Pickup in</Text>
            <Text className="mt-1 font-display text-headline text-paper">{countdown(booking.startAt)}</Text>
          </View>
        )}

        {/* Vehicle + host */}
        <Card className={`mt-3.5 flex-row items-center gap-3 p-3.5 ${isClosed ? 'opacity-70' : ''}`}>
          <VehicleImage url={primaryPhotoUrl(vehicle)} iconSize={26} className="h-12 w-16 rounded-field" />
          <View className="flex-1">
            <DisplayText size="title" numberOfLines={1}>
              {vehicleName}
            </DisplayText>
            <Text className="mt-0.5 font-ui text-meta text-stone dark:text-night-muted" numberOfLines={1}>
              {hostName}
              {vehicle.averageRating ? ` · ★ ${vehicle.averageRating.toFixed(1)}` : ''}
              {vehicle.reviewCount ? ` · ${vehicle.reviewCount} trips` : ''}
            </Text>
          </View>
          <Pressable
            onPress={openMessages}
            accessibilityRole="button"
            accessibilityLabel={`Message ${hostName}`}
            className="min-h-[44px] justify-center rounded-pill border border-sand px-3 dark:border-night-line"
          >
            <Text className="font-ui-semibold text-meta text-ink dark:text-night-text">Message</Text>
          </Pressable>
        </Card>

        {/* Trip details */}
        <Card className="mt-3.5 px-card-pad">
          <Row first label="Pickup" value={dateTime(booking.startAt)} />
          <Row label="Return" value={dateTime(booking.endAt)} />
          <Row label="Pickup location" value={pickupLabel} />
          {booking.flightNumber && <Row label="Flight" value={`✈ ${booking.flightNumber}`} />}
          <Row
            label="Protection"
            value={`${booking.protectionPlan.name} · ${formatDollars(
              booking.protectionPlan.deductibleCents
            )} deductible`}
          />
          {booking.extras.length > 0 && (
            <Row
              label="Extras"
              value={booking.extras
                .map((e) => `${e.extra.name} · ${formatDollars(e.priceCentsSnapshot)}`)
                .join(', ')}
            />
          )}
          {isUpcoming && (
            <Row label="Cancellation" value={`Free until ${dateTime(freeCancelUntil)}`} accent />
          )}
          {booking.status === 'cancelled' && booking.cancellationRefundCents != null && (
            <Row label="Refunded" value={formatDollars(booking.cancellationRefundCents)} accent />
          )}
          {booking.status === 'declined' && booking.declineReason && (
            <Row label="Reason" value={booking.declineReason} />
          )}
        </Card>

        {/* Host-authored pickup instructions */}
        {vehicle.pickupInstructions && (
          <View className="mt-3.5">
            <SectionLabel>{`Pickup instructions from ${hostName}`}</SectionLabel>
            <Card className="mt-2 p-card-pad">
              <Text className="font-ui text-meta leading-6 text-ink dark:text-night-text">
                {vehicle.pickupInstructions}
              </Text>
            </Card>
          </View>
        )}

        {/* Price */}
        <Card className="mt-3.5 flex-row items-center justify-between p-card-pad">
          <Text className="font-ui text-meta text-stone dark:text-night-muted">
            {viewerIsGuest ? 'Total paid' : 'Your earnings'}
          </Text>
          <Text className="font-display text-emphasis text-coral">
            {formatDollars(viewerIsGuest ? booking.totalCents : booking.hostEarningsCents)}
          </Text>
        </Card>

        {/* Completed → review prompt replaces the action bar */}
        {booking.status === 'completed' && !viewerHasReviewed && (
          <Card className="mt-3.5 p-card-pad">
            <Text className="font-display text-emphasis text-ink dark:text-night-text">
              How was the {vehicle.year} {vehicle.model}?
            </Text>
            <Text className="mt-1 font-ui text-meta leading-5 text-stone dark:text-night-muted">
              Your review helps {hostName} and the community. Reviews stay hidden until you both submit.
            </Text>
            <Button
              label="Write a review"
              className="mt-3.5"
              onPress={() =>
                navigation.navigate(ROUTES.WRITE_REVIEW, { bookingId: booking.id, vehicleName })
              }
            />
          </Card>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Action bar — only for live trips */}
      {(isActive || booking.status === 'confirmed') && (
        <View className="flex-row gap-2.5 border-t border-sand bg-white px-gutter pb-2 pt-3.5 dark:border-night-line dark:bg-night-raised">
          <Button
            label={viewerDone ? 'Check-in submitted' : isActive ? 'Start check-out' : 'Start check-in'}
            icon={<Ionicons name="camera" size={18} color="#FFFFFF" />}
            disabled={viewerDone}
            className="flex-1"
            onPress={() => setSheetOpen(true)}
          />
          <Button
            label={booking.pickupAddress || vehicle.address ? 'Directions' : 'Message'}
            variant="ghost"
            className="flex-1"
            onPress={booking.pickupAddress || vehicle.address ? openDirections : openMessages}
          />
        </View>
      )}

      {isUpcoming && booking.status !== 'active' && viewerIsGuest && (
        <View className="border-t border-sand bg-white px-gutter pb-2 pt-3.5 dark:border-night-line dark:bg-night-raised">
          <Button label="Cancel trip" variant="ghost" onPress={confirmCancel} />
        </View>
      )}

      {/* Check-in lives in a sheet now, not a full push (mockup 11) */}
      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <TripCheckInPanel
          bookingId={booking.id}
          phase={phase}
          vehicleName={vehicleName}
          driveSide={vehicle.driveSide}
          hostName={viewerIsGuest ? hostName : undefined}
          otherPartyDone={otherPartyDone}
          onDone={() => {
            setSheetOpen(false);
            load();
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
};

export default TripDetailScreen;
