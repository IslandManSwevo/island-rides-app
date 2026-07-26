import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Card, DisplayText, SectionLabel, VehicleImage } from '../components/ui';
import { keyloApi, ApiVehicle, formatDollars, primaryPhotoUrl } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { ROUTES } from '../navigation/routes';

interface VehicleManagerParams {
  vehicleId: string;
}

interface VehicleManagerScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  route: RouteProp<{ VehicleManager: VehicleManagerParams }, 'VehicleManager'>;
}

interface SectionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  onPress: () => void;
  last?: boolean;
}

const SectionRow: React.FC<SectionRowProps> = ({ icon, label, detail, onPress, last = false }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    className={`min-h-[44px] flex-row items-center gap-3 py-3 ${
      last ? '' : 'border-b border-sand dark:border-night-line'
    }`}
  >
    <Ionicons name={icon} size={18} color="#8C8578" />
    <View className="flex-1">
      <Text className="font-ui-semibold text-meta text-ink dark:text-night-text">{label}</Text>
      <Text className="mt-0.5 font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
        {detail}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#8C8578" />
  </Pressable>
);

/**
 * Vehicle Manager — the single surface design/03-screen-inventory.md calls for,
 * merging VehiclePhotoUpload, VehicleAvailability, VehicleDocumentManagement
 * and VehicleConditionTracker into sections that hang off one Fleet card.
 *
 * Those four screens still exist and still hold the real editing UI; this is the
 * hub that finally makes them reachable — before it, Fleet cards jumped straight
 * to the listing form and the management screens were orphaned in the stack.
 */
export const VehicleManagerScreen: React.FC<VehicleManagerScreenProps> = ({ navigation, route }) => {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<ApiVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInstant, setSavingInstant] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await keyloApi.vehicle(vehicleId);
      setVehicle(res.vehicle);
    } catch {
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const toggleInstantBook = async (next: boolean) => {
    if (!vehicle) return;
    setSavingInstant(true);
    setVehicle({ ...vehicle, instantBook: next }); // optimistic
    try {
      const token = await apiService.getToken();
      if (!token) return;
      await keyloApi.vehicleSettings(vehicle.id, { instantBook: next }, token);
    } catch {
      setVehicle({ ...vehicle, instantBook: !next }); // roll back
      notificationService.error("Couldn't save that setting — try again.");
    } finally {
      setSavingInstant(false);
    }
  };

  if (loading && !vehicle) {
    return (
      <SafeAreaView className="flex-1 bg-paper px-gutter dark:bg-night" edges={['bottom']}>
        <View className="mt-4 h-24 rounded-card bg-sand-soft dark:bg-night-raised" />
        <View className="mt-3.5 h-64 rounded-card bg-sand-soft dark:bg-night-raised" />
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView className="flex-1 bg-paper px-gutter dark:bg-night" edges={['bottom']}>
        <Card className="mt-6 border-l-4 border-l-coral p-5">
          <Text className="font-display text-title text-ink dark:text-night-text">Couldn't load this car.</Text>
          <Pressable onPress={load} className="mt-3 self-start">
            <Badge label="Retry" tone="coral" />
          </Pressable>
        </Card>
      </SafeAreaView>
    );
  }

  const photoCount = vehicle.photos?.length ?? 0;
  const live = vehicle.verificationStatus === 'verified' && !vehicle.unlistedAt;

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
      <ScrollView className="flex-1 px-gutter" showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <Card className="mt-4 flex-row items-center gap-3 p-card-pad">
          <VehicleImage url={primaryPhotoUrl(vehicle)} iconSize={28} className="h-14 w-[72px] rounded-field" />
          <View className="flex-1">
            <DisplayText size="title" numberOfLines={1}>
              {vehicle.make} {vehicle.model} {vehicle.year}
            </DisplayText>
            <Text className="mt-0.5 font-ui text-meta text-stone dark:text-night-muted">
              {formatDollars(vehicle.dailyRateCents)}/day · {vehicle.seats} seats · {vehicle.driveSide}
            </Text>
          </View>
          {live ? (
            <Badge label="✓ Live" tone="teal" />
          ) : vehicle.verificationStatus === 'pending' ? (
            <Badge label="In review" tone="gold" />
          ) : (
            <Badge label="Not listed" tone="danger" />
          )}
        </Card>

        {/* Instant Book — the one setting worth surfacing inline */}
        <Card className="mt-3.5 flex-row items-center justify-between p-card-pad">
          <View className="flex-1 pr-3">
            <Text className="font-ui-semibold text-meta text-ink dark:text-night-text">⚡ Instant Book</Text>
            <Text className="mt-0.5 font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
              {vehicle.instantBook
                ? 'Guests book without waiting on you.'
                : 'Guests send a request you have 24 hours to answer.'}
            </Text>
          </View>
          <Switch
            value={vehicle.instantBook}
            onValueChange={toggleInstantBook}
            disabled={savingInstant}
            trackColor={{ false: '#E8E0D4', true: '#FF5A3C' }}
            thumbColor="#FFFFFF"
          />
        </Card>

        <SectionLabel className="mt-6">Manage</SectionLabel>
        <Card className="mt-2 px-card-pad">
          <SectionRow
            icon="images-outline"
            label="Photos"
            detail={photoCount > 0 ? `${photoCount} uploaded` : 'None yet — listings with photos book far more'}
            onPress={() => navigation.navigate(ROUTES.VEHICLE_PHOTO_UPLOAD, { vehicleId })}
          />
          <SectionRow
            icon="calendar-outline"
            label="Calendar & pricing"
            detail="Blocked dates, seasonal price overrides"
            onPress={() => navigation.navigate(ROUTES.VEHICLE_AVAILABILITY, { vehicleId })}
          />
          <SectionRow
            icon="options-outline"
            label="Listing & booking settings"
            detail="Rate, discounts, notice, trip length, extras, delivery"
            onPress={() => navigation.navigate(ROUTES.LIST_VEHICLE, { vehicleId })}
          />
          <SectionRow
            icon="document-text-outline"
            label="Documents"
            detail="Registration, insurance, inspection"
            onPress={() => navigation.navigate(ROUTES.VEHICLE_DOCUMENT_MANAGEMENT, { vehicleId })}
          />
          <SectionRow
            icon="construct-outline"
            label="Condition"
            detail="Fed by trip check-in and check-out photos"
            onPress={() => navigation.navigate(ROUTES.VEHICLE_CONDITION_TRACKER, { vehicleId })}
            last
          />
        </Card>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default VehicleManagerScreen;
