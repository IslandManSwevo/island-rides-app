import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Button, Card, Chip, DisplayText, SectionLabel, Sheet, VehicleImage } from '../components/ui';
import { keyloApi, ApiIsland, ApiVehicle, formatDollars, primaryPhotoUrl } from '../services/keyloApi';
import { ROUTES } from '../navigation/routes';
import type { SearchStackParamList } from '../navigation/types';

interface ExploreScreenProps {
  navigation: StackNavigationProp<SearchStackParamList>;
}

const VEHICLE_TYPES = ['SUV', 'Sedan', 'Hatchback', 'Van', 'Jeep', 'Truck'] as const;
const SEAT_OPTIONS = [2, 4, 5, 7] as const;

/**
 * Explore — the customer home (design/mockups/01-home-search.html).
 *
 * This is the merged surface from design/03-screen-inventory.md: the old
 * Search, SearchResults and Map screens all collapse into here. Island and
 * Instant Book are pills; everything else lives in the filter sheet.
 */
export const ExploreScreen: React.FC<ExploreScreenProps> = ({ navigation }) => {
  const [islands, setIslands] = useState<ApiIsland[]>([]);
  const [activeIsland, setActiveIsland] = useState<string | null>(null);
  const [instantOnly, setInstantOnly] = useState(false);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  // Free-text search filters the loaded page client-side; island/type/seats are
  // server-side params on /v1/vehicles.
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [minSeats, setMinSeats] = useState<number | null>(null);
  // Draft state so closing the sheet without applying discards the changes.
  const [draftType, setDraftType] = useState<string | null>(null);
  const [draftSeats, setDraftSeats] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [islandsRes, vehiclesRes] = await Promise.all([
        keyloApi.islands(),
        keyloApi.searchVehicles({
          island: activeIsland ?? undefined,
          instantBook: instantOnly || undefined,
          type: vehicleType ?? undefined,
          seats: minSeats ?? undefined,
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
  }, [activeIsland, instantOnly, vehicleType, minSeats]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      `${v.make} ${v.model} ${v.year} ${v.vehicleType} ${v.address ?? ''}`.toLowerCase().includes(q)
    );
  }, [vehicles, query]);

  const activeFilterCount = (vehicleType ? 1 : 0) + (minSeats ? 1 : 0);

  const openFilters = () => {
    setDraftType(vehicleType);
    setDraftSeats(minSeats);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setVehicleType(draftType);
    setMinSeats(draftSeats);
    setFiltersOpen(false);
  };

  const openVehicle = (vehicle: ApiVehicle) => {
    navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicleId: vehicle.id as never });
  };

  const renderVehicle = ({ item }: { item: ApiVehicle }) => (
    <Pressable onPress={() => openVehicle(item)} className="mb-4">
      <Card hero className="overflow-hidden">
        <View className="h-44">
          <VehicleImage url={primaryPhotoUrl(item)} className="h-44 w-full" />
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
        data={visible}
        keyExtractor={(v) => v.id}
        renderItem={renderVehicle}
        keyboardShouldPersistTaps="handled"
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

            {/* Search field + filter sheet trigger */}
            <View className="mt-4 flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center gap-2 rounded-field border border-sand bg-white px-3 dark:border-night-line dark:bg-night-raised">
                <Ionicons name="search" size={17} color="#8C8578" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Make, model, or where you're headed"
                  placeholderTextColor="#C9C2B6"
                  returnKeyType="search"
                  accessibilityLabel="Search cars"
                  className="min-h-[44px] flex-1 font-ui text-body text-ink dark:text-night-text"
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={10}>
                    <Ionicons name="close-circle" size={17} color="#8C8578" />
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={openFilters}
                accessibilityRole="button"
                accessibilityLabel={`Filters${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
                className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-field border ${
                  activeFilterCount
                    ? 'border-coral bg-coral-tint'
                    : 'border-sand bg-white dark:border-night-line dark:bg-night-raised'
                }`}
              >
                <Ionicons name="options-outline" size={20} color={activeFilterCount ? '#E04326' : '#141C24'} />
              </Pressable>
            </View>

            {/* Island + Instant Book pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerClassName="gap-2">
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
              {loading ? 'Finding cars…' : `${visible.length} car${visible.length === 1 ? '' : 's'} available`}
            </SectionLabel>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <Card className="items-center p-8">
              <Text className="font-display text-title text-ink dark:text-night-text">
                {offline
                  ? "Can't reach the island."
                  : query.trim()
                    ? 'No match for that.'
                    : 'Nothing on this island yet.'}
              </Text>
              <Text className="mt-2 text-center font-ui text-body text-stone dark:text-night-muted">
                {offline
                  ? 'Check your connection and pull to refresh.'
                  : query.trim()
                    ? 'Try a different make, or clear the search to see everything.'
                    : 'Try Nassau — it has the deepest fleet.'}
              </Text>
            </Card>
          )
        }
      />

      {/* Filter sheet — the standard search → filter sheet → results pattern */}
      <Sheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} maxHeightRatio={0.7}>
        <ScrollView className="px-gutter" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between pt-2">
            <DisplayText size="title">Filters</DisplayText>
            <Pressable
              onPress={() => {
                setDraftType(null);
                setDraftSeats(null);
              }}
              accessibilityRole="button"
              className="min-h-[44px] justify-center"
            >
              <Text className="font-ui-semibold text-meta text-teal">Clear all</Text>
            </Pressable>
          </View>

          <SectionLabel className="mt-5">Vehicle type</SectionLabel>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <Chip label="Any" active={draftType === null} onPress={() => setDraftType(null)} />
            {VEHICLE_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                active={draftType === type}
                onPress={() => setDraftType(draftType === type ? null : type)}
              />
            ))}
          </View>

          <SectionLabel className="mt-5">Seats</SectionLabel>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <Chip label="Any" active={minSeats === null && draftSeats === null} onPress={() => setDraftSeats(null)} />
            {SEAT_OPTIONS.map((seats) => (
              <Chip
                key={seats}
                label={`${seats}+`}
                active={draftSeats === seats}
                onPress={() => setDraftSeats(draftSeats === seats ? null : seats)}
              />
            ))}
          </View>

          <Text className="mt-5 font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
            Drive side, price range and dates land with the availability calendar — the API takes them today, the
            controls don't exist yet.
          </Text>

          <Button label="Show cars" className="my-5" onPress={applyFilters} />
        </ScrollView>
      </Sheet>
    </SafeAreaView>
  );
};

export default ExploreScreen;
