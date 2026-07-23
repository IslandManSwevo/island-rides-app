import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, DisplayText } from '../../components/ui';
import { keyloApi } from '../../services/keyloApi';
import { apiService } from '../../services/apiService';

const REASONS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'calendar-outline', title: 'Booking updates', body: 'Approvals, pickup reminders, trip changes.' },
  { icon: 'chatbubble-outline', title: 'Host replies', body: "Know the moment your host answers." },
];

/**
 * Onboarding step 3 of 3 — Notifications (design/02-user-flows.md).
 * Location is requested contextually at first map use, not here.
 * Finishing this step drops the user into the app.
 */
export const PermissionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [working, setWorking] = useState(false);

  const enterApp = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'CustomerApp' }] })
    );
  };

  const enable = async () => {
    setWorking(true);
    try {
      const { granted } = await Notifications.requestPermissionsAsync();
      if (granted) {
        // Register this device's Expo push token with the API (best-effort).
        const [{ data: expoToken }, apiToken] = await Promise.all([
          Notifications.getExpoPushTokenAsync(),
          apiService.getToken(),
        ]);
        if (expoToken && apiToken) {
          const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
          await keyloApi.registerPushToken(expoToken, platform, apiToken).catch(() => undefined);
        }
      }
    } catch {
      // Permission denial / token failure is fine — the app still works without push.
    } finally {
      setWorking(false);
      enterApp();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-paper px-gutter dark:bg-night">
      <View className="flex-1 justify-center">
        <Text className="font-ui-semibold text-overline uppercase tracking-wide text-stone dark:text-night-muted">
          Step 3 of 3
        </Text>
        <DisplayText size="headline" className="mt-2">
          Stay in the loop
        </DisplayText>
        <Text className="mt-1 font-ui text-body text-stone dark:text-night-muted">
          Turn on notifications so you don't miss a booking or a message.
        </Text>

        <View className="mt-8 gap-3">
          {REASONS.map((r) => (
            <Card key={r.title} className="flex-row items-center gap-3.5 p-card-pad">
              <View className="h-11 w-11 items-center justify-center rounded-pill bg-sand-soft dark:bg-night-raised">
                <Ionicons name={r.icon} size={22} color="#0E7C7B" />
              </View>
              <View className="flex-1">
                <Text className="font-ui-bold text-body text-ink dark:text-night-text">{r.title}</Text>
                <Text className="font-ui text-meta text-stone dark:text-night-muted">{r.body}</Text>
              </View>
            </Card>
          ))}
        </View>
      </View>

      <View className="gap-2 pb-4">
        <Button label={working ? 'Enabling…' : 'Turn on notifications'} loading={working} onPress={enable} />
        <Button label="Maybe later" variant="ghost" onPress={enterApp} />
      </View>
    </SafeAreaView>
  );
};

export default PermissionsScreen;
