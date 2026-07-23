import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Card, DisplayText, SectionLabel, Stars } from '../components/ui';
import { keyloApi, ApiHostEarnings, ApiHostReview, formatDollars } from '../services/keyloApi';
import { apiService } from '../services/apiService';

interface FinancialReportsScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

const payoutTone = (status: string) => (status === 'paid' ? 'success' : status === 'failed' ? 'danger' : 'gold');

/** Earnings — FinancialReports + VehiclePerformance merged (design/03). */
export const FinancialReportsScreen: React.FC<FinancialReportsScreenProps> = ({ navigation }) => {
  const [earnings, setEarnings] = useState<ApiHostEarnings | null>(null);
  const [reviews, setReviews] = useState<{ average: number | null; count: number; list: ApiHostReview[] }>({
    average: null,
    count: 0,
    list: [],
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await apiService.getToken();
      if (!token) return;
      const [earn, revs] = await Promise.all([
        keyloApi.hostEarnings(token),
        keyloApi.hostReviews(token).catch(() => ({ average: null, count: 0, reviews: [] })),
      ]);
      setEarnings(earn.earnings);
      setReviews({ average: revs.average, count: revs.count, list: revs.reviews });
    } catch {
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const totalCents = earnings?.perVehicle.reduce((sum, v) => sum + v.earningsCents, 0) ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top']}>
      <ScrollView
        className="flex-1 px-gutter"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
        showsVerticalScrollIndicator={false}
      >
        <DisplayText size="headline" className="pt-2">
          Earnings
        </DisplayText>

        <View className="mt-3.5 rounded-card bg-ink p-card-pad dark:bg-night-raised">
          <Text className="font-ui-bold text-overline uppercase text-night-muted">All-time earnings</Text>
          <Text className="mt-1 font-display text-headline text-paper">{formatDollars(totalCents)}</Text>
          <Text className="mt-1 font-ui text-overline normal-case tracking-normal text-night-muted">
            Your split: {((earnings?.splitBps ?? 8000) / 100).toFixed(0)}% ·{' '}
            {earnings?.payoutEnabled ? 'Payouts via PayPal' : 'Add a PayPal email to enable payouts'}
          </Text>
        </View>

        <SectionLabel className="mt-6">Per vehicle</SectionLabel>
        <Card className="mt-2 px-card-pad">
          {(earnings?.perVehicle ?? []).map((v, i, arr) => (
            <View
              key={v.vehicleId}
              className={`flex-row items-center justify-between py-3 ${
                i < arr.length - 1 ? 'border-b border-sand dark:border-night-line' : ''
              }`}
            >
              <View className="flex-1">
                <Text className="font-ui-semibold text-body text-ink dark:text-night-text">{v.name}</Text>
                <Text className="font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                  {v.trips} trip{v.trips === 1 ? '' : 's'}
                </Text>
              </View>
              <Text className="font-ui-bold text-body text-ink dark:text-night-text">
                {formatDollars(v.earningsCents)}
              </Text>
            </View>
          ))}
          {!loading && (earnings?.perVehicle.length ?? 0) === 0 && (
            <Text className="py-4 font-ui text-body text-stone dark:text-night-muted">
              Earnings appear here after your first confirmed trip.
            </Text>
          )}
        </Card>

        <SectionLabel className="mt-6">Payouts</SectionLabel>
        <Card className="mb-8 mt-2 px-card-pad">
          {(earnings?.payouts ?? []).map((p, i, arr) => (
            <View
              key={p.id}
              className={`flex-row items-center justify-between py-3 ${
                i < arr.length - 1 ? 'border-b border-sand dark:border-night-line' : ''
              }`}
            >
              <View>
                <Text className="font-ui-semibold text-body text-ink dark:text-night-text">
                  {formatDollars(p.amountCents)}
                </Text>
                <Text className="font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                  {new Date(p.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <Badge label={p.status} tone={payoutTone(p.status)} />
            </View>
          ))}
          {!loading && (earnings?.payouts.length ?? 0) === 0 && (
            <Text className="py-4 font-ui text-body text-stone dark:text-night-muted">
              Payouts land ~3 days after each trip starts.
            </Text>
          )}
        </Card>

        {/* Guest reviews of the host's cars */}
        <View className="mt-6 flex-row items-center justify-between">
          <SectionLabel>Reviews</SectionLabel>
          {reviews.average != null && (
            <View className="flex-row items-center gap-1.5">
              <Stars rating={reviews.average} size={13} />
              <Text className="font-ui-bold text-meta text-ink dark:text-night-text">
                {reviews.average} · {reviews.count}
              </Text>
            </View>
          )}
        </View>
        <Card className="mb-8 mt-2 px-card-pad">
          {reviews.list.slice(0, 8).map((r, i, arr) => (
            <View
              key={r.id}
              className={`py-3 ${i < arr.length - 1 ? 'border-b border-sand dark:border-night-line' : ''}`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-ui-semibold text-body text-ink dark:text-night-text">
                  {r.authorName} · {r.vehicle}
                </Text>
                <Stars rating={r.rating} size={12} />
              </View>
              {r.body ? (
                <Text className="mt-1 font-ui text-meta leading-5 text-stone dark:text-night-muted">{r.body}</Text>
              ) : null}
            </View>
          ))}
          {!loading && reviews.list.length === 0 && (
            <Text className="py-4 font-ui text-body text-stone dark:text-night-muted">
              Reviews from your guests show up here after their trips.
            </Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinancialReportsScreen;
