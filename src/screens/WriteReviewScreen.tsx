import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, DisplayText, SectionLabel } from '../components/ui';
import { keyloApi, KeyloApiError } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';

/**
 * Two-sided review — guests review the car, hosts review the guest. On the kit.
 * Accepts { bookingId } or a legacy { booking: { id } } param so all callers work.
 */
export const WriteReviewScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const params = route.params ?? {};
  const bookingId = String(params.bookingId ?? params.booking?.id ?? '');
  const vehicleName: string | undefined = params.vehicleName
    ? params.vehicleName
    : params.booking?.vehicle
      ? `${params.booking.vehicle.make ?? ''} ${params.booking.vehicle.model ?? ''}`.trim()
      : undefined;

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      const token = await apiService.getToken();
      if (!token) {
        notificationService.error('Sign in to leave a review');
        return;
      }
      await keyloApi.submitReview(bookingId, { rating, body: body.trim() || undefined }, token);
      notificationService.success('Thanks — your review is in.', { title: 'Review submitted' });
      navigation.goBack();
    } catch (e) {
      notificationService.error(
        e instanceof KeyloApiError ? e.message : "Couldn't submit your review — try again.",
        { title: 'Review failed' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
      <ScrollView className="flex-1 px-gutter" showsVerticalScrollIndicator={false} contentContainerClassName="pt-5">
        <DisplayText size="title">How was the trip?</DisplayText>
        {vehicleName ? (
          <Text className="mt-1 font-ui text-body text-stone dark:text-night-muted">{vehicleName}</Text>
        ) : null}

        <Card className="mt-5 items-center p-6">
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} onPress={() => setRating(i)} accessibilityLabel={`${i} star${i > 1 ? 's' : ''}`}>
                <Text style={{ fontSize: 40, color: i <= rating ? '#E8B44C' : '#E8E0D4' }}>★</Text>
              </Pressable>
            ))}
          </View>
          <Text className="mt-3 font-ui text-meta text-stone dark:text-night-muted">
            {['Tap to rate', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
          </Text>
        </Card>

        <SectionLabel className="mt-6">Your review (optional)</SectionLabel>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="How was the car, the host, the handoff?"
          placeholderTextColor="#C9C2B6"
          className="mt-2 min-h-[120px] rounded-card border border-sand bg-white px-4 py-3 font-ui text-body text-ink dark:border-night-line dark:bg-night-raised dark:text-night-text"
          textAlignVertical="top"
        />
      </ScrollView>

      <View className="border-t border-sand px-gutter py-3 dark:border-night-line">
        <Button label="Submit review" disabled={rating < 1} loading={submitting} onPress={submit} />
      </View>
    </SafeAreaView>
  );
};

export default WriteReviewScreen;
