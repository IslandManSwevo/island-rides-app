/**
 * Route Planning Panel Component
 * Displays route information, turn-by-turn directions, and navigation controls
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { RouteInfo, RouteStep } from '../../services/advancedMapService';
import { VehicleRecommendation } from '../../types';
import { analyticsService } from '../../services/analyticsService';
import { loggingService } from '../../services/LoggingService';

interface RoutePlanningPanelProps {
  routeInfo: RouteInfo;
  vehicle: VehicleRecommendation;
  userLocation: { latitude: number; longitude: number };
  onClose: () => void;
  onStartNavigation?: () => void;
  style?: any;
}

export const RoutePlanningPanel: React.FC<RoutePlanningPanelProps> = React.memo(({
  routeInfo,
  vehicle,
  userLocation,
  onClose,
  onStartNavigation,
  style,
}) => {
  // Format distance for display
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }, []);

  // Format duration for display
  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }, []);

  // Get traffic color based on congestion level
  const getTrafficColor = useCallback((level?: 'low' | 'moderate' | 'heavy'): string => {
    switch (level) {
      case 'low': return colors.success;
      case 'moderate': return colors.warning;
      case 'heavy': return colors.error;
      default: return colors.primary;
    }
  }, []);

  // Get traffic icon based on congestion level
  const getTrafficIcon = useCallback((level?: 'low' | 'moderate' | 'heavy'): string => {
    switch (level) {
      case 'low': return 'speedometer-outline';
      case 'moderate': return 'warning-outline';
      case 'heavy': return 'alert-circle-outline';
      default: return 'car-outline';
    }
  }, []);

  // Open in external navigation app
  const openInMaps = useCallback(async () => {
    const destination = {
      latitude: vehicle.vehicle.location?.latitude || 0,
      longitude: vehicle.vehicle.location?.longitude || 0,
    };

    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        
        analyticsService.trackEvent('route_opened_external_maps', {
          vehicleId: vehicle.id,
          distance: routeInfo.distance,
          duration: routeInfo.duration,
        });
      } else {
        Alert.alert('Error', 'Unable to open maps application');
      }
    } catch (error) {
      loggingService.error('Failed to open external maps', error as Error);
      Alert.alert('Error', 'Failed to open navigation app');
    }
  }, [vehicle, userLocation, routeInfo]);

  // Start in-app navigation
  const handleStartNavigation = useCallback(() => {
    onStartNavigation?.();
    
    analyticsService.trackEvent('route_navigation_started', {
      vehicleId: vehicle.id,
      distance: routeInfo.distance,
      duration: routeInfo.duration,
      hasTraffic: !!routeInfo.trafficInfo,
    });
  }, [onStartNavigation, vehicle, routeInfo]);

  // Calculate estimated arrival time
  const estimatedArrival = useMemo(() => {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + routeInfo.duration * 1000);
    return arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [routeInfo.duration]);

  // Render route step
  const renderRouteStep = useCallback((step: RouteStep, index: number) => (
    <View key={index} style={styles.stepContainer}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepInstruction}>{step.instruction}</Text>
        <View style={styles.stepDetails}>
          <Text style={styles.stepDistance}>{formatDistance(step.distance)}</Text>
          <Text style={styles.stepDuration}>{formatDuration(step.duration)}</Text>
        </View>
      </View>
    </View>
  ), [formatDistance, formatDuration]);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Route to {vehicle.vehicle.make} {vehicle.vehicle.model}</Text>
          <Text style={styles.subtitle}>{vehicle.vehicle.location?.address || 'Vehicle Location'}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.darkGrey} />
        </TouchableOpacity>
      </View>

      {/* Route Summary */}
      <View style={styles.routeSummary}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="navigate-outline" size={20} color={colors.primary} />
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>{formatDistance(routeInfo.distance)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{formatDuration(routeInfo.duration)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="alarm-outline" size={20} color={colors.primary} />
            <Text style={styles.summaryLabel}>Arrival</Text>
            <Text style={styles.summaryValue}>{estimatedArrival}</Text>
          </View>
        </View>

        {/* Traffic Information */}
        {routeInfo.trafficInfo && (
          <View style={styles.trafficInfo}>
            <Ionicons 
              name={getTrafficIcon(routeInfo.trafficInfo.congestionLevel)} 
              size={16} 
              color={getTrafficColor(routeInfo.trafficInfo.congestionLevel)} 
            />
            <Text style={[styles.trafficText, { color: getTrafficColor(routeInfo.trafficInfo.congestionLevel) }]}>
              {routeInfo.trafficInfo.congestionLevel.charAt(0).toUpperCase() + routeInfo.trafficInfo.congestionLevel.slice(1)} traffic
              {routeInfo.trafficInfo.estimatedDelay > 0 && 
                ` (+${formatDuration(routeInfo.trafficInfo.estimatedDelay)} delay)`
              }
            </Text>
          </View>
        )}
      </View>

      {/* Navigation Actions */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartNavigation}>
          <Ionicons name="navigate" size={20} color={colors.white} />
          <Text style={styles.primaryButtonText}>Start Navigation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={openInMaps}>
          <Ionicons name="map-outline" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Turn-by-Turn Directions */}
      <View style={styles.directionsContainer}>
        <Text style={styles.directionsTitle}>Turn-by-Turn Directions</Text>
        <ScrollView style={styles.directionsScroll} showsVerticalScrollIndicator={false}>
          {routeInfo.steps.map(renderRouteStep)}
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.darkGrey,
  },
  closeButton: {
    padding: spacing.sm,
  },
  routeSummary: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.darkGrey,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  trafficInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.sm,
  },
  trafficText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  directionsContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  directionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  directionsScroll: {
    flex: 1,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  stepDetails: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepDistance: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  stepDuration: {
    fontSize: 12,
    color: colors.darkGrey,
  },
});

export default RoutePlanningPanel;
