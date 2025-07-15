import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, spacing, shadows, colors } from '../styles/Theme';
import { Vehicle } from '../types';

interface ModernVehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
  style?: any;
}

const ModernVehicleCard: React.FC<ModernVehicleCardProps> = ({
  vehicle,
  onPress,
  style,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const formatPrice = (price: number) => {
    return `$${price}/day`;
  };

  const getPrimaryPhoto = () => {
    if (vehicle.photos && vehicle.photos.length > 0) {
      const primaryPhoto = vehicle.photos.find(photo => photo.isPrimary);
      return primaryPhoto?.photoUrl || vehicle.photos[0].photoUrl;
    }
    return 'https://via.placeholder.com/300x200';
  };

  const getConditionText = () => {
    if (vehicle.conditionRating) {
      if (vehicle.conditionRating >= 4.5) return 'Excellent';
      if (vehicle.conditionRating >= 3.5) return 'Good';
      if (vehicle.conditionRating >= 2.5) return 'Fair';
      return 'Needs Work';
    }
    return 'Good';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
          style={styles.card}
        >
          {/* Hero Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: getPrimaryPhoto() }}
              style={styles.image}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
              style={styles.imageOverlay}
            />
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getConditionText()}</Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {vehicle.make} {vehicle.model}
              </Text>
              <Text style={styles.year}>{vehicle.year}</Text>
            </View>

            <Text style={styles.description} numberOfLines={2}>
              {vehicle.description || 'Premium vehicle with excellent features'}
            </Text>

            <View style={styles.features}>
              <View style={styles.feature}>
                <Text style={styles.featureText}>
                  🚗 {vehicle.seatingCapacity || 5} seats
                </Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureText}>
                  ⚡ {vehicle.transmissionType || 'Automatic'}
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  {formatPrice(vehicle.dailyRate)}
                </Text>
              </View>
              <View style={styles.locationContainer}>
                <Text style={styles.location}>📍 {vehicle.location}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.large,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  year: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  features: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  feature: {
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ModernVehicleCard;
