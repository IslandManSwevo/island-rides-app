import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Button, Card, DisplayText } from '../components/ui';
import { keyloApi, ApiMe, ApiBooking } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { useUnifiedAuth } from '../context/UnifiedAuthContext';
import { ROUTES } from '../navigation/routes';

interface ProfileScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

const VERIFICATION_COPY: Record<string, { label: string; tone: 'teal' | 'gold' | 'danger' }> = {
  verified: { label: 'Complete', tone: 'teal' },
  pending: { label: 'In review', tone: 'gold' },
  rejected: { label: 'Action needed', tone: 'danger' },
  unverified: { label: 'Not started', tone: 'gold' },
};

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  badge?: { label: string; tone: 'teal' | 'gold' | 'danger' };
  onPress?: () => void;
  last?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ icon, label, value, badge, onPress, last = false }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    className={`min-h-[44px] flex-row items-center justify-between py-3 ${
      last ? '' : 'border-b border-sand dark:border-night-line'
    }`}
  >
    <View className="flex-row items-center gap-2.5">
      <Ionicons name={icon} size={17} color="#8C8578" />
      <Text className="font-ui-semibold text-meta text-ink dark:text-night-text">{label}</Text>
    </View>
    <View className="flex-row items-center gap-2">
      {badge ? (
        <Badge label={badge.label} tone={badge.tone} />
      ) : (
        !!value && <Text className="font-ui text-meta text-stone dark:text-night-muted">{value}</Text>
      )}
      {!!onPress && <Ionicons name="chevron-forward" size={16} color="#8C8578" />}
    </View>
  </Pressable>
);

/**
 * Profile — design/mockups/13-profile.html.
 *
 * Also the home of the guest↔host mode switch (design/02-user-flows.md): there
 * is deliberately no top-level toggle, because most people are guests most of
 * the time and a top-level control would imply the two carry equal weight.
 */
export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { logout } = useUnifiedAuth();
  const [me, setMe] = useState<ApiMe | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [trips, setTrips] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await apiService.getToken();
      if (!token) {
        setSignedOut(true);
        setMe(null);
        return;
      }
      // Favorites and trips are decoration on this screen — a failure there
      // shouldn't blank out the profile.
      const [profile, favs, bookings] = await Promise.all([
        keyloApi.me(token),
        keyloApi.favorites(token).catch(() => ({ vehicleIds: [] as string[] })),
        keyloApi.myBookings(token).catch(() => ({ bookings: [] as ApiBooking[] })),
      ]);
      setMe(profile.user);
      setFavoriteCount(favs.vehicleIds.length);
      setTrips(bookings.bookings);
      setSignedOut(false);
    } catch {
      setSignedOut(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const isHost = me?.role === 'host' || me?.role === 'admin';
  const completedTrips = trips.filter((t) => t.status === 'completed' || t.status === 'reviewed').length;
  const verification = VERIFICATION_COPY[me?.verificationStatus ?? 'unverified'];

  /**
   * CustomerApp and HostApp are siblings in the root stack, so switching modes
   * is a plain navigate — the same route LoginScreen uses for guest browsing.
   * Before this shipped, the host tab bar was unreachable from inside the app.
   */
  const switchToHosting = () => navigation.navigate('HostApp' as never);
  const switchToGuest = () => navigation.navigate('CustomerApp' as never);

  const becomeHost = () =>
    Alert.alert(
      'Become a host',
      "You'll set up a host profile, then list your first car — plate, photos, pricing, and your insurance document. KeyLo reviews the listing before it goes live.",
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Get started',
          onPress: async () => {
            try {
              const token = await apiService.getToken();
              if (!token || !me) return;
              await keyloApi.becomeHost({ displayName: `${me.firstName} ${me.lastName}`.trim() }, token);
              notificationService.success("You're set up as a host. Next: list your first car.");
              await load();
              switchToHosting();
            } catch {
              notificationService.error("Couldn't set up hosting — try again in a moment.");
            }
          },
        },
      ]
    );

  const confirmSignOut = () =>
    Alert.alert('Sign out?', "You'll need to sign in again to see your trips.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);

  if (signedOut) {
    return (
      <SafeAreaView className="flex-1 bg-paper px-gutter dark:bg-night" edges={['top']}>
        <DisplayText size="headline" className="pt-2">
          Profile
        </DisplayText>
        <Card className="mt-6 items-center p-8">
          <Text className="text-center font-display text-title text-ink dark:text-night-text">Sign in to KeyLo</Text>
          <Text className="mt-2 text-center font-ui text-body text-stone dark:text-night-muted">
            Browsing is open to everyone. Booking a car needs an account.
          </Text>
          <Button
            label="Sign in or create account"
            className="mt-4 w-full"
            onPress={() => navigation.navigate('Auth' as never)}
          />
        </Card>
      </SafeAreaView>
    );
  }

  const displayName = me ? `${me.firstName} ${me.lastName.charAt(0)}.` : '';
  const joinedYear = me ? new Date(me.createdAt).getFullYear() : null;

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top']}>
      <ScrollView
        className="flex-1 px-gutter"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
      >
        <DisplayText size="headline" className="pt-2">
          Profile
        </DisplayText>

        {/* Identity card */}
        <Card className="mt-4 flex-row items-center gap-3.5 p-card-pad">
          <View className="h-14 w-14 items-center justify-center rounded-pill bg-ink dark:bg-night-raised">
            <Text className="font-ui-bold text-emphasis text-paper">
              {me ? `${me.firstName[0] ?? ''}${me.lastName[0] ?? ''}`.toUpperCase() : '—'}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <DisplayText size="title" numberOfLines={1} className="shrink">
                {displayName}
              </DisplayText>
              {me?.verificationStatus === 'verified' && <Badge label="✓ KeyLo verified" tone="teal" />}
            </View>
            <Text className="mt-0.5 font-ui text-meta text-stone dark:text-night-muted">
              {joinedYear ? `Joined ${joinedYear}` : ''}
              {completedTrips > 0 ? ` · ${completedTrips} trip${completedTrips === 1 ? '' : 's'}` : ''}
            </Text>
          </View>
        </Card>

        {/* Mode switch — become a host, or hop between the two tab bars */}
        <Card hero className="mt-3.5 border-0 bg-ink p-card-pad dark:bg-night-raised">
          {isHost ? (
            <>
              <Text className="font-ui-bold text-body text-paper">Switch to hosting</Text>
              <Text className="mt-1 font-ui text-meta leading-5 text-night-muted">
                Your fleet, today's pickups and returns, inbound requests, and earnings.
              </Text>
            </>
          ) : (
            <>
              <Text className="font-ui-bold text-body text-paper">Your driveway could be earning.</Text>
              <Text className="mt-1 font-ui text-meta leading-5 text-night-muted">
                Hosts in Nassau with one car earn roughly $400–$800 a month. You set the calendar — block off the days
                you need your car, rent it the rest.
              </Text>
            </>
          )}
          <Pressable
            onPress={isHost ? switchToHosting : becomeHost}
            accessibilityRole="button"
            className="mt-3 min-h-[44px] flex-row items-center justify-center self-start rounded-pill bg-coral px-4"
          >
            <Text className="font-ui-semibold text-meta text-white">
              {isHost ? 'Go to host mode' : 'Become a host'}
            </Text>
          </Pressable>
        </Card>

        {/* Settings */}
        <Card className="mt-3.5 px-card-pad">
          <SettingsRow
            icon="heart-outline"
            label="Favorites"
            value={favoriteCount > 0 ? `${favoriteCount} saved` : 'None yet'}
            onPress={() => navigation.navigate(ROUTES.FAVORITES)}
          />
          <SettingsRow
            icon="search-outline"
            label="Saved searches"
            onPress={() => navigation.navigate(ROUTES.SAVED_SEARCHES)}
          />
          <SettingsRow icon="id-card-outline" label="Verification" badge={verification} />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate(ROUTES.NOTIFICATION_PREFERENCES)}
          />
          <SettingsRow
            icon="card-outline"
            label="Payments & receipts"
            onPress={() => navigation.navigate(ROUTES.PAYMENT_HISTORY)}
          />
          {me?.role === 'admin' && (
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Insurance review"
              onPress={() => navigation.navigate(ROUTES.ADMIN_REVIEW)}
            />
          )}
          <SettingsRow icon="help-circle-outline" label="Help & legal" last />
        </Card>

        {isHost && (
          <Pressable
            onPress={switchToGuest}
            accessibilityRole="button"
            className="mt-3.5 min-h-[44px] items-center justify-center"
          >
            <Text className="font-ui-semibold text-meta text-teal">Switch back to booking</Text>
          </Pressable>
        )}

        <Button label="Sign out" variant="ghost" className="mt-3.5" onPress={confirmSignOut} />

        <Text className="mb-8 mt-4 text-center font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
          KeyLo v1 · Terms · Privacy · Licences
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
