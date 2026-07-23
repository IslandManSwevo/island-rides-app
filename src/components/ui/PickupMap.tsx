import React from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PickupMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  islandName?: string;
  note?: string;
}

/**
 * Pickup location + Get Directions. Opens the device's real maps app (Apple on
 * iOS, Google elsewhere) via a universal Maps URL — no API key or native map
 * config required, works on every platform. The panel is a branded map-style
 * card; a live interactive map can layer in later behind a Maps key.
 */
export const PickupMap: React.FC<PickupMapProps> = ({ latitude, longitude, address, islandName, note }) => {
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const label = address || islandName || 'Pickup location';

  const openDirections = () => {
    const dest = hasCoords ? `${latitude},${longitude}` : encodeURIComponent(label);
    // Universal URL — resolves to the native maps app on both platforms.
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${dest}`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View className="overflow-hidden rounded-card border border-sand dark:border-night-line">
      {/* Map-style panel: layered coastal tones with a centered coral pin */}
      <View
        className="h-36 items-center justify-center"
        style={{ backgroundColor: '#DCE6E3' }}
      >
        {/* subtle "water + land" banding */}
        <View className="absolute inset-0">
          <View style={{ height: '42%', backgroundColor: '#CFE0DC' }} />
          <View style={{ height: '16%', backgroundColor: '#E8E0D4' }} />
          <View style={{ flex: 1, backgroundColor: '#DDE7E0' }} />
        </View>
        <View className="absolute" style={{ top: 12, left: 20, right: 40, height: 3, backgroundColor: '#EFEAE0', borderRadius: 2 }} />
        <View className="absolute" style={{ bottom: 24, left: 48, right: 16, height: 3, backgroundColor: '#EFEAE0', borderRadius: 2 }} />
        <View className="items-center">
          <Ionicons name="location" size={34} color="#FF5A3C" />
          <View style={{ width: 10, height: 4, borderRadius: 2, backgroundColor: 'rgba(20,28,36,0.25)', marginTop: -2 }} />
        </View>
      </View>

      <View className="flex-row items-center gap-3 bg-white p-card-pad dark:bg-night-raised">
        <View className="flex-1">
          <Text className="font-ui-semibold text-body text-ink dark:text-night-text" numberOfLines={1}>
            {label}
          </Text>
          {note ? (
            <Text className="font-ui text-meta text-stone dark:text-night-muted" numberOfLines={1}>
              {note}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={openDirections}
          className="flex-row items-center gap-1.5 rounded-pill bg-ink px-3.5 py-2 dark:bg-night-text"
          accessibilityRole="button"
          accessibilityLabel="Get directions"
        >
          <Ionicons name="navigate" size={15} color="#FAF7F2" />
          <Text className="font-ui-bold text-meta text-paper dark:text-night">Directions</Text>
        </Pressable>
      </View>
    </View>
  );
};
