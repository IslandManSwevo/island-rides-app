import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DisplayText, SectionLabel, Card } from '../components/ui';
import { Text } from 'react-native';

/**
 * Inbox tab: conversations + notification center (design/02-user-flows.md).
 * Conversation list wiring lands with the backend; this branded shell holds
 * the tab slot so the IA is complete now.
 */
export const InboxScreen: React.FC = () => (
  <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top']}>
    <View className="px-gutter pt-2">
      <DisplayText size="headline">Inbox</DisplayText>
    </View>
    <View className="flex-1 px-gutter pt-6">
      <SectionLabel>Messages</SectionLabel>
      <Card className="mt-3 items-center p-8">
        <Text className="font-display text-title text-ink dark:text-night-text">
          No conversations yet
        </Text>
        <Text className="mt-2 text-center font-ui text-body text-stone dark:text-night-muted">
          When you book a car or message a host, the conversation lives here.
        </Text>
      </Card>
    </View>
  </SafeAreaView>
);

export default InboxScreen;
