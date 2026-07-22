import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Card, Chip, DisplayText, SectionLabel } from '../components/ui';
import { keyloApi, ApiIsland, ApiVehicle, formatDollars } from '../services/keyloApi';
import { ROUTES } from '../navigation/routes';
import type { SearchStackParamList } from '../navigation/types';

interface ExploreScreenProps {
  navigation: StackNavigationProp<SearchStackParamList>;
}

/** Explore — the customer home (design/mockups/01-home-search.html). */
export const ExploreScreen: React.FC<ExploreScreenProps> = ({ navigation }) => {
  const [islands, setIslands] = useState<ApiIsland[]>([]);
  const [activeIsland, setActiveIsland] = useState<string | null>(null);
  const [instantOnly, setInstantOnly] = useState(false);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [islandsRes, vehiclesRes] = await Promise.all([
        keyloApi.islands(),
        keyloApi.searchVehicles({
          island: activeIsland ?? undefined,
          instantBook: instantOnly || undefined,
        }),
      ]);
      setIslands(islandsRes.islands);
      setVehicles(vehiclesRes.vehicles);
      setOffline(false);
    } catch {
      // API unreachable (no backend deployed yet, or no network) — show the
      // branded empty state rather than an error wall.
      setOffline(true);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [activeIsland, instantOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const openVehicle = (vehicle: ApiVehicle) => {
    navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicleId: vehicle.id as never });
  };

  const renderVehicle = ({ item }: { item: ApiVehicle }) => (
    <Pressable onPress={() => openVehicle(item)} className="mb-4">
      <Card hero className="overflow-hidden">
        <View className="h-44 items-center justify-center bg-ink dark:bg-night-raised">
          <Ionicons name="car-sport" size={72} color="#F2EFE9" />
          {item.instantBook && (
            <View className="absolute left-3 top-3">
              <Badge label="⚡ Instant Book" tone="coral" />
            </View>
          )}
        </View>
        <View className="p-card-pad">
          <View className="flex-row items-baseline justify-between">
            <DisplayText size="title" className="flex-1 pr-2" numberOfLines={1}>
              {item.make} {item.model} · {item.year}
            </DisplayText>
            <View className="flex-row items-baseline">
              <Text className="font-display text-title text-coral">
                {formatDollars(item.dailyRateCents)}
              </Text>
              <Text className="font-ui text-meta text-stone dark:text-night-muted">/day</Text>
            </View>
          </View>
          <Text className="mt-1 font-ui text-meta text-stone dark:text-night-muted" numberOfLines={1}>
            {item.seats} seats · {item.driveSide} · {item.address ?? item.islandId}
            {item.airportPickup ? ' · Airport pickup' : ''}
          </Text>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top']}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        renderItem={renderVehicle}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
        contentContainerClassName="px-gutter pb-8"
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between pt-2">
              <Text className="font-display text-title text-ink dark:text-night-text">
                Key<Text className="text-coral">Lo</Text>
              </Text>
            </View>
            <DisplayText size="headline" className="mt-4">
              Where to next?
            </DisplayText>

            {/* Island + filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" contentContainerClassName="gap-2">
              <Chip label="All islands" active={activeIsland === null} onPress={() => setActiveIsland(null)} />
              {islands.map((island) => (
                <Chip
                  key={island.id}
                  label={island.name.replace(/\s*\(.*\)/, '')}
                  active={activeIsland === island.id}
                  onPress={() => setActiveIsland(island.id)}
                />
              ))}
              <Chip label="⚡ Instant Book" active={instantOnly} onPress={() => setInstantOnly((v) => !v)} />
            </ScrollView>

            <SectionLabel className="mb-3 mt-6">
              {loading ? 'Finding cars…' : `${vehicles.length} cars available`}
            </SectionLabel>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <Card className="items-center p-8">
              <Text className="font-display text-title text-ink dark:text-night-text">
                {offline ? "Can't reach the island." : 'Nothing on this island yet.'}
              </Text>
              <Text className="mt-2 text-center font-ui text-body text-stone dark:text-night-muted">
                {offline
                  ? 'Check your connection and pull to refresh.'
                  : 'Try Nassau — it has the deepest fleet.'}
              </Text>
            </Card>
          )
        }
      />
    </SafeAreaView>
  );
};

export default ExploreScreen;
