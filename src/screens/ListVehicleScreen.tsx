import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Button, Card, Chip, DisplayText, Field, SectionLabel, VehicleImage } from '../components/ui';
import { keyloApi, ApiIsland, formatDollars, photoUrl } from '../services/keyloApi';
import { pickAndUpload } from '../services/uploadService';
import { apiService } from '../services/apiService';
import { useUnifiedAuth } from '../context/UnifiedAuthContext';
import { notificationService } from '../services/notificationService';
import { ROUTES } from '../navigation/routes';

interface ListVehicleScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  route: RouteProp<{ ListVehicle: { vehicleId?: string } | undefined }, 'ListVehicle'>;
}

const VEHICLE_TYPES = ['sedan', 'suv', 'truck', 'van', 'convertible', 'coupe', 'hatchback'];
const STEPS = ['Basics', 'Photos', 'Location', 'Pricing', 'Booking', 'Review'] as const;

const toCents = (s: string) => Math.round((parseFloat(s) || 0) * 100);

/**
 * List a vehicle — the 6-step host wizard (design/03-screen-inventory.md), all
 * on the KeyLo kit. Publish runs become-host → create → photos → details →
 * settings → submit. Also used in edit mode when route has a vehicleId.
 */
export const ListVehicleScreen: React.FC<ListVehicleScreenProps> = ({ navigation, route }) => {
  const { user } = useUnifiedAuth();
  const editingId = route.params?.vehicleId;

  const [step, setStep] = useState(0);
  const [islands, setIslands] = useState<ApiIsland[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]); // R2 keys
  const [uploading, setUploading] = useState(false);

  // Form state
  const [islandId, setIslandId] = useState('nassau');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vehicleType, setVehicleType] = useState('suv');
  const [driveSide, setDriveSide] = useState<'LHD' | 'RHD'>('LHD');
  const [seats, setSeats] = useState('5');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [airportPickup, setAirportPickup] = useState(false);
  const [airportFee, setAirportFee] = useState('25');
  const [delivery, setDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('20');
  const [dailyRate, setDailyRate] = useState('');
  const [deposit, setDeposit] = useState('500');
  const [weeklyDiscount, setWeeklyDiscount] = useState('10');
  const [instantBook, setInstantBook] = useState(true);
  const [minTrip, setMinTrip] = useState('1');
  const [maxTrip, setMaxTrip] = useState('30');

  React.useEffect(() => {
    keyloApi
      .islands()
      .then((res) => setIslands(res.islands))
      .catch(() => setIslands([{ id: 'nassau', name: 'Nassau', features: [] }]));
  }, []);

  const addPhoto = async () => {
    setUploading(true);
    try {
      const uploaded = await pickAndUpload('vehicle_photo');
      if (uploaded) setPhotos((prev) => [...prev, uploaded.key]);
    } catch {
      notificationService.error('Photo upload failed — try again.');
    } finally {
      setUploading(false);
    }
  };

  const canAdvance = (): boolean => {
    if (step === 0) return !!(make.trim() && model.trim() && year.length === 4);
    if (step === 1) return photos.length >= 1;
    if (step === 3) return toCents(dailyRate) >= 1000;
    return true;
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const token = await apiService.getToken();
      if (!token) {
        notificationService.error('Sign in to list a car');
        return;
      }
      if (user?.role !== 'host') {
        await keyloApi.becomeHost(
          { displayName: `${user?.firstName ?? 'KeyLo'} ${user?.lastName ?? 'Host'}`.trim() },
          token
        );
      }

      const { vehicle } = await keyloApi.createVehicle(
        {
          islandId,
          make: make.trim(),
          model: model.trim(),
          year: Number(year),
          vehicleType,
          driveSide,
          seats: Number(seats) || 5,
          dailyRateCents: toCents(dailyRate),
          description: description.trim() || undefined,
        },
        token
      );

      await keyloApi.saveVehiclePhotos(vehicle.id, photos.map((key) => ({ key })), token);
      await keyloApi.updateVehicle(
        vehicle.id,
        {
          securityDepositCents: toCents(deposit),
          weeklyDiscountBps: (parseInt(weeklyDiscount, 10) || 0) * 100,
          address: address.trim() || undefined,
          airportPickup,
          airportFeeCents: airportPickup ? toCents(airportFee) : 0,
          deliveryAvailable: delivery,
          deliveryFeeCents: delivery ? toCents(deliveryFee) : 0,
        },
        token
      );
      await keyloApi.vehicleSettings(
        vehicle.id,
        { instantBook, minTripDays: Number(minTrip) || 1, maxTripDays: Number(maxTrip) || 30 },
        token
      );
      await keyloApi.submitVehicle(vehicle.id, token);

      notificationService.success('Your car is live on KeyLo.', { title: "You're hosting" });
      navigation.navigate(ROUTES.FLEET_MANAGEMENT);
    } catch (e) {
      notificationService.error(e instanceof Error ? e.message : 'Could not publish — try again.', {
        title: 'Publish failed',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
      {/* Progress */}
      <View className="px-gutter pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-ui-semibold text-overline uppercase tracking-wide text-stone dark:text-night-muted">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </Text>
          {editingId && <Text className="font-ui text-overline text-teal">Editing</Text>}
        </View>
        <View className="mt-2 flex-row gap-1.5">
          {STEPS.map((_, i) => (
            <View
              key={i}
              className={`h-1 flex-1 rounded-full ${i < step ? 'bg-teal' : i === step ? 'bg-coral' : 'bg-sand dark:bg-night-line'}`}
            />
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-gutter" showsVerticalScrollIndicator={false} contentContainerClassName="pt-5">
        {step === 0 && (
          <View className="gap-3.5">
            <DisplayText size="title">Tell us about your car</DisplayText>
            <View className="flex-row gap-3">
              <Field label="Make" className="flex-1" value={make} onChangeText={setMake} placeholder="Toyota" />
              <Field label="Model" className="flex-1" value={model} onChangeText={setModel} placeholder="RAV4" />
            </View>
            <View className="flex-row gap-3">
              <Field label="Year" className="flex-1" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} placeholder="2024" />
              <Field label="Seats" className="flex-1" value={seats} onChangeText={setSeats} keyboardType="number-pad" />
            </View>
            <SectionLabel>Type</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {VEHICLE_TYPES.map((t) => (
                <Chip key={t} label={t} active={vehicleType === t} onPress={() => setVehicleType(t)} />
              ))}
            </View>
            <SectionLabel>Drive side</SectionLabel>
            <View className="flex-row gap-2">
              <Chip label="LHD (left-hand)" active={driveSide === 'LHD'} onPress={() => setDriveSide('LHD')} />
              <Chip label="RHD (right-hand)" active={driveSide === 'RHD'} onPress={() => setDriveSide('RHD')} />
            </View>
            <SectionLabel>Island</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {islands.map((i) => (
                <Chip key={i.id} label={i.name.replace(/\s*\(.*\)/, '')} active={islandId === i.id} onPress={() => setIslandId(i.id)} />
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View className="gap-3.5">
            <DisplayText size="title">Add photos</DisplayText>
            <Text className="font-ui text-meta text-stone dark:text-night-muted">
              The first photo is your cover. Add at least one; more is better.
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              {photos.map((key, i) => (
                <View key={key} className="relative h-24 w-[31%] overflow-hidden rounded-card">
                  <VehicleImage url={photoUrl(key)} iconSize={24} className="h-24 w-full" />
                  {i === 0 && (
                    <View className="absolute bottom-1 left-1 rounded-full bg-ink/80 px-2 py-0.5">
                      <Text className="font-ui-bold text-[9px] text-paper">Cover</Text>
                    </View>
                  )}
                  <Pressable onPress={() => setPhotos((p) => p.filter((k) => k !== key))} className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-ink/80">
                    <Ionicons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={addPhoto}
                disabled={uploading}
                className="h-24 w-[31%] items-center justify-center gap-1 rounded-card border-2 border-dashed border-coral"
              >
                <Ionicons name={uploading ? 'cloud-upload-outline' : 'camera'} size={22} color="#E04326" />
                <Text className="font-ui-semibold text-overline text-coral-pressed">Add</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="gap-3.5">
            <DisplayText size="title">Where & delivery</DisplayText>
            <Field label="Pickup address / area" value={address} onChangeText={setAddress} placeholder="Cable Beach, Nassau" />
            <Card className="flex-row items-center justify-between p-card-pad">
              <Text className="font-ui-semibold text-body text-ink dark:text-night-text">Airport pickup</Text>
              <Switch value={airportPickup} onValueChange={setAirportPickup} trackColor={{ true: '#FF5A3C' }} />
            </Card>
            {airportPickup && <Field label="Airport fee ($)" value={airportFee} onChangeText={setAirportFee} keyboardType="decimal-pad" />}
            <Card className="flex-row items-center justify-between p-card-pad">
              <Text className="font-ui-semibold text-body text-ink dark:text-night-text">Deliver to guest</Text>
              <Switch value={delivery} onValueChange={setDelivery} trackColor={{ true: '#FF5A3C' }} />
            </Card>
            {delivery && <Field label="Delivery fee ($)" value={deliveryFee} onChangeText={setDeliveryFee} keyboardType="decimal-pad" />}
          </View>
        )}

        {step === 3 && (
          <View className="gap-3.5">
            <DisplayText size="title">Set your price</DisplayText>
            <Field label="Daily rate ($)" value={dailyRate} onChangeText={setDailyRate} keyboardType="decimal-pad" placeholder="74" />
            <View className="flex-row gap-3">
              <Field label="Weekly discount (%)" className="flex-1" value={weeklyDiscount} onChangeText={setWeeklyDiscount} keyboardType="number-pad" />
              <Field label="Deposit ($)" className="flex-1" value={deposit} onChangeText={setDeposit} keyboardType="decimal-pad" />
            </View>
            <Text className="font-ui text-meta text-stone dark:text-night-muted">
              Description (optional)
            </Text>
            <Field value={description} onChangeText={setDescription} multiline placeholder="Garage-kept, great on island roads…" style={{ minHeight: 80 }} />
          </View>
        )}

        {step === 4 && (
          <View className="gap-3.5">
            <DisplayText size="title">Booking settings</DisplayText>
            <Card className="flex-row items-center justify-between p-card-pad">
              <View className="flex-1 pr-3">
                <Text className="font-ui-semibold text-body text-ink dark:text-night-text">⚡ Instant Book</Text>
                <Text className="font-ui text-meta text-stone dark:text-night-muted">Guests book without waiting for approval.</Text>
              </View>
              <Switch value={instantBook} onValueChange={setInstantBook} trackColor={{ true: '#FF5A3C' }} />
            </Card>
            <View className="flex-row gap-3">
              <Field label="Min trip (days)" className="flex-1" value={minTrip} onChangeText={setMinTrip} keyboardType="number-pad" />
              <Field label="Max trip (days)" className="flex-1" value={maxTrip} onChangeText={setMaxTrip} keyboardType="number-pad" />
            </View>
          </View>
        )}

        {step === 5 && (
          <View className="gap-3.5">
            <DisplayText size="title">Review & publish</DisplayText>
            <Card className="overflow-hidden">
              <VehicleImage url={photoUrl(photos[0])} className="h-40 w-full" />
              <View className="p-card-pad">
                <DisplayText size="title">{make} {model} {year}</DisplayText>
                <Text className="mt-1 font-ui text-meta text-stone dark:text-night-muted">
                  {vehicleType} · {seats} seats · {driveSide} · {islandId}
                </Text>
                <Text className="mt-2 font-display text-title text-coral">
                  {formatDollars(toCents(dailyRate))}<Text className="font-ui text-meta text-stone">/day</Text>
                </Text>
                <Text className="mt-1 font-ui text-meta text-stone dark:text-night-muted">
                  {instantBook ? '⚡ Instant Book' : 'Request to book'} · {photos.length} photo{photos.length === 1 ? '' : 's'}
                  {airportPickup ? ' · Airport pickup' : ''}{delivery ? ' · Delivery' : ''}
                </Text>
              </View>
            </Card>
            <Text className="font-ui text-meta text-stone dark:text-night-muted">
              Publishing lists your car in search right away. You can edit or unlist anytime from Fleet.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Nav bar */}
      <View className="flex-row gap-2 border-t border-sand px-gutter py-3 dark:border-night-line">
        {step > 0 && <Button label="Back" variant="ghost" className="flex-1" onPress={() => setStep((s) => s - 1)} />}
        {step < STEPS.length - 1 ? (
          <Button label="Continue" className="flex-1" disabled={!canAdvance()} onPress={() => setStep((s) => s + 1)} />
        ) : (
          <Button label="Publish listing" className="flex-1" loading={publishing} onPress={publish} />
        )}
      </View>
    </SafeAreaView>
  );
};

export default ListVehicleScreen;
