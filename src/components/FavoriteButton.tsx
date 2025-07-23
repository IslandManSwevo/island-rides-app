import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TouchableOpacity, Animated, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import { useServices } from '../services/ServiceRegistry';
import { notificationService } from '../services/notificationService';
import { colors } from '../styles/theme';
import { navigationRef } from '../navigation/navigationRef';
import { ROUTES } from '../navigation/routes';
import { ApiResponse } from '../types';

interface FavoriteButtonProps {
  vehicleId: number;
  size?: number;
  style?: ViewStyle | TextStyle;
  onToggle?: (isFavorited: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = React.memo(({
  vehicleId,
  size = 24,
  style,
  onToggle
}) => {
  const services = useServices();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        setChecking(true);
        const isFavoritedStatus = await services.vehicle.checkFavoriteStatus(vehicleId.toString());
        setIsFavorited(isFavoritedStatus);
      } catch (error) {
        console.error('Error checking favorite status:', error);
        // Don't show error for checking status, just log it
      } finally {
        setChecking(false);
      }
    };
    checkFavoriteStatus();
  }, [vehicleId]);

  const animatePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  }, [scaleAnim]);

  const animateSuccess = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  }, [pulseAnim]);

  const toggleFavorite = useCallback(async () => {
    if (loading || checking) return;

    animatePress();
    setLoading(true);

    try {
      if (isFavorited) {
        await services.vehicle.removeFromFavorites(vehicleId.toString());
        setIsFavorited(false);
        onToggle?.(false);
        notificationService.info('Removed from favorites', {
          duration: 2000
        });
      } else {
        await services.vehicle.addToFavorites(vehicleId.toString());
        setIsFavorited(true);
        onToggle?.(true);
        animateSuccess();
        notificationService.success('Added to favorites!', {
          duration: 3000,
          action: {
            label: 'View All',
            handler: () => {
              if (navigationRef.current) {
                navigationRef.current.navigate(ROUTES.FAVORITES as never);
              }
            }
          }
        });
      }
    } catch (error: unknown) {
      console.error('Error toggling favorite:', error);

      let errorMessage = 'Failed to update favorites';
      let statusCode: number | undefined;

      if (apiService.isAxiosError(error)) {
        statusCode = error.response?.status;
        if (statusCode === 401) {
          errorMessage = 'Please log in to save favorites';
        } else if (statusCode === 404) {
          errorMessage = 'Vehicle not found';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      notificationService.error(errorMessage, {
        duration: 3000,
        action: (statusCode !== 401 && statusCode !== 404) ? {
          label: 'Retry',
          handler: () => toggleFavorite(),
        } : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [loading, checking, animatePress, isFavorited, vehicleId, onToggle, animateSuccess]);

  const accessibilityLabel = useMemo(() => 
    isFavorited ? 'Remove from favorites' : 'Add to favorites',
    [isFavorited]
  );

  const iconName = useMemo(() => 
    isFavorited ? 'heart' : 'heart-outline',
    [isFavorited]
  );

  const iconColor = useMemo(() => 
    isFavorited ? colors.error : colors.darkGrey,
    [isFavorited]
  );

  const activityIndicatorSize = useMemo(() => 
    size > 20 ? 'small' : size,
    [size]
  );

  // Show loading spinner while checking initial status
  if (checking) {
    return (
      <TouchableOpacity style={style} disabled>
        <ActivityIndicator size={activityIndicatorSize} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      onPress={toggleFavorite} 
      style={style}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Animated.View 
        style={{ 
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim }
          ] 
        }}
      >
        {loading ? (
          <ActivityIndicator size={activityIndicatorSize} color={colors.primary} />
        ) : (
          <Ionicons
            name={iconName}
            size={size}
            color={iconColor}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});