import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { VehicleRecommendation, Island } from '../types';

interface VehicleCluster {
  id: string;
  latitude: number;
  longitude: number;
  vehicles: VehicleRecommendation[];
  count: number;
  isCluster: boolean;
}

interface ClusteredMapViewProps {
  vehicles: VehicleRecommendation[];
  island: Island;
  onVehiclePress: (vehicle: VehicleRecommendation) => void;
  onClusterPress: (cluster: VehicleCluster) => void;
  onRegionChange?: (region: Region) => void;
  showUserLocation?: boolean;
  clusterRadius?: number;
  minClusterSize?: number;
  style?: ViewStyle;
}

export const ClusteredMapView: React.FC<ClusteredMapViewProps> = React.memo(({
  vehicles,
  island,
  onVehiclePress,
  onClusterPress,
  onRegionChange,
  showUserLocation = true,
  clusterRadius = 50,
  minClusterSize = 2,
  style
}) => {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region>(() => getIslandRegion(island));
  const [mapDimensions, setMapDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  });
  const [isMapReady, setIsMapReady] = useState(false);

  // Calculate clusters when vehicles, region, or clustering params change
  const clusters = useMemo(() => {
    if (!isMapReady || vehicles.length === 0) return [];
    
    return createClusters(vehicles, region, mapDimensions, clusterRadius, minClusterSize);
  }, [vehicles, region, mapDimensions, clusterRadius, minClusterSize, isMapReady]);

  // Memoize island region calculation
  const islandRegion = useMemo(() => getIslandRegion(island), [island]);

  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
    onRegionChange?.(newRegion);
  }, [onRegionChange]);

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  const handleLayout = useCallback((event: NativeSyntheticEvent<any>) => {
    const { width, height } = event.nativeEvent.layout;
    setMapDimensions({ width, height });
  }, []);

  const handleMyLocationPress = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(islandRegion, 1000);
    }
  }, [islandRegion]);

  const renderClusterMarker = useCallback((cluster: VehicleCluster) => {
    if (cluster.isCluster) {
      return (
        <Marker
          key={cluster.id}
          coordinate={{
            latitude: cluster.latitude,
            longitude: cluster.longitude
          }}
          onPress={() => onClusterPress(cluster)}
        >
          <View style={[styles.clusterMarker, getClusterStyle(cluster.count)]}>
            <Text style={[styles.clusterText, getClusterTextStyle(cluster.count)]}>
              {cluster.count}
            </Text>
          </View>
        </Marker>
      );
    } else {
      const vehicle = cluster.vehicles[0];
      return (
        <Marker
          key={`vehicle-${vehicle.vehicle.id}`}
          coordinate={{
            latitude: vehicle.vehicle.latitude || 0,
            longitude: vehicle.vehicle.longitude || 0
          }}
          onPress={() => onVehiclePress(vehicle)}
        >
          <View style={[styles.vehicleMarker, getVehicleMarkerStyle(vehicle)]}>
            <Ionicons 
              name="car" 
              size={16} 
              color={colors.white} 
            />
            {vehicle.vehicle.instantBooking && (
              <View style={styles.instantBookingBadge}>
                <Ionicons name="flash" size={8} color={colors.white} />
              </View>
            )}
          </View>
          <Callout tooltip>
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle}>
                {vehicle.vehicle.year} {vehicle.vehicle.make} {vehicle.vehicle.model}
              </Text>
              <Text style={styles.calloutPrice}>
                ${vehicle.vehicle.price}/day
              </Text>
              <View style={styles.calloutFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="star" size={12} color={colors.warning} />
                  <Text style={styles.featureText}>
                    {vehicle.vehicle.rating?.toFixed(1) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="people" size={12} color={colors.primary} />
                  <Text style={styles.featureText}>
                    {vehicle.vehicle.seatingCapacity}
                  </Text>
                </View>
                {vehicle.vehicle.instantBooking && (
                  <View style={styles.featureItem}>
                    <Ionicons name="flash" size={12} color={colors.success} />
                    <Text style={styles.featureText}>Instant</Text>
                  </View>
                )}
              </View>
            </View>
          </Callout>
        </Marker>
      );
    }
  }, [onVehiclePress, onClusterPress]);

  const renderAvailabilityIndicator = useCallback(() => {
    const availableCount = vehicles.filter(v => v.vehicle.available !== false).length;
    const totalCount = vehicles.length;
    
    return (
      <View style={styles.availabilityIndicator}>
        <View style={styles.availabilityStats}>
          <Text style={styles.availabilityText}>
            {availableCount} of {totalCount} available
          </Text>
          <View style={styles.availabilityBar}>
            <View 
              style={[
                styles.availabilityFill,
                { width: `${(availableCount / totalCount) * 100}%` }
              ]} 
            />
          </View>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Busy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
        </View>
      </View>
    );
  }, [vehicles]);

  useEffect(() => {
    setRegion(islandRegion);
    if (isMapReady && mapRef.current) {
      mapRef.current.animateToRegion(islandRegion, 1000);
    }
  }, [islandRegion, isMapReady]);

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {/* @ts-ignore */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={handleMapReady}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        {...({ customMapStyle: getMapStyle(island) } as any)}
      >
        {clusters.map(renderClusterMarker)}
      </MapView>
      
      {vehicles.length > 0 && renderAvailabilityIndicator()}
      
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={handleMyLocationPress}
      >
        <Ionicons name="location" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
});

// Helper functions
function getIslandRegion(island: Island): Region {
  // Define regions for each island
  const regions = {
    'Nassau': {
      latitude: 25.0743,
      longitude: -77.3963,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1
    },
    'Freeport': {
      latitude: 26.5333,
      longitude: -78.7000,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08
    },
    'Exuma': {
      latitude: 23.5167,
      longitude: -75.8333,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15
    }
  };

  return regions[island as keyof typeof regions] || regions['Nassau'];
}

function createClusters(
  vehicles: VehicleRecommendation[],
  region: Region,
  mapDimensions: { width: number; height: number },
  clusterRadius: number,
  minClusterSize: number
): VehicleCluster[] {
  const clusters: VehicleCluster[] = [];
  const processed: boolean[] = new Array(vehicles.length).fill(false);

  // Filter vehicles that have valid coordinates
  const validVehicles = vehicles.filter(v => 
    v.vehicle.latitude != null && 
    v.vehicle.longitude != null &&
    !isNaN(v.vehicle.latitude) && 
    !isNaN(v.vehicle.longitude)
  );

  for (let i = 0; i < validVehicles.length; i++) {
    if (processed[i]) continue;

    const vehicle = validVehicles[i];
    const clusterVehicles = [vehicle];
    processed[i] = true;

    // Find nearby vehicles
    for (let j = i + 1; j < validVehicles.length; j++) {
      if (processed[j]) continue;

      const otherVehicle = validVehicles[j];
      const distance = getPixelDistance(
        { latitude: vehicle.vehicle.latitude!, longitude: vehicle.vehicle.longitude! },
        { latitude: otherVehicle.vehicle.latitude!, longitude: otherVehicle.vehicle.longitude! },
        region,
        mapDimensions
      );

      if (distance < clusterRadius) {
        clusterVehicles.push(otherVehicle);
        processed[j] = true;
      }
    }

    // Create cluster or individual marker
    if (clusterVehicles.length >= minClusterSize) {
      // Create cluster
      const centerLat = clusterVehicles.reduce((sum, v) => sum + v.vehicle.latitude!, 0) / clusterVehicles.length;
      const centerLng = clusterVehicles.reduce((sum, v) => sum + v.vehicle.longitude!, 0) / clusterVehicles.length;

      clusters.push({
        id: `cluster-${i}`,
        latitude: centerLat,
        longitude: centerLng,
        vehicles: clusterVehicles,
        count: clusterVehicles.length,
        isCluster: true
      });
    } else {
      // Create individual markers
      clusterVehicles.forEach((v, index) => {
        clusters.push({
          id: `vehicle-${v.vehicle.id}-${index}`,
          latitude: v.vehicle.latitude!,
          longitude: v.vehicle.longitude!,
          vehicles: [v],
          count: 1,
          isCluster: false
        });
      });
    }
  }

  return clusters;
}

function getPixelDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number },
  region: Region,
  mapDimensions: { width: number; height: number }
): number {
  const latPixelDelta = mapDimensions.height / region.latitudeDelta;
  const lngPixelDelta = mapDimensions.width / region.longitudeDelta;

  const latDiff = Math.abs(coord1.latitude - coord2.latitude) * latPixelDelta;
  const lngDiff = Math.abs(coord1.longitude - coord2.longitude) * lngPixelDelta;

  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

function getClusterStyle(count: number) {
  if (count >= 10) {
    return { backgroundColor: colors.error, width: 50, height: 50 };
  } else if (count >= 5) {
    return { backgroundColor: colors.warning, width: 45, height: 45 };
  } else {
    return { backgroundColor: colors.primary, width: 40, height: 40 };
  }
}

function getClusterTextStyle(count: number) {
  if (count >= 10) {
    return { fontSize: 16, fontWeight: 'bold' as const };
  } else if (count >= 5) {
    return { fontSize: 14, fontWeight: '600' as const };
  } else {
    return { fontSize: 12, fontWeight: '600' as const };
  }
}

function getVehicleMarkerStyle(vehicle: VehicleRecommendation) {
  const isAvailable = vehicle.vehicle.available !== false;
  const isInstantBooking = vehicle.vehicle.instantBooking;
  
  let backgroundColor: string = colors.primary;
  
  if (!isAvailable) {
    backgroundColor = colors.error;
  } else if (isInstantBooking) {
    backgroundColor = colors.success;
  }
  
  return { backgroundColor };
}

function getMapStyle(island: Island) {
  // Return custom map styles based on island theme
  // This is a simplified example - in production, you'd have full custom map styles
  return [
    {
      featureType: 'water',
      elementType: 'all',
      stylers: [
        { color: '#46bcec' },
        { visibility: 'on' }
      ]
    },
    {
      featureType: 'landscape',
      elementType: 'all',
      stylers: [
        { color: island === 'Nassau' ? '#f2f2f2' : '#f5f5f5' }
      ]
    },
    {
      featureType: 'poi',
      elementType: 'all',
      stylers: [
        { visibility: 'off' }
      ]
    }
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  clusterMarker: {
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterText: {
    color: colors.white,
    textAlign: 'center',
  },
  vehicleMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  instantBookingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  calloutContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: 200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  calloutPrice: {
    ...typography.heading3,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  calloutFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    color: colors.textSecondary,
  },
  availabilityIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  availabilityStats: {
    marginBottom: spacing.sm,
  },
  availabilityText: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  availabilityBar: {
    height: 6,
    backgroundColor: colors.offWhite,
    borderRadius: 3,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});