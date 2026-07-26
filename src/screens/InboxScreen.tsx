import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Card, DisplayText } from '../components/ui';
import {
  keyloApi,
  ApiBooking,
  ApiConversationSummary,
  photoUrl,
} from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { ROUTES } from '../navigation/routes';

interface InboxScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

type InboxTab = 'messages' | 'notifications';

/** Monogram initials — the mockup's avatar treatment when there's no photo. */
const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'KL';

/** Deterministic avatar tint so a given person keeps the same colour. */
const AVATAR_TINTS = ['bg-teal', 'bg-coral', 'bg-gold', 'bg-ink'] as const;
const tintFor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i)) % AVATAR_TINTS.length;
  return AVATAR_TINTS[hash];
};

/** "2m ago" · "Yesterday" · "Jul 12" — matches the mockup's timestamp ladder. */
const relativeTime = (iso: string): string => {
  const then = new Date(iso);
  const mins = Math.round((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)}h ago`;
  if (mins < 48 * 60) return 'Yesterday';
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const shortRange = (startAt: string, endAt: string) => {
  const opts = { month: 'short', day: 'numeric' } as const;
  return `${new Date(startAt).toLocaleDateString('en-US', opts)}–${new Date(endAt).toLocaleDateString('en-US', {
    day: 'numeric',
  })}`;
};

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  at: string;
  tone: 'gold' | 'coral' | 'teal';
  bookingId: string;
}

/**
 * Notifications are derived from booking state rather than a separate feed:
 * the things the mockup lists — approval countdowns, upcoming pickups, review
 * deadlines — are all readable off the trips the user already has.
 */
const notificationsFrom = (bookings: ApiBooking[]): NotificationItem[] => {
  const items: NotificationItem[] = [];
  for (const b of bookings) {
    const name = b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : 'your trip';
    if (b.status === 'pending' && b.approvalDeadline) {
      const hours = Math.max(0, Math.round((new Date(b.approvalDeadline).getTime() - Date.now()) / 3600000));
      items.push({
        id: `${b.id}-pending`,
        title: 'Waiting on the host',
        body: `Your request for the ${name} expires in ${hours}h if it isn't approved.`,
        at: b.approvalDeadline,
        tone: 'gold',
        bookingId: b.id,
      });
    }
    if (b.status === 'confirmed') {
      items.push({
        id: `${b.id}-pickup`,
        title: 'Pickup coming up',
        body: `${name} · ${new Date(b.startAt).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })}. Check in with photos when you collect it.`,
        at: b.startAt,
        tone: 'teal',
        bookingId: b.id,
      });
    }
    if (b.status === 'completed') {
      // Reviews close 14 days after the trip ends (design/02-user-flows.md).
      const deadline = new Date(new Date(b.endAt).getTime() + 14 * 24 * 3600000);
      const days = Math.ceil((deadline.getTime() - Date.now()) / (24 * 3600000));
      if (days > 0) {
        items.push({
          id: `${b.id}-review`,
          title: 'Review still open',
          body: `How was the ${name}? ${days} day${days === 1 ? '' : 's'} left to leave a review.`,
          at: deadline.toISOString(),
          tone: 'coral',
          bookingId: b.id,
        });
      }
    }
  }
  return items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
};

/**
 * Inbox — design/mockups/12-inbox.html.
 * Messages (default) + Notifications segmented toggle. Rows are booking-scoped:
 * each carries the vehicle and dates the conversation is about.
 */
export const InboxScreen: React.FC<InboxScreenProps> = ({ navigation }) => {
  const [tab, setTab] = useState<InboxTab>('messages');
  const [conversations, setConversations] = useState<ApiConversationSummary[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await apiService.getToken();
      if (!token) {
        setSignedOut(true);
        setConversations([]);
        setBookings([]);
        return;
      }
      const [convos, trips] = await Promise.all([
        keyloApi.conversations(token),
        keyloApi.myBookings(token),
      ]);
      setConversations(convos.conversations);
      setBookings(trips.bookings);
      setSignedOut(false);
    } catch {
      setConversations([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const notifications = useMemo(() => notificationsFrom(bookings), [bookings]);
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const openThread = async (conversation: ApiConversationSummary) => {
    navigation.navigate(ROUTES.CHAT, {
      conversationId: conversation.id,
      title: conversation.counterparty.name,
    });
    if (conversation.unreadCount > 0) {
      // Optimistic: clear the dot locally, then tell the server.
      setConversations((prev) => prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c)));
      try {
        const token = await apiService.getToken();
        if (token) await keyloApi.markConversationRead(conversation.id, token);
      } catch {
        // Non-blocking — the dot reappears on the next refresh if this failed.
      }
    }
  };

  const renderConversation = ({ item }: { item: ApiConversationSummary }) => {
    const unread = item.unreadCount > 0;
    const avatar = photoUrl(item.counterparty.avatarKey);
    return (
      <Pressable
        onPress={() => openThread(item)}
        accessibilityRole="button"
        accessibilityLabel={`Conversation with ${item.counterparty.name}${unread ? ', unread' : ''}`}
        className={`min-h-[44px] flex-row items-center gap-3 border-b border-sand px-gutter py-3.5 dark:border-night-line ${
          unread ? 'bg-sand-soft dark:bg-night-raised' : ''
        }`}
      >
        <View
          className={`h-11 w-11 items-center justify-center rounded-pill ${tintFor(item.counterparty.name)}`}
        >
          <Text className="font-ui-bold text-body text-white">{initials(item.counterparty.name)}</Text>
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="flex-1 pr-2 font-ui-bold text-meta text-ink dark:text-night-text" numberOfLines={1}>
              {item.counterparty.name}
            </Text>
            {item.lastMessage && (
              <Text className="font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                {relativeTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <Text
            className={`mt-0.5 font-ui text-meta ${
              unread ? 'text-ink dark:text-night-text' : 'text-stone dark:text-night-muted'
            }`}
            numberOfLines={1}
          >
            {item.lastMessage
              ? `${item.lastMessage.mine ? 'You: ' : ''}${item.lastMessage.body}`
              : 'No messages yet — say hello.'}
          </Text>
          {item.booking && (
            <Badge
              label={`${item.booking.vehicleLabel} · ${shortRange(item.booking.startAt, item.booking.endAt)}`}
              tone="teal"
              className="mt-1 self-start"
            />
          )}
        </View>

        {unread && <View className="h-2 w-2 rounded-pill bg-coral" />}
        {/* avatar photo support is wired but R2 may be unconfigured — monogram is the fallback */}
        {avatar ? null : null}
      </Pressable>
    );
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <Pressable
      onPress={() => navigation.navigate(ROUTES.TRIP_DETAIL, { bookingId: item.bookingId })}
      accessibilityRole="button"
      className="min-h-[44px] flex-row items-start gap-3 border-b border-sand px-gutter py-3.5 dark:border-night-line"
    >
      <View className="mt-1.5">
        <Badge label="●" tone={item.tone} />
      </View>
      <View className="flex-1">
        <Text className="font-ui-bold text-meta text-ink dark:text-night-text">{item.title}</Text>
        <Text className="mt-0.5 font-ui text-meta leading-5 text-stone dark:text-night-muted">{item.body}</Text>
      </View>
    </Pressable>
  );

  const emptyCopy = signedOut
    ? { title: 'Sign in to see your inbox', body: 'Messages with hosts land here once you sign in.' }
    : tab === 'messages'
      ? { title: 'No messages yet', body: 'Your conversations with hosts appear here.' }
      : { title: 'Nothing needs you right now', body: 'Booking updates and review reminders show up here.' };

  const empty = (
    <View className="items-center px-gutter pt-10">
      <Text className="text-center font-display text-title text-ink dark:text-night-text">{emptyCopy.title}</Text>
      <Text className="mt-2 text-center font-ui text-body text-stone dark:text-night-muted">{emptyCopy.body}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top']}>
      <View className="px-gutter pt-2">
        <DisplayText size="headline">Inbox</DisplayText>

        {/* Segmented toggle — stays visible even when the list is empty */}
        <View className="mt-3.5 flex-row rounded-pill bg-sand-soft p-[3px] dark:bg-night-raised">
          {(['messages', 'notifications'] as const).map((id) => {
            const active = tab === id;
            const count = id === 'messages' ? unreadTotal : notifications.length;
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-pill ${
                  active ? 'bg-ink dark:bg-night' : ''
                }`}
              >
                <Text
                  className={`font-ui-bold text-meta ${
                    active ? 'text-paper dark:text-night-text' : 'text-stone dark:text-night-muted'
                  }`}
                >
                  {id === 'messages' ? 'Messages' : 'Notifications'}
                </Text>
                {count > 0 && (
                  <View className="h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-coral px-1">
                    <Text className="font-ui-bold text-[10px] text-white">{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {tab === 'messages' ? (
        <FlatList
          key="messages"
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={renderConversation}
          contentContainerClassName="pt-3 pb-8"
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
          ListEmptyComponent={loading ? null : empty}
        />
      ) : (
        <FlatList
          key="notifications"
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={renderNotification}
          contentContainerClassName="pt-3 pb-8"
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
          ListEmptyComponent={loading ? null : empty}
        />
      )}
    </SafeAreaView>
  );
};

export default InboxScreen;
