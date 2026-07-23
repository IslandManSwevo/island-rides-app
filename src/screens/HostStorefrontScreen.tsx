import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { Badge, Button, Card, Chip, DisplayText, SectionLabel, VehicleImage } from '../components/ui';
import { keyloApi, ApiStorefront, ApiVehicle, formatDollars, primaryPhotoUrl } from '../services/keyloApi';
import { apiService } from '../services/apiService';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type HostStorefrontScreenProps = StackScreenProps<RootStackParamList, typeof ROUTES.HOST_STOREFRONT>;

const STOREFRONT_ORIGIN = 'https://keylo.bs/@';

/** Host storefront — design/mockups/09-host-storefront.html. Public, shareable. */
export const HostStorefrontScreen: React.FC<HostStorefrontScreenProps> = ({ navigation, route }) => {
  const handleParam = route.params?.handle;
  const [handle, setHandle] = useState<string | null>(handleParam ?? null);
  const [storefront, setStorefront] = useState<ApiStorefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [noHandle, setNoHandle] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let h = handleParam ?? null;
      if (!h) {
        // Own storefront: resolve the host's handle from the editor endpoint.
        const token = await apiService.getToken();
        if (token) {
          const res = await keyloApi.hostStorefront(token);
          h = res.storefront.handle ?? null;
        }
      }
      if (!h) {
        setNoHandle(true);
        return;
      }
      setHandle(h);
      const res = await keyloApi.storefront(h, handleParam ? 'app' : undefined);
      setStorefront(res.storefront);
      setNoHandle(false);
    } catch {
      setStorefront(null);
    } finally {
      setLoading(false);
    }
  }, [handleParam]);

  useEffect(() => {
    load();
  }, [load]);

  const onShare = () => {
    if (!handle) return;
    Share.share({
      message: `Check out my cars on KeyLo — ${STOREFRONT_ORIGIN}${handle}`,
      url: `${STOREFRONT_ORIGIN}${handle}`,
    }).catch(() => undefined);
  };

  if (noHandle) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-paper px-gutter dark:bg-night" edges={['top']}>
        <DisplayText size="title" className="text-center">
          Claim your storefront
        </DisplayText>
        <Text className="mt-2 text-center font-ui text-body text-stone dark:text-night-muted">
          Pick a handle like keylo.bs/@yourfleet, then share one link to all your cars.
        </Text>
        <Button label="Set up storefront" className="mt-6 self-stretch" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const renderVehicle = ({ item }: { item: ApiVehicle }) => (
    <Card className="mb-3 flex-1 overflow-hidden" style={{ maxWidth: '48%' }}>
      <VehicleImage url={primaryPhotoUrl(item)} iconSize={30} className="h-20 w-full" />
      <View className="p-3">
        <Text className="font-ui-bold text-meta text-ink dark:text-night-text" numberOfLines={1}>
          {item.make} {item.model}
        </Text>
        <Text className="font-ui text-meta">
          <Text className="font-ui-bold text-coral">{formatDollars(item.dailyRateCents)}</Text>
          <Text className="text-stone dark:text-night-muted">/day</Text>
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
      <FlatList
        data={storefront?.vehicles ?? []}
        keyExtractor={(v) => v.id}
        renderItem={renderVehicle}
        numColumns={2}
        columnWrapperClassName="justify-between px-gutter"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FF5A3C" />}
        contentContainerClassName="pb-8"
        ListHeaderComponent={
          <View>
            {/* Banner */}
            <View className="h-32 items-end justify-start bg-ink dark:bg-night-raised">
              <Pressable
                onPress={onShare}
                className="m-4 flex-row items-center gap-1.5 rounded-pill bg-coral px-3.5 py-2"
                accessibilityRole="button"
                accessibilityLabel="Share storefront"
              >
                <Ionicons name="share-outline" size={15} color="#fff" />
                <Text className="font-ui-bold text-meta text-white">Share</Text>
              </Pressable>
            </View>

            {/* Identity */}
            <View className="-mt-8 px-gutter">
              <View className="flex-row items-end gap-3.5">
                <View className="h-[76px] w-[76px] items-center justify-center rounded-hero border-4 border-paper bg-ink dark:border-night dark:bg-night-raised">
                  <Text className="font-display text-headline text-paper">
                    {(storefront?.displayName ?? 'K').charAt(0)}
                  </Text>
                </View>
                <View className="pb-1">
                  <DisplayText size="title">{storefront?.displayName ?? 'Storefront'}</DisplayText>
                  {handle && <Text className="font-ui-bold text-meta text-teal">keylo.bs/@{handle}</Text>}
                </View>
              </View>
              {storefront?.tagline || storefront?.bio ? (
                <Text className="mt-2.5 font-ui text-meta leading-5 text-stone dark:text-night-muted">
                  {storefront.tagline ?? storefront.bio}
                </Text>
              ) : null}

              {/* Stats */}
              <Card className="mt-3.5 flex-row py-3">
                <View className="flex-1 items-center border-r border-sand dark:border-night-line">
                  <Text className="font-ui-bold text-emphasis text-ink dark:text-night-text">
                    {storefront?.vehicles.length ?? 0}
                  </Text>
                  <Text className="font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                    Cars
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="font-ui-bold text-emphasis text-ink dark:text-night-text">
                    {storefront?.responseTimeMins ? `~${storefront.responseTimeMins} min` : '—'}
                  </Text>
                  <Text className="font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
                    Response
                  </Text>
                </View>
              </Card>

              <SectionLabel className="mb-3 mt-6">{`The fleet · ${storefront?.vehicles.length ?? 0}`}</SectionLabel>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View className="px-gutter">
              <Card className="items-center p-6">
                <Text className="font-ui text-body text-stone dark:text-night-muted">No live listings yet.</Text>
              </Card>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default HostStorefrontScreen;
