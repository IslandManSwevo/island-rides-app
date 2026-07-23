import React from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VehicleImageProps {
  url?: string;
  /** Icon size for the placeholder fallback. */
  iconSize?: number;
  className?: string;
}

/**
 * Renders a vehicle/host photo when a URL is available, else the branded ink
 * placeholder. One component so real-photo vs placeholder is consistent
 * across Explore, detail, storefront, and trips.
 */
export const VehicleImage: React.FC<VehicleImageProps> = ({ url, iconSize = 72, className = '' }) => {
  if (url) {
    return <Image source={{ uri: url }} className={className} resizeMode="cover" />;
  }
  return (
    <View className={`items-center justify-center bg-ink dark:bg-night-raised ${className}`}>
      <Ionicons name="car-sport" size={iconSize} color="#F2EFE9" />
    </View>
  );
};
