import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, DisplayText, SectionLabel } from './ui';
import { keyloApi } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { pickAndUpload } from '../services/uploadService';

export interface TripCheckInPanelProps {
  bookingId: string;
  phase: 'check_in' | 'check_out';
  vehicleName: string;
  driveSide: 'LHD' | 'RHD';
  /** Host's name, for the "who else is waiting on you" line. */
  hostName?: string;
  /** True once the other party has submitted their half of the evidence. */
  otherPartyDone?: boolean;
  /** Fired after a successful (or offline-queued) submit. */
  onDone: () => void;
}

const SHOTS = ['Front', 'Driver side', 'Rear', 'Passenger side', 'Odometer', 'Fuel level'] as const;

/**
 * The guided condition-photo capture — design/mockups/08-trip-checkin.html and
 * the check-in bottom sheet in 11-trip-detail.html.
 *
 * Rendered two ways: as a sheet over Trip Detail (the design's default entry
 * point) and as the standalone `TripCheckIn` route, which survives because it's
 * a deep-link target and the host side reaches check-out from its own stack.
 *
 * Offline-tolerant: metadata submits first, photo keys attach as uploads land.
 */
export const TripCheckInPanel: React.FC<TripCheckInPanelProps> = ({
  bookingId,
  phase,
  vehicleName,
  driveSide,
  hostName,
  otherPartyDone = false,
  onDone,
}) => {
  const isCheckIn = phase === 'check_in';

  const [primerDismissed, setPrimerDismissed] = useState(false);
  const [photos, setPhotos] = useState<Record<number, string>>({}); // slot index → R2 key
  const [uploading, setUploading] = useState<number | null>(null);
  const [odometer, setOdometer] = useState('');
  const [fuel, setFuel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const captured = new Set(Object.keys(photos).map(Number));
  const remaining = SHOTS.length - captured.size;
  const nextSlot = SHOTS.findIndex((_, i) => !captured.has(i));

  const captureShot = async (index: number) => {
    setUploading(index);
    try {
      const uploaded = await pickAndUpload('checkin_photo');
      if (uploaded) setPhotos((prev) => ({ ...prev, [index]: uploaded.key }));
    } catch {
      notificationService.error('Photo upload failed — check your connection and try again.');
    } finally {
      setUploading(null);
    }
  };

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
        photoKeys: Object.values(photos), // R2 keys captured above
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
            ? "Trip complete. Leave a review when you're ready."
            : 'Check-out saved. Waiting on the other party.',
        { title: isCheckIn ? 'Checked in' : 'Checked out' }
      );
      onDone();
    } catch {
      notificationService.error("Couldn't submit — your check-in is saved on this device and will retry.", {
        title: 'No connection',
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  const ready = captured.size >= SHOTS.length && odometer.length > 0;

  return (
    <>
      <ScrollView className="px-gutter" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between pt-4">
          <View className="flex-1 pr-2">
            <DisplayText size="title">{isCheckIn ? 'Trip check-in' : 'Trip check-out'}</DisplayText>
            <Text className="mt-0.5 font-ui text-meta text-stone dark:text-night-muted">
              {vehicleName}
              {hostName ? ` · with ${hostName}` : ''}
            </Text>
          </View>
          <Badge label={`${captured.size} of ${SHOTS.length} photos`} tone="teal" />
        </View>

        {/* Drive-side primer for first-time / foreign guests */}
        {isCheckIn && !primerDismissed && (
          <View className="mt-4 flex-row items-center gap-3 rounded-btn bg-ink p-3.5 dark:bg-night">
            <Text className="text-title">🇧🇸</Text>
            <View className="flex-1">
              <Text className="font-ui-bold text-meta text-paper">
                We drive on the <Text className="text-gold">left</Text> in the Bahamas
              </Text>
              <Text className="mt-0.5 font-ui text-overline normal-case tracking-normal text-night-muted">
                This car is {driveSide} — {driveSide === 'LHD' ? 'driver sits on the left,' : 'driver sits on the right,'}{' '}
                keep left at roundabouts.
              </Text>
            </View>
            <Pressable
              onPress={() => setPrimerDismissed(true)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss driving primer"
              hitSlop={12}
            >
              <Ionicons name="close" size={18} color="#94A0AD" />
            </Pressable>
          </View>
        )}

        <SectionLabel className="mt-6">{`Condition photos · ${captured.size} of ${SHOTS.length}`}</SectionLabel>
        <Text className="mt-1.5 font-ui text-meta leading-5 text-stone dark:text-night-muted">
          Walk around the car and capture each angle. These photos protect both of you if anything is disputed later.
        </Text>

        <View className="mt-3.5 flex-row flex-wrap gap-2.5">
          {SHOTS.map((label, i) => {
            const done = captured.has(i);
            const busy = uploading === i;
            const next = !done && i === nextSlot;
            return (
              <Pressable
                key={label}
                onPress={() => captureShot(i)}
                disabled={busy}
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
                  name={busy ? 'cloud-upload-outline' : done ? 'checkmark-circle' : 'camera'}
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

        <View className="mt-4 flex-row gap-2.5">
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

        {otherPartyDone && (
          <Text className="mb-8 mt-3.5 font-ui text-meta leading-5 text-stone dark:text-night-muted">
            {hostName ?? 'The host'} already completed their {isCheckIn ? 'check-in' : 'check-out'}. Your trip{' '}
            {isCheckIn ? 'starts' : 'closes out'} when yours is done.
          </Text>
        )}
        {!otherPartyDone && <View className="mb-8" />}
      </ScrollView>

      <View className="border-t border-sand bg-white px-gutter pb-2 pt-3 dark:border-night-line dark:bg-night-raised">
        <Button
          label={
            ready
              ? isCheckIn
                ? 'Start trip'
                : 'End trip'
              : captured.size < SHOTS.length
                ? `Add ${remaining} more photo${remaining === 1 ? '' : 's'}`
                : 'Enter the odometer reading'
          }
          disabled={!ready}
          loading={submitting}
          onPress={submit}
        />
        <Text className="mt-2 text-center font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
          Works offline — photos sync when you're back in signal
        </Text>
      </View>
    </>
  );
};

export default TripCheckInPanel;
