import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Badge, Card, DisplayText, SectionLabel } from '../components/ui';
import { keyloApi, ApiVehicle, formatDollars } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { ROUTES } from '../navigation/routes';

interface FleetManagementScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

type FleetVehicle = ApiVehicle & { _count?: { bookings: number } };

const statusBadge = (v: FleetVehicle) => {
  if (v.verificationStatus === 'pending') return <Badge label="In review" tone="gold" />;
  if (v.verificationStatus === 'rejected') return <Badge label="Needs attention" tone="danger" />;
  if (v.unlistedAt) return <Badge label="Unlisted" tone="danger" />;
  return <Badge label="✓ Live" tone="teal" />;
};

/** Fleet — the host's vehicle list; the Vehicle Manager sections hang off each card. */
export const FleetManagementScreen: React.FC<FleetManagementScreenProps> = ({ navigation }) => {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await apiService.getToken();
      if (!token) return;
      const res = await keyloApi.hostVehicles(token);
      setVehicles(res.vehicles);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['top']}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
        contentContainerClassName="px-gutter pb-8"
        ListHeaderComponent={
          <View className="pb-4 pt-2">
            <View className="flex-row items-center justify-between">
              <DisplayText size="headline">Fleet</DisplayText>
              <Pressable
                onPress={() => navigation.navigate(ROUTES.LIST_VEHICLE, {})}
                className="flex-row items-center gap-1 rounded-pill bg-coral px-3.5 py-2"
                accessibilityLabel="List a car"
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text className="font-ui-bold text-meta text-white">List a car</Text>
              </Pressable>
            </View>
            <SectionLabel className="mt-3">{`${vehicles.length} vehicles`}</SectionLabel>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="mb-3.5 overflow-hidden">
            <View className="flex-row items-center gap-3 p-card-pad">
              <View className="h-14 w-[72px] items-center justify-center rounded-field bg-ink dark:bg-night-raised">
                <Ionicons name="car-sport" size={30} color="#F2EFE9" />
              </View>
              <View className="flex-1">
                <DisplayText size="title" numberOfLines={1}>
                  {item.make} {item.model} {item.year}
                </DisplayText>
                <Text className="mt-0.5 font-ui text-meta text-stone dark:text-night-muted">
                  {formatDollars(item.dailyRateCents)}/day · {item._count?.bookings ?? 0} upcoming
                  {item.instantBook ? ' · ⚡ Instant' : ''}
                </Text>
              </View>
              {statusBadge(item)}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          loading ? null : (
            <Card className="items-center p-8">
              <Text className="font-display text-title text-ink dark:text-night-text">
                Your driveway could be earning.
              </Text>
              <Text className="mt-2 text-center font-ui text-body text-stone dark:text-night-muted">
                List your first car — photos, pricing, and booking settings take about ten minutes.
              </Text>
              <Pressable onPress={() => navigation.navigate(ROUTES.LIST_VEHICLE, {})} className="mt-4">
                <Badge label="List a vehicle →" tone="coral" />
              </Pressable>
            </Card>
          )
        }
      />
    </SafeAreaView>
  );
};

export default FleetManagementScreen;
