import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, DisplayText } from '../../components/ui';
import { ROUTES } from '../../navigation/routes';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'car-sport-outline', title: 'Local cars, real people', body: 'Rent from hosts across Nassau, Freeport, and Exuma.' },
  { icon: 'flash-outline', title: 'Book in minutes', body: 'Instant Book, airport pickup, delivery to your hotel.' },
  { icon: 'shield-checkmark-outline', title: 'Covered every trip', body: 'Protection plans and photo check-in on both ends.' },
];

/** Onboarding step 1 of 3 — Welcome (design/02-user-flows.md). */
export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<{ navigate: (r: string) => void }>();

  return (
    <SafeAreaView className="flex-1 bg-paper px-gutter dark:bg-night">
      <View className="flex-1 justify-center">
        <Text className="font-display text-hero text-ink dark:text-night-text">
          Key<Text className="text-coral">Lo</Text>
        </Text>
        <DisplayText size="headline" className="mt-3">
          Keys to the island.
        </DisplayText>
        <Text className="mt-2 font-ui text-body text-stone dark:text-night-muted">
          The Bahamas' peer-to-peer car rental — book a local's car instead of a rental counter.
        </Text>

        <View className="mt-10 gap-5">
          {FEATURES.map((f) => (
            <View key={f.title} className="flex-row items-center gap-3.5">
              <View className="h-11 w-11 items-center justify-center rounded-pill bg-sand-soft dark:bg-night-raised">
                <Ionicons name={f.icon} size={22} color="#0E7C7B" />
              </View>
              <View className="flex-1">
                <Text className="font-ui-bold text-body text-ink dark:text-night-text">{f.title}</Text>
                <Text className="font-ui text-meta text-stone dark:text-night-muted">{f.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="pb-4">
        <Button label="Get started" onPress={() => navigation.navigate(ROUTES.ONBOARDING_ISLAND_SELECTION)} />
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
