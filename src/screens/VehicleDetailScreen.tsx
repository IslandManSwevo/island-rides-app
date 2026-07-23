import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Badge, Button, Card, Chip, DisplayText, PickupMap, SectionLabel, Stars, VehicleImage } from '../components/ui';
import { keyloApi, ApiVehicle, ApiReview, formatDollars, primaryPhotoUrl } from '../services/keyloApi';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import type { Vehicle } from '../types';

type VehicleDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VehicleDetail'>;
type VehicleDetailScreenRouteProp = RouteProp<RootStackParamList, 'VehicleDetail'>;

interface VehicleDetailScreenProps {
  navigation: VehicleDetailScreenNavigationProp;
  route: VehicleDetailScreenRouteProp;
}

/** Legacy callers still pass the old numeric-id Vehicle object; adapt it. */
const fromLegacy = (v: Vehicle): ApiVehicle => ({
  id: String(v.id),
  make: v.make,
  model: v.model,
  year: v.year,
  vehicleType: v.vehicleType ?? 'sedan',
  driveSide: v.driveSide,
  seats: v.seatingCapacity ?? 5,
  transmission: v.transmissionType,
  fuelType: v.fuelType,
  description: v.description,
  features: [],
  dailyRateCents: Math.round((v.dailyRate ?? 0) * 100),
  securityDepositCents: Math.round((v.securityDeposit ?? 0) * 100),
  deliveryAvailable: v.deliveryAvailable ?? false,
  deliveryFeeCents: Math.round((v.deliveryFee ?? 0) * 100),
  airportPickup: v.airportPickup ?? false,
  airportFeeCents: Math.round((v.airportPickupFee ?? 0) * 100),
  instantBook: v.instantBooking ?? false,
  islandId: v.island ?? '',
  address: v.location,
  photos: [],
});

/** Vehicle detail — design/mockups/03-vehicle-detail.html, on the KeyLo kit. */
export const VehicleDetailScreen = ({ navigation, route }: VehicleDetailScreenProps) => {
  const params = route.params ?? {};
  const [vehicle, setVehicle] = useState<ApiVehicle | null>(
    params.vehicle ? fromLegacy(params.vehicle) : null
  );
  const [loading, setLoading] = useState(!params.vehicle && params.vehicleId !== undefined);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);

  useEffect(() => {
    if (vehicle || params.vehicleId === undefined) return;
    keyloApi
      .vehicle(String(params.vehicleId))
      .then((res) => setVehicle(res.vehicle))
      .catch(() => setError("Couldn't load this vehicle."))
      .finally(() => setLoading(false));
  }, [params.vehicleId, vehicle]);

  // Reviews are the renter's trust signal — load them once we know the id.
  const vehicleId = vehicle?.id ?? (params.vehicleId !== undefined ? String(params.vehicleId) : undefined);
  useEffect(() => {
    if (!vehicleId) return;
    keyloApi
      .vehicleReviews(vehicleId)
      .then((res) => setReviews(res.reviews))
      .catch(() => setReviews([]));
  }, [vehicleId]);

  const specs = useMemo(() => {
    if (!vehicle) return [];
    return [
      `${vehicle.seats} seats`,
      vehicle.transmission ?? null,
      vehicle.driveSide,
      vehicle.fuelType ?? null,
    ].filter((s): s is string => Boolean(s));
  }, [vehicle]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-paper dark:bg-night">
        <ActivityIndicator size="large" color="#FF5A3C" />
      </View>
    );
  }

  if (!vehicle || error) {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-gutter dark:bg-night">
        <DisplayText size="title">{error ?? 'Vehicle not found'}</DisplayText>
        <Button label="Go back" variant="ghost" className="mt-6 self-stretch" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const host = vehicle.host;
  const hostName = host?.displayName ?? host?.user?.firstName ?? 'Your host';

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Gallery: real primary photo when available, else the ink placeholder */}
        <View className="h-64">
          <VehicleImage url={primaryPhotoUrl(vehicle)} iconSize={96} className="h-64 w-full" />
          <Pressable
            onPress={() => navigation.goBack()}
            className="absolute left-4 top-4 h-9 w-9 items-center justify-center rounded-pill bg-paper/90"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#141C24" />
          </Pressable>
        </View>

        <View className="px-gutter pt-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <DisplayText size="headline">
                {vehicle.make} {vehicle.model} {vehicle.year}
              </DisplayText>
              <View className="mt-1 flex-row items-center gap-1.5">
                {vehicle.averageRating != null ? (
                  <>
                    <Stars rating={vehicle.averageRating} size={13} />
                    <Text className="font-ui-bold text-meta text-ink dark:text-night-text">{vehicle.averageRating}</Text>
                    <Text className="font-ui text-meta text-stone dark:text-night-muted">
                      ({vehicle.reviewCount}) · {vehicle.address ?? vehicle.islandId}
                    </Text>
                  </>
                ) : (
                  <Text className="font-ui text-meta text-stone dark:text-night-muted">
                    New listing · {vehicle.address ?? vehicle.islandId}
                  </Text>
                )}
              </View>
            </View>
            {vehicle.instantBook && <Badge label="⚡ Instant Book" tone="teal" className="mt-1" />}
          </View>

          {/* Spec chips */}
          <View className="mt-4 flex-row flex-wrap gap-2">
            {specs.map((spec) => (
              <Chip key={spec} label={spec} />
            ))}
          </View>

          {/* Host card */}
          <Card className="mt-4 flex-row items-center gap-3 p-card-pad">
            <View className="h-11 w-11 items-center justify-center rounded-pill bg-ink dark:bg-night-raised">
              <Text className="font-ui-bold text-emphasis text-paper">{hostName.charAt(0)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-ui-bold text-body text-ink dark:text-night-text">
                Hosted by {hostName}
              </Text>
              {host?.responseTimeMins != null && (
                <Text className="font-ui text-meta text-stone dark:text-night-muted">
                  Responds in ~{host.responseTimeMins} min
                </Text>
              )}
            </View>
          </Card>

          {/* Pickup location + directions */}
          <SectionLabel className="mt-6">Pickup & return</SectionLabel>
          <View className="mt-2">
            <PickupMap
              latitude={vehicle.latitude}
              longitude={vehicle.longitude}
              address={vehicle.address}
              islandName={vehicle.islandId}
              note="Host location · free"
            />
          </View>
          <View className="mt-3 gap-1.5">
            <Text className="font-ui text-body text-ink dark:text-night-text">
              ◉ Host location — {vehicle.address ?? 'on island'} · Free
            </Text>
            {vehicle.airportPickup && (
              <Text className="font-ui text-body text-stone dark:text-night-muted">
                ○ Airport pickup · {formatDollars(vehicle.airportFeeCents)}
              </Text>
            )}
            {vehicle.deliveryAvailable && (
              <Text className="font-ui text-body text-stone dark:text-night-muted">
                ○ Delivery to you · {formatDollars(vehicle.deliveryFeeCents)}
              </Text>
            )}
          </View>

          {/* Good to know */}
          <SectionLabel className="mt-6">Good to know</SectionLabel>
          <Text className="mb-6 mt-2 font-ui text-body leading-6 text-stone dark:text-night-muted">
            Free cancellation until 24h before pickup
            {vehicle.securityDepositCents > 0
              ? ` · ${formatDollars(vehicle.securityDepositCents)} deposit hold`
              : ''}
            {' · Photo check-in at pickup'}
            {vehicle.driveSide === 'LHD' ? ' · LHD — remember, we drive on the left 🇧🇸' : ''}
          </Text>

          {vehicle.description ? (
            <>
              <SectionLabel>About this car</SectionLabel>
              <Text className="mb-6 mt-2 font-ui text-body leading-6 text-ink dark:text-night-text">
                {vehicle.description}
              </Text>
            </>
          ) : null}

          {/* Reviews */}
          {reviews.length > 0 && (
            <View className="mb-8">
              <SectionLabel>{`Reviews · ${reviews.length}`}</SectionLabel>
              <View className="mt-2 gap-3">
                {reviews.slice(0, 6).map((r) => (
                  <Card key={r.id} className="p-card-pad">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-ui-bold text-body text-ink dark:text-night-text">{r.authorName}</Text>
                      <Stars rating={r.rating} size={13} />
                    </View>
                    {r.body ? (
                      <Text className="mt-1.5 font-ui text-meta leading-5 text-stone dark:text-night-muted">{r.body}</Text>
                    ) : null}
                    {r.hostResponse ? (
                      <View className="mt-2 rounded-field bg-sand-soft p-2.5 dark:bg-night-raised">
                        <Text className="font-ui text-overline uppercase tracking-wide text-stone">Host replied</Text>
                        <Text className="mt-0.5 font-ui text-meta text-ink dark:text-night-text">{r.hostResponse}</Text>
                      </View>
                    ) : null}
                  </Card>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky price bar */}
      <View className="flex-row items-center gap-4 border-t border-sand bg-white px-gutter pb-2 pt-3 dark:border-night-line dark:bg-night-raised">
        <View className="flex-row items-baseline">
          <Text className="font-display text-title text-coral">{formatDollars(vehicle.dailyRateCents)}</Text>
          <Text className="font-ui text-meta text-stone dark:text-night-muted">/day</Text>
        </View>
        <Button
          label={vehicle.instantBook ? '⚡ Book instantly' : 'Request to book'}
          variant={vehicle.instantBook ? 'primary' : 'ink'}
          className="flex-1"
          onPress={() => {
            if (params.vehicle) {
              navigation.navigate(ROUTES.CHECKOUT, {
                vehicle: params.vehicle,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              });
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default VehicleDetailScreen;
