import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { colors } from '../styles/theme';
import { navigationRef } from '../navigation/navigationRef';
import { ROUTES } from '../navigation/routes';

interface FavoriteButtonProps {
  vehicleId: number;
  size?: number;
  style?: any;
  onToggle?: (isFavorited: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  vehicleId,
  size = 24,
  style,
  onToggle
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const scaleAnim = new Animated.Value(1);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    checkFavoriteStatus();
  }, [vehicleId]);

  const checkFavoriteStatus = async () => {
    try {
      setChecking(true);
      const response: any = await apiService.get(`/favorites/check/${vehicleId}`);
      setIsFavorited(response.isFavorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      // Don't show error for checking status, just log it
    } finally {
      setChecking(false);
    }
  };

  const animatePress = () => {
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
  };

  const animateSuccess = () => {
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
  };

  const toggleFavorite = async () => {
    if (loading || checking) return;

    animatePress();
    setLoading(true);

    try {
      if (isFavorited) {
        await apiService.delete(`/favorites/${vehicleId}`);
        setIsFavorited(false);
        onToggle?.(false);
        notificationService.info('Removed from favorites', {
          duration: 2000
        });
      } else {
        await apiService.post('/favorites', { vehicleId });
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
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      
      // Show specific error messages
      if (error?.response?.status === 401) {
        notificationService.error('Please log in to save favorites', {
          duration: 4000
        });
      } else if (error?.response?.status === 404) {
        notificationService.error('Vehicle not found', {
          duration: 3000
        });
      } else {
        notificationService.error('Failed to update favorites', {
          duration: 3000,
          action: {
            label: 'Retry',
            handler: () => toggleFavorite()
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking initial status
  if (checking) {
    return (
      <TouchableOpacity style={style} disabled>
        <ActivityIndicator size={size > 20 ? 'small' : size} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      onPress={toggleFavorite} 
      style={style}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
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
          <ActivityIndicator size={size > 20 ? 'small' : size} color={colors.primary} />
        ) : (
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={size}
            color={isFavorited ? colors.error : colors.darkGrey}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}; 