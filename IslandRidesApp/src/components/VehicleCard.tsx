import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Vehicle } from '../types';
import { colors, typography, spacing, borderRadius } from '../styles/theme';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onPress }) => {
  const getVehicleImageUrl = (vehicleId: number): string => {
    const imageMap: { [key: number]: string } = {
      1: 'https://placehold.co/300x200/00B8D4/FFFFFF?text=Toyota+Camry',
      2: 'https://placehold.co/300x200/0097A7/FFFFFF?text=Honda+Civic',
      3: 'https://placehold.co/300x200/00ACC1/FFFFFF?text=BMW+X3',
      4: 'https://placehold.co/300x200/26C6DA/FFFFFF?text=Nissan+Altima',
      5: 'https://placehold.co/300x200/4DD0E1/FFFFFF?text=Ford+Mustang',
      6: 'https://placehold.co/300x200/80DEEA/FFFFFF?text=Jeep+Wrangler',
    };
    return imageMap[vehicleId] || 'https://placehold.co/300x200/00B8D4/FFFFFF?text=Vehicle';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={{ uri: getVehicleImageUrl(vehicle.id) }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.price}>${vehicle.daily_rate}/day</Text>
        </View>
        <Text style={styles.driveSide}>
          {vehicle.drive_side === 'LHD' ? '🚗 Left-Hand Drive' : '🚙 Right-Hand Drive'}
        </Text>
        <Text style={styles.location}>📍 {vehicle.location}</Text>
        {vehicle.description && (
          <Text style={styles.description} numberOfLines={2}>
            {vehicle.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGrey,
    flex: 1,
    marginRight: spacing.sm,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  location: {
    fontSize: 14,
    color: colors.lightGrey,
    marginBottom: spacing.sm,
  },
  driveSide: {
    fontSize: 12,
    color: colors.darkGrey,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: colors.lightGrey,
    lineHeight: 20,
  },
});
