import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { Badge, Button, Card, DisplayText, SectionLabel } from '../components/ui';
import {
  keyloApi,
  ApiProtectionPlan,
  ApiVehicle,
  QuoteBreakdown,
  formatDollars,
  KeyloApiError,
} from '../services/keyloApi';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { notificationService } from '../services/notificationService';
import { apiService } from '../services/apiService';

type CheckoutScreenProps = StackScreenProps<RootStackParamList, typeof ROUTES.CHECKOUT>;

type PickupKind = 'host_location' | 'airport' | 'delivery';

const DEDUCTIBLE_LABEL = (cents: number) => (cents === 0 ? '$0 deductible' : `${formatDollars(cents)} deductible`);

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** Checkout — design/mockups/04-checkout.html. Quote math is server-side. */
export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation, route }) => {
  const { vehicle, startDate, endDate } = route.params;
  const vehicleId = String(vehicle.id);

  const [apiVehicle, setApiVehicle] = useState<ApiVehicle | null>(null);
  const [plans, setPlans] = useState<ApiProtectionPlan[]>([]);
  const [planId, setPlanId] = useState('standard');
  const [pickupKind, setPickupKind] = useState<PickupKind>('host_location');
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    keyloApi
      .vehicle(vehicleId)
      .then((res) => setApiVehicle(res.vehicle))
      .catch(() => setApiVehicle(null));
    keyloApi
      .protectionPlans()
      .then((res) => setPlans(res.plans))
      .catch(() => setPlans([]));
  }, [vehicleId]);

  const refreshQuote = useCallback(() => {
    setQuoteError(null);
    keyloApi
      .quote({ vehicleId, startAt: startDate, endAt: endDate, pickupKind, protectionPlanId: planId, extraIds })
      .then((res) => setQuote(res.quote))
      .catch((e) => {
        setQuote(null);
        setQuoteError(e instanceof KeyloApiError ? e.message : "Couldn't price this trip.");
      });
  }, [vehicleId, startDate, endDate, pickupKind, planId, extraIds]);

  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  const toggleExtra = (id: string) =>
    setExtraIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const extras = apiVehicle?.extras ?? [];

  const pickupOptions = useMemo(() => {
    const options: { kind: PickupKind; label: string; feeCents: number }[] = [
      { kind: 'host_location', label: 'Host location', feeCents: 0 },
    ];
    if (apiVehicle?.airportPickup)
      options.push({ kind: 'airport', label: 'Airport (LPIA)', feeCents: apiVehicle.airportFeeCents });
    if (apiVehicle?.deliveryAvailable)
      options.push({ kind: 'delivery', label: 'Deliver to me', feeCents: apiVehicle.deliveryFeeCents });
    return options;
  }, [apiVehicle]);

  const pay = async () => {
    setPaying(true);
    try {
      const token = await apiService.getToken();
      if (!token) {
        notificationService.error('Sign in to book this car', { title: 'Sign in required' });
        return;
      }
      const result = await keyloApi.createBooking(
        {
          vehicleId,
          startAt: startDate,
          endAt: endDate,
          pickupKind,
          protectionPlanId: planId,
          extraIds,
        },
        token
      );
      if (result.approveUrl) {
        // PayPal approval sheet (in-app browser); the webhook confirms capture.
        await Linking.openURL(result.approveUrl);
      }
      navigation.navigate(ROUTES.BOOKING_CONFIRMED, {
        booking: {
          id: Number(result.booking.id) || 0,
          start_date: startDate,
          end_date: endDate,
          status: result.booking.status,
          total_amount: (quote?.totalCents ?? 0) / 100,
          vehicle: {
            id: Number(vehicle.id) || 0,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            location: vehicle.location,
            daily_rate: vehicle.dailyRate,
          },
        },
        vehicle,
      });
    } catch (e) {
      const message = e instanceof KeyloApiError ? e.message : 'Something went wrong — you were not charged.';
      notificationService.error(message, { title: 'Booking failed' });
    } finally {
      setPaying(false);
    }
  };

  const line = (label: string, cents: number, negative = false) =>
    cents !== 0 ? (
      <View className="flex-row justify-between py-1" key={label}>
        <Text className="font-ui text-body text-stone dark:text-night-muted">{label}</Text>
        <Text className="font-ui text-body text-ink dark:text-night-text">
          {negative ? '−' : ''}
          {formatDollars(Math.abs(cents))}
        </Text>
      </View>
    ) : null;

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
      <ScrollView className="flex-1 px-gutter" showsVerticalScrollIndicator={false}>
        <DisplayText size="title" className="mt-4">
          Confirm and pay
        </DisplayText>

        {/* Trip summary */}
        <Card className="mt-4 flex-row items-center gap-3 p-card-pad">
          <View className="h-12 w-16 items-center justify-center rounded-field bg-ink dark:bg-night-raised">
            <Ionicons name="car-sport" size={28} color="#F2EFE9" />
          </View>
          <View className="flex-1">
            <Text className="font-ui-bold text-body text-ink dark:text-night-text">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </Text>
            <Text className="font-ui text-meta text-stone dark:text-night-muted">
              {dayLabel(startDate)} → {dayLabel(endDate)}
            </Text>
          </View>
        </Card>

        {/* Pickup */}
        {pickupOptions.length > 1 && (
          <>
            <SectionLabel className="mt-6">Pickup</SectionLabel>
            <View className="mt-2 gap-2">
              {pickupOptions.map((option) => (
                <Pressable
                  key={option.kind}
                  onPress={() => setPickupKind(option.kind)}
                  className={`flex-row items-center justify-between rounded-card border p-3.5 ${
                    pickupKind === option.kind
                      ? 'border-coral bg-coral-tint dark:bg-night-raised'
                      : 'border-sand bg-white dark:border-night-line dark:bg-night-raised'
                  }`}
                >
                  <Text className="font-ui-semibold text-body text-ink dark:text-night-text">{option.label}</Text>
                  <Text className="font-ui text-meta text-stone dark:text-night-muted">
                    {option.feeCents === 0 ? 'Free' : formatDollars(option.feeCents)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Protection plan */}
        {plans.length > 0 && (
          <>
            <SectionLabel className="mt-6">Protection plan</SectionLabel>
            <View className="mt-2 flex-row gap-2">
              {plans.map((plan) => (
                <Pressable
                  key={plan.id}
                  onPress={() => setPlanId(plan.id)}
                  className={`flex-1 items-center rounded-card border p-3 ${
                    planId === plan.id
                      ? 'border-2 border-coral bg-white shadow-float dark:bg-night-raised'
                      : 'border-sand bg-white dark:border-night-line dark:bg-night-raised'
                  }`}
                >
                  <Text
                    className={`font-ui-bold text-meta ${
                      planId === plan.id ? 'text-coral-pressed dark:text-coral-night' : 'text-ink dark:text-night-text'
                    }`}
                  >
                    {plan.name}
                    {planId === plan.id ? ' ✓' : ''}
                  </Text>
                  <Text className="mt-0.5 font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                    {DEDUCTIBLE_LABEL(plan.deductibleCents)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Extras */}
        {extras.length > 0 && (
          <>
            <SectionLabel className="mt-6">Extras</SectionLabel>
            <Card className="mt-2 px-card-pad">
              {extras.map((extra, i) => (
                <Pressable
                  key={extra.id}
                  onPress={() => toggleExtra(extra.id)}
                  className={`flex-row items-center justify-between py-3 ${
                    i < extras.length - 1 ? 'border-b border-sand dark:border-night-line' : ''
                  }`}
                >
                  <Text
                    className={`font-ui text-body ${
                      extraIds.includes(extra.id)
                        ? 'font-ui-semibold text-ink dark:text-night-text'
                        : 'text-stone dark:text-night-muted'
                    }`}
                  >
                    {extraIds.includes(extra.id) ? '☑' : '☐'} {extra.name}
                  </Text>
                  <Text className="font-ui-bold text-meta text-ink dark:text-night-text">
                    {formatDollars(extra.priceCents)} {extra.perTrip ? '/ trip' : '/ day'}
                  </Text>
                </Pressable>
              ))}
            </Card>
          </>
        )}

        {/* Price details — server-authoritative */}
        <SectionLabel className="mt-6">Price details</SectionLabel>
        <Card className="mb-8 mt-2 p-card-pad">
          {quote ? (
            <>
              {line(`${formatDollars(quote.nightlyRateCents)} × ${quote.nights} days`, quote.baseCents)}
              {line('Duration discount', quote.durationDiscountCents, true)}
              {line('Pickup / delivery', quote.deliveryCents)}
              {line('Extras', quote.extrasCents)}
              {line('Young driver fee', quote.youngDriverCents)}
              {line('Protection', quote.protectionCents)}
              {line('KeyLo service fee', quote.serviceFeeCents)}
              <View className="mt-1.5 flex-row items-baseline justify-between border-t border-sand pt-2 dark:border-night-line">
                <Text className="font-ui-bold text-body text-ink dark:text-night-text">Total (USD)</Text>
                <Text className="font-display text-title text-coral">{formatDollars(quote.totalCents)}</Text>
              </View>
              {quote.depositCents > 0 && (
                <Text className="mt-1 font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                  + {formatDollars(quote.depositCents)} refundable deposit hold
                </Text>
              )}
            </>
          ) : quoteError ? (
            <Pressable onPress={refreshQuote} className="items-center py-2">
              <Text className="font-ui text-body text-stone dark:text-night-muted">{quoteError}</Text>
              <Badge label="Tap to retry" tone="coral" className="mt-2" />
            </Pressable>
          ) : (
            <ActivityIndicator color="#FF5A3C" />
          )}
        </Card>
      </ScrollView>

      <View className="border-t border-sand bg-white px-gutter pb-2 pt-3 dark:border-night-line dark:bg-night-raised">
        <Button
          label={quote ? `Pay ${formatDollars(quote.totalCents)} with PayPal` : 'Pay with PayPal'}
          disabled={!quote}
          loading={paying}
          onPress={pay}
        />
        <Text className="mt-2 text-center font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
          Card or PayPal balance · Free cancellation until 24h before pickup
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default CheckoutScreen;
