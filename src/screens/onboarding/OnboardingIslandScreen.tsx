import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, DisplayText } from '../../components/ui';
import { keyloApi, ApiIsland } from '../../services/keyloApi';
import { ROUTES } from '../../navigation/routes';

/** Onboarding step 2 of 3 — Island (design/02-user-flows.md). Sets the default Explore filter. */
export const OnboardingIslandScreen: React.FC = () => {
  const navigation = useNavigation<{ navigate: (r: string, p?: object) => void }>();
  const [islands, setIslands] = useState<ApiIsland[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    keyloApi
      .islands()
      .then((res) => setIslands(res.islands))
      .catch(() =>
        // Offline fallback so onboarding never dead-ends.
        setIslands([
          { id: 'nassau', name: 'New Providence (Nassau)', features: [] },
          { id: 'freeport', name: 'Grand Bahama (Freeport)', features: [] },
          { id: 'exuma', name: 'Exuma', features: [] },
        ])
      );
  }, []);

  const next = () =>
    navigation.navigate(ROUTES.ONBOARDING_PERMISSIONS, { selectedIsland: selected ?? undefined });

  return (
    <SafeAreaView className="flex-1 bg-paper px-gutter dark:bg-night">
      <View className="flex-1">
        <View className="pt-8">
          <Text className="font-ui-semibold text-overline uppercase tracking-wide text-stone dark:text-night-muted">
            Step 2 of 3
          </Text>
          <DisplayText size="headline" className="mt-2">
            Where are you renting?
          </DisplayText>
          <Text className="mt-1 font-ui text-body text-stone dark:text-night-muted">
            We'll show cars here first. You can change islands anytime.
          </Text>
        </View>

        <ScrollView className="mt-6" showsVerticalScrollIndicator={false} contentContainerClassName="gap-3">
          {islands.map((island) => {
            const active = selected === island.id;
            return (
              <Pressable key={island.id} onPress={() => setSelected(island.id)}>
                <Card
                  className={`flex-row items-center gap-3 p-card-pad ${
                    active ? 'border-2 border-coral' : ''
                  }`}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-pill bg-sand-soft dark:bg-night-raised">
                    <Ionicons name="location-outline" size={22} color={active ? '#E04326' : '#8C8578'} />
                  </View>
                  <Text className="flex-1 font-ui-bold text-body text-ink dark:text-night-text">{island.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={22} color="#E04326" />}
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="gap-2 pb-4">
        <Button label="Continue" disabled={!selected} onPress={next} />
        <Button label="Skip for now" variant="ghost" onPress={() => navigation.navigate(ROUTES.ONBOARDING_PERMISSIONS, {})} />
      </View>
    </SafeAreaView>
  );
};

export default OnboardingIslandScreen;
