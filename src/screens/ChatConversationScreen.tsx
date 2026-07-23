import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { DisplayText } from '../components/ui';
import { RootStackParamList } from '../navigation/routes';
import { useUnifiedAuth } from '../context/UnifiedAuthContext';
import { chatSocket, ChatMessage } from '../services/chatSocket';
import { keyloApi } from '../services/keyloApi';
import { apiService } from '../services/apiService';

type ChatConversationScreenProps = StackScreenProps<RootStackParamList, 'Chat'>;

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/**
 * Realtime chat thread on the KeyLo kit (design mockup language), replacing
 * GiftedChat. Loads history over REST, then streams live via chatSocket.
 */
const ChatConversationScreen: React.FC<ChatConversationScreenProps> = ({ route, navigation }) => {
  const { user } = useUnifiedAuth();
  const conversationId = String((route.params as { conversationId?: string | number })?.conversationId ?? '');
  const title = (route.params as { title?: string })?.title ?? 'Chat';
  const myId = String(user?.id ?? '');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    let offMessage: (() => void) | undefined;

    (async () => {
      try {
        const token = await apiService.getToken();
        if (token) {
          const res = await keyloApi.conversationMessages(conversationId, token);
          setMessages(res.messages);
        }
      } catch {
        // Empty thread / offline — start clean.
      } finally {
        setLoading(false);
      }

      await chatSocket.join(conversationId);
      chatSocket.markRead(conversationId);
      offMessage = chatSocket.onMessage((m) => {
        if (m.conversationId !== conversationId) return;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      });
    })();

    return () => {
      offMessage?.();
      chatSocket.leave(conversationId);
    };
  }, [conversationId]);

  useEffect(() => {
    if (messages.length) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');
    const saved = await chatSocket.send(conversationId, body);
    if (!saved) {
      // Socket unavailable — restore the draft so nothing is lost.
      setDraft(body);
    }
    setSending(false);
  }, [draft, sending, conversationId]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = String(item.senderId) === myId;
    return (
      <View className={`mb-2 max-w-[78%] ${mine ? 'self-end' : 'self-start'}`}>
        <View
          className={`rounded-hero px-3.5 py-2.5 ${
            mine
              ? 'rounded-br-field bg-coral'
              : 'rounded-bl-field border border-sand bg-white dark:border-night-line dark:bg-night-raised'
          }`}
        >
          <Text className={`font-ui text-body ${mine ? 'text-white' : 'text-ink dark:text-night-text'}`}>
            {item.body}
          </Text>
        </View>
        <Text
          className={`mt-1 font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted ${
            mine ? 'text-right' : ''
          }`}
        >
          {timeOf(item.createdAt)}
          {mine && item.readAt ? ' · Read' : ''}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-sand px-gutter py-3 dark:border-night-line">
        <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color="#141C24" />
        </Pressable>
        <DisplayText size="title" numberOfLines={1} className="flex-1">
          {title}
        </DisplayText>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FF5A3C" />
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerClassName="px-gutter py-4"
            ListEmptyComponent={
              <View className="mt-16 items-center">
                <Text className="font-ui text-body text-stone dark:text-night-muted">
                  Say hello — messages are private to this booking.
                </Text>
              </View>
            }
          />
          <View className="flex-row items-end gap-2 border-t border-sand px-gutter py-2.5 dark:border-night-line">
            <TextInput
              value={draft}
              onChangeText={(t) => {
                setDraft(t);
                if (conversationId) chatSocket.sendTyping(conversationId);
              }}
              placeholder="Message"
              placeholderTextColor="#C9C2B6"
              multiline
              className="max-h-28 flex-1 rounded-hero border border-sand bg-white px-4 py-2.5 font-ui text-body text-ink dark:border-night-line dark:bg-night-raised dark:text-night-text"
            />
            <Pressable
              onPress={send}
              disabled={!draft.trim() || sending}
              className={`h-11 w-11 items-center justify-center rounded-pill ${
                draft.trim() ? 'bg-coral' : 'bg-sand dark:bg-night-line'
              }`}
              accessibilityLabel="Send message"
            >
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default ChatConversationScreen;
