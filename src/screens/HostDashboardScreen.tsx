import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Button, Card, DisplayText, SectionLabel } from '../components/ui';
import { keyloApi, ApiHostDashboard, ApiHostBookingSummary, formatDollars } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';

interface HostDashboardScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const hoursLeft = (deadline?: string | null) =>
  deadline ? Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 3_600_000)) : null;

/** Host · Today — design/mockups/06-host-dashboard.html. The action queue. */
export const HostDashboardScreen = ({ navigation }: HostDashboardScreenProps) => {
  const [dashboard, setDashboard] = useState<ApiHostDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await apiService.getToken();
      if (!token) return;
      const res = await keyloApi.hostDashboard(token);
      setDashboard(res.dashboard);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const respond = async (booking: ApiHostBookingSummary, approve: boolean) => {
    setActing(booking.id);
    try {
      const token = await apiService.getToken();
      if (!token) return;
      if (approve) await keyloApi.approveBooking(booking.id, token);
      else await keyloApi.declineBooking(booking.id, undefined, token);
      notificationService.success(approve ? 'Booking confirmed — payment captured.' : 'Request declined.');
      load();
    } catch {
      notificationService.error("Couldn't update this request — try again.");
    } finally {
      setActing(null);
    }
  };

  const scheduleRow = (booking: ApiHostBookingSummary, kind: 'pickup' | 'return', last: boolean) => (
    <View
      key={booking.id}
      className={`flex-row items-center gap-2.5 py-3 ${last ? '' : 'border-b border-sand dark:border-night-line'}`}
    >
      <Badge label={timeOf(kind === 'pickup' ? booking.startAt : booking.endAt)} tone={kind === 'pickup' ? 'teal' : 'gold'} />
      <View className="flex-1">
        <Text className="font-ui text-body text-ink dark:text-night-text">
          <Text className="font-ui-bold">{kind === 'pickup' ? 'Pickup' : 'Return'}</Text> —{' '}
          {booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}` : 'Vehicle'}
          {booking.guest ? ` ${kind === 'pickup' ? '→' : '←'} ${booking.guest.firstName}` : ''}
        </Text>
        {booking.flightNumber && (
          <Text className="font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
            ✈ {booking.flightNumber}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top']}>
      <ScrollView
        className="flex-1 px-gutter"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
        showsVerticalScrollIndicator={false}
      >
        <DisplayText size="headline" className="pt-2">
          Today
        </DisplayText>

        {/* Earnings strip — ink card */}
        <View className="mt-3.5 flex-row rounded-card bg-ink p-card-pad dark:bg-night-raised">
          <View className="flex-1">
            <Text className="font-ui-bold text-overline uppercase text-night-muted">This month</Text>
            <Text className="mt-0.5 font-display text-title text-paper">
              {formatDollars(dashboard?.monthEarningsCents ?? 0)}
            </Text>
          </View>
          <View className="flex-1 border-l border-night-line pl-4">
            <Text className="font-ui-bold text-overline uppercase text-night-muted">Active trips</Text>
            <Text className="mt-1 font-ui-bold text-emphasis text-paper">{dashboard?.activeTrips ?? 0}</Text>
          </View>
          <View className="flex-1 border-l border-night-line pl-4">
            <Text className="font-ui-bold text-overline uppercase text-night-muted">Fleet</Text>
            <Text className="mt-1 font-ui-bold text-emphasis text-paper">{dashboard?.fleetSize ?? 0} cars</Text>
          </View>
        </View>

        {/* Request queue */}
        <SectionLabel className="mt-6">
          {`Needs your response · ${dashboard?.pendingRequests.length ?? 0}`}
        </SectionLabel>
        {(dashboard?.pendingRequests ?? []).map((booking) => (
          <Card key={booking.id} className="mt-2 border-coral p-card-pad">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-pill bg-sand-soft dark:bg-night-raised">
                <Text className="font-ui-bold text-meta text-ink dark:text-night-text">
                  {booking.guest?.firstName?.charAt(0) ?? '?'}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-ui-bold text-body text-ink dark:text-night-text">
                    {booking.guest ? `${booking.guest.firstName} ${booking.guest.lastName.charAt(0)}.` : 'Guest'}
                  </Text>
                  {booking.guest?.verificationStatus === 'verified' && <Badge label="✓ Verified" tone="teal" />}
                </View>
                <Text className="font-ui text-meta text-stone dark:text-night-muted">
                  {booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}` : ''} ·{' '}
                  {formatDollars(booking.totalCents)}
                </Text>
              </View>
              {hoursLeft(booking.approvalDeadline) !== null && (
                <Badge label={`${hoursLeft(booking.approvalDeadline)}h left`} tone="coral" />
              )}
            </View>
            <View className="mt-3 flex-row gap-2">
              <Button
                label="Accept"
                className="flex-1 p-2.5"
                loading={acting === booking.id}
                onPress={() => respond(booking, true)}
              />
              <Button
                label="Decline"
                variant="ghost"
                className="flex-1 p-2.5"
                disabled={acting === booking.id}
                onPress={() => respond(booking, false)}
              />
            </View>
          </Card>
        ))}
        {!loading && (dashboard?.pendingRequests.length ?? 0) === 0 && (
          <Card className="mt-2 items-center p-5">
            <Text className="font-ui text-body text-stone dark:text-night-muted">
              No requests waiting — you're all caught up.
            </Text>
          </Card>
        )}

        {/* Today's schedule */}
        <SectionLabel className="mt-6">Today's schedule</SectionLabel>
        <Card className="mb-8 mt-2 px-card-pad">
          {dashboard && (dashboard.todayPickups.length > 0 || dashboard.todayReturns.length > 0) ? (
            <>
              {dashboard.todayPickups.map((b, i) =>
                scheduleRow(b, 'pickup', i === dashboard.todayPickups.length - 1 && dashboard.todayReturns.length === 0)
              )}
              {dashboard.todayReturns.map((b, i) => scheduleRow(b, 'return', i === dashboard.todayReturns.length - 1))}
            </>
          ) : (
            <View className="flex-row items-center gap-2.5 py-4">
              <Ionicons name="sunny-outline" size={18} color="#8C8578" />
              <Text className="font-ui text-body text-stone dark:text-night-muted">
                No pickups or returns today.
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HostDashboardScreen;
