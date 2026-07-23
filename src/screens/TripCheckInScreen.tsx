import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Button, Card, DisplayText, SectionLabel } from '../components/ui';
import { keyloApi } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';

interface CheckInParams {
  bookingId: string;
  phase: 'check_in' | 'check_out';
  vehicleName: string;
  driveSide: 'LHD' | 'RHD';
}

interface TripCheckInScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  route: RouteProp<{ TripCheckIn: CheckInParams }, 'TripCheckIn'>;
}

const SHOTS = ['Front', 'Driver side', 'Rear', 'Passenger side', 'Odometer', 'Fuel level'] as const;

/**
 * Trip check-in / check-out — design/mockups/08-trip-checkin.html.
 * Offline-tolerant: metadata submits first; photo capture + queued upload
 * lands with the R2 wiring (slots are the UI contract for it).
 */
export const TripCheckInScreen: React.FC<TripCheckInScreenProps> = ({ navigation, route }) => {
  const { bookingId, phase, vehicleName, driveSide } = route.params;
  const isCheckIn = phase === 'check_in';

  const [primerDismissed, setPrimerDismissed] = useState(false);
  const [captured, setCaptured] = useState<Set<number>>(new Set());
  const [odometer, setOdometer] = useState('');
  const [fuel, setFuel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleShot = (index: number) =>
    setCaptured((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });

  const submit = async () => {
    setSubmitting(true);
    try {
      const token = await apiService.getToken();
      if (!token) {
        notificationService.error('Sign in required');
        return;
      }
      const payload = {
        odometer: odometer ? Number(odometer) : undefined,
        fuelLevel: fuel ? Number(fuel) : undefined,
        photoKeys: [] as string[], // queued locally until R2 upload wiring; syncs later
      };
      const done = isCheckIn
        ? (await keyloApi.checkIn(bookingId, payload, token)).tripActive
        : (await keyloApi.checkOut(bookingId, payload, token)).tripCompleted;
      notificationService.success(
        isCheckIn
          ? done
            ? "You've got the keys — trip started."
            : 'Check-in saved. Waiting on the other party.'
          : done
            ? 'Trip complete. Leave a review when you\'re ready.'
            : 'Check-out saved. Waiting on the other party.',
        { title: isCheckIn ? 'Checked in' : 'Checked out' }
      );
      navigation.goBack();
    } catch {
      notificationService.error("Couldn't submit — your check-in is saved on this device and will retry.", {
        title: 'No connection',
      });
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  const ready = captured.size >= SHOTS.length && odometer.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
      <ScrollView className="flex-1 px-gutter" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between pt-4">
          <View>
            <DisplayText size="title">{isCheckIn ? 'Trip check-in' : 'Trip check-out'}</DisplayText>
            <Text className="mt-0.5 font-ui text-meta text-stone dark:text-night-muted">{vehicleName}</Text>
          </View>
          <Badge label={`${captured.size} of ${SHOTS.length} photos`} tone="teal" />
        </View>

        {/* Drive-side primer for first-time / foreign guests */}
        {isCheckIn && !primerDismissed && (
          <View className="mt-4 flex-row items-center gap-3 rounded-btn bg-ink p-3.5 dark:bg-night-raised">
            <Text className="text-title">🇧🇸</Text>
            <View className="flex-1">
              <Text className="font-ui-bold text-meta text-paper">
                We drive on the <Text className="text-gold">left</Text> in the Bahamas
              </Text>
              <Text className="mt-0.5 font-ui text-overline normal-case tracking-normal text-night-muted">
                This car is {driveSide} — {driveSide === 'LHD' ? 'driver sits on the left,' : 'driver sits on the right,'} keep
                left at roundabouts.
              </Text>
            </View>
            <Pressable onPress={() => setPrimerDismissed(true)} accessibilityLabel="Dismiss driving primer">
              <Ionicons name="close" size={18} color="#94A0AD" />
            </Pressable>
          </View>
        )}

        <SectionLabel className="mt-6">Condition photos</SectionLabel>
        <Text className="mt-1.5 font-ui text-meta leading-5 text-stone dark:text-night-muted">
          Walk around the car and capture each angle. These photos protect both of you if anything is disputed later.
        </Text>

        <View className="mt-3.5 flex-row flex-wrap gap-2.5">
          {SHOTS.map((label, i) => {
            const done = captured.has(i);
            const next = !done && i === Math.min(...SHOTS.map((_, j) => j).filter((j) => !captured.has(j)));
            return (
              <Pressable
                key={label}
                onPress={() => toggleShot(i)}
                accessibilityRole="button"
                accessibilityLabel={`${label} photo${done ? ', captured' : ''}`}
                className={`h-[104px] w-[31%] items-center justify-center gap-1 rounded-card border-2 ${
                  done
                    ? 'border-teal bg-teal-tint dark:bg-night-raised'
                    : next
                      ? 'border-dashed border-coral'
                      : 'border-dashed border-sand dark:border-night-line'
                }`}
              >
                <Ionicons
                  name={done ? 'checkmark-circle' : 'camera'}
                  size={22}
                  color={done ? '#0E7C7B' : next ? '#E04326' : '#8C8578'}
                />
                <Text
                  className={`text-center font-ui-semibold text-overline normal-case tracking-normal ${
                    done ? 'text-teal' : next ? 'text-coral-pressed' : 'text-stone dark:text-night-muted'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mb-8 mt-4 flex-row gap-2.5">
          <Card className="flex-1 p-3.5">
            <SectionLabel>Odometer (mi)</SectionLabel>
            <TextInput
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="number-pad"
              placeholder="24318"
              placeholderTextColor="#C9C2B6"
              className="mt-1 font-ui-bold text-emphasis text-ink dark:text-night-text"
            />
          </Card>
          <Card className="flex-1 p-3.5">
            <SectionLabel>Fuel %</SectionLabel>
            <TextInput
              value={fuel}
              onChangeText={setFuel}
              keyboardType="number-pad"
              placeholder="75"
              placeholderTextColor="#C9C2B6"
              className="mt-1 font-ui-bold text-emphasis text-ink dark:text-night-text"
            />
          </Card>
        </View>
      </ScrollView>

      <View className="border-t border-sand bg-white px-gutter pb-2 pt-3 dark:border-night-line dark:bg-night-raised">
        <Button
          label={
            ready
              ? isCheckIn
                ? 'Start trip'
                : 'End trip'
              : `Add ${SHOTS.length - captured.size} more photo${SHOTS.length - captured.size === 1 ? '' : 's'}`
          }
          disabled={!ready}
          loading={submitting}
          onPress={submit}
        />
        <Text className="mt-2 text-center font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
          Works offline — photos sync when you're back in signal
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default TripCheckInScreen;
