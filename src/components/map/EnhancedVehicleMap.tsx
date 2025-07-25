/**
 * Enhanced Vehicle Map Component
 * Features vehicle clustering, custom markers, route planning, and map-based search
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { 
  Marker, 
  Polyline, 
  Region, 
  MapPressEvent,
  MarkerPressEvent,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { colors, spacing, borderRadius } from '../../styles/theme';
import { VehicleRecommendation } from '../../types';
import { 
  advancedMapService, 
  VehicleCluster, 
  CustomMarker, 
  RouteInfo, 
  MapBounds,
  MapSearchFilters 
} from '../../services/advancedMapService';
import { analyticsService } from '../../services/analyticsService';
import { loggingService } from '../../services/LoggingService';
import { useUnifiedAuth } from '../../context/UnifiedAuthContext';

interface EnhancedVehicleMapProps {
  vehicles: VehicleRecommendation[];
  onVehicleSelect: (vehicle: VehicleRecommendation) => void;
  onMapBoundsChange?: (bounds: MapBounds) => void;
  onRouteRequest?: (routeInfo: RouteInfo) => void;
  showUserLocation?: boolean;
  enableClustering?: boolean;
  enableRouteMode?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid';
  searchFilters?: MapSearchFilters;
  style?: any;
}

export const EnhancedVehicleMap: React.FC<EnhancedVehicleMapProps> = React.memo(({
  vehicles,
  onVehicleSelect,
  onMapBoundsChange,
  onRouteRequest,
  showUserLocation = true,
  enableClustering = true,
  enableRouteMode = false,
  mapType = 'standard',
  searchFilters,
  style,
}) => {
  const { user } = useUnifiedAuth();
  const mapRef = useRef<MapView>(null);
  
  // State management
  const [region, setRegion] = useState<Region>({
    latitude: 25.0343, // Nassau, Bahamas
    longitude: -77.3963,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [clusters, setClusters] = useState<VehicleCluster[]>([]);
  const [customMarkers, setCustomMarkers] = useState<CustomMarker[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecommendation | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);
  const [currentMapType, setCurrentMapType] = useState<'standard' | 'satellite' | 'hybrid'>(mapType);

  // Calculate zoom level from region
  const zoomLevel = useMemo(() => {
    return Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
  }, [region.longitudeDelta]);

  // Generate clusters when vehicles or region changes
  useEffect(() => {
    if (enableClustering && vehicles.length > 0) {
      generateClusters();
    } else {
      generateCustomMarkers();
    }
  }, [vehicles, region, enableClustering]);

  // Get user location on mount
  useEffect(() => {
    if (showUserLocation) {
      getCurrentLocation();
    }
  }, [showUserLocation]);

  // Generate vehicle clusters
  const generateClusters = useCallback(async () => {
    if (!enableClustering || vehicles.length === 0) return;

    try {
      setIsLoadingClusters(true);
      
      const bounds: MapBounds = {
        northEast: {
          latitude: region.latitude + region.latitudeDelta / 2,
          longitude: region.longitude + region.longitudeDelta / 2,
        },
        southWest: {
          latitude: region.latitude - region.latitudeDelta / 2,
          longitude: region.longitude - region.longitudeDelta / 2,
        },
      };

      const generatedClusters = await advancedMapService.generateVehicleClusters(
        vehicles,
        zoomLevel,
        bounds
      );

      setClusters(generatedClusters);
      setCustomMarkers([]); // Clear individual markers when clustering

    } catch (error) {
      loggingService.error('Failed to generate clusters', error as Error);
      // Fallback to individual markers
      generateCustomMarkers();
    } finally {
      setIsLoadingClusters(false);
    }
  }, [vehicles, region, zoomLevel, enableClustering]);

  // Generate custom markers for individual vehicles
  const generateCustomMarkers = useCallback(() => {
    const markers = advancedMapService.generateCustomMarkers(vehicles);
    setCustomMarkers(markers);
    setClusters([]); // Clear clusters when showing individual markers
  }, [vehicles]);

  // Get current user location
  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        loggingService.warn('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userCoords);

      // Center map on user location if no vehicles nearby
      if (vehicles.length === 0) {
        setRegion({
          ...userCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }

      analyticsService.trackEvent('map_user_location_detected', {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
      });

    } catch (error) {
      loggingService.warn('Failed to get user location', error as Error);
    }
  }, [vehicles.length]);

  // Handle region change
  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);

    // Notify parent of bounds change
    if (onMapBoundsChange) {
      const bounds: MapBounds = {
        northEast: {
          latitude: newRegion.latitude + newRegion.latitudeDelta / 2,
          longitude: newRegion.longitude + newRegion.longitudeDelta / 2,
        },
        southWest: {
          latitude: newRegion.latitude - newRegion.latitudeDelta / 2,
          longitude: newRegion.longitude - newRegion.longitudeDelta / 2,
        },
      };
      onMapBoundsChange(bounds);
    }
  }, [onMapBoundsChange]);

  // Handle vehicle marker press
  const handleVehicleMarkerPress = useCallback((vehicle: VehicleRecommendation) => {
    setSelectedVehicle(vehicle);
    onVehicleSelect(vehicle);

    // Track marker interaction
    analyticsService.trackVehicleInteraction(vehicle.id, 'map_marker_press', {
      vehicleType: vehicle.vehicle.type,
      price: vehicle.pricePerDay,
      available: vehicle.available,
    }, user?.id.toString());
  }, [onVehicleSelect, user]);

  // Handle cluster press
  const handleClusterPress = useCallback((cluster: VehicleCluster) => {
    if (cluster.vehicleCount === 1) {
      // Single vehicle cluster - treat as vehicle marker
      handleVehicleMarkerPress(cluster.vehicles[0]);
    } else {
      // Multi-vehicle cluster - zoom in
      const newRegion: Region = {
        latitude: cluster.coordinate.latitude,
        longitude: cluster.coordinate.longitude,
        latitudeDelta: region.latitudeDelta * 0.5,
        longitudeDelta: region.longitudeDelta * 0.5,
      };
      
      mapRef.current?.animateToRegion(newRegion, 500);

      analyticsService.trackEvent('map_cluster_press', {
        vehicleCount: cluster.vehicleCount,
        zoomLevel,
        newZoomLevel: zoomLevel + 1,
      });
    }
  }, [handleVehicleMarkerPress, region, zoomLevel]);

  // Plan route to selected vehicle
  const planRouteToVehicle = useCallback(async (vehicle: VehicleRecommendation) => {
    if (!userLocation || !enableRouteMode) return;

    try {
      setIsLoadingRoute(true);
      
      const destination = {
        latitude: vehicle.vehicle.location?.latitude || 0,
        longitude: vehicle.vehicle.location?.longitude || 0,
      };

      const route = await advancedMapService.planRoute(
        userLocation,
        destination,
        'driving'
      );

      setRouteInfo(route);
      onRouteRequest?.(route);

      // Fit map to show entire route
      const coordinates = [
        userLocation,
        destination,
      ];

      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });

      analyticsService.trackEvent('map_route_planned', {
        vehicleId: vehicle.id,
        distance: route.distance,
        duration: route.duration,
        hasTraffic: !!route.trafficInfo,
      });

    } catch (error) {
      loggingService.error('Failed to plan route', error as Error);
      Alert.alert(
        'Route Planning Failed',
        'Unable to plan route to this vehicle. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingRoute(false);
    }
  }, [userLocation, enableRouteMode, onRouteRequest]);

  // Toggle map type
  const toggleMapType = useCallback(() => {
    const types: Array<'standard' | 'satellite' | 'hybrid'> = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(currentMapType);
    const nextType = types[(currentIndex + 1) % types.length];
    
    setCurrentMapType(nextType);
    
    analyticsService.trackEvent('map_type_changed', {
      from: currentMapType,
      to: nextType,
    });
  }, [currentMapType]);

  // Clear route
  const clearRoute = useCallback(() => {
    setRouteInfo(null);
    setSelectedVehicle(null);
  }, []);

  // Render cluster marker
  const renderClusterMarker = useCallback((cluster: VehicleCluster) => (
    <Marker
      key={cluster.id}
      coordinate={cluster.coordinate}
      onPress={() => handleClusterPress(cluster)}
    >
      <View style={[
        styles.clusterMarker,
        cluster.vehicleCount > 10 && styles.largeCluster,
        cluster.availableCount === 0 && styles.unavailableCluster,
      ]}>
        <Text style={styles.clusterText}>{cluster.vehicleCount}</Text>
        <Text style={styles.clusterPrice}>${Math.round(cluster.averagePrice)}</Text>
      </View>
    </Marker>
  ), [handleClusterPress]);

  // Render vehicle marker
  const renderVehicleMarker = useCallback((marker: CustomMarker) => (
    <Marker
      key={marker.id}
      coordinate={marker.coordinate}
      onPress={() => handleVehicleMarkerPress(marker.vehicle)}
    >
      <View style={[
        styles.vehicleMarker,
        styles[`${marker.markerType}Marker`],
        styles[`${marker.availabilityStatus}Marker`],
        styles[`${marker.priceLevel}Marker`],
      ]}>
        <Ionicons 
          name={getMarkerIcon(marker.markerType)} 
          size={20} 
          color={getMarkerColor(marker.availabilityStatus)} 
        />
      </View>
    </Marker>
  ), [handleVehicleMarkerPress]);

  // Helper functions for marker styling
  const getMarkerIcon = (type: CustomMarker['markerType']): string => {
    switch (type) {
      case 'car': return 'car';
      case 'scooter': return 'bicycle';
      case 'motorcycle': return 'bicycle';
      case 'bicycle': return 'bicycle';
      default: return 'location';
    }
  };

  const getMarkerColor = (status: CustomMarker['availabilityStatus']): string => {
    switch (status) {
      case 'available': return colors.success;
      case 'unavailable': return colors.error;
      case 'reserved': return colors.warning;
      case 'maintenance': return colors.darkGrey;
      default: return colors.primary;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={currentMapType}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
      >
        {/* Render clusters */}
        {enableClustering && clusters.map(renderClusterMarker)}
        
        {/* Render individual markers */}
        {!enableClustering && customMarkers.map(renderVehicleMarker)}
        
        {/* Render route polyline */}
        {routeInfo && userLocation && selectedVehicle && (
          <Polyline
            coordinates={[
              userLocation,
              {
                latitude: selectedVehicle.vehicle.location?.latitude || 0,
                longitude: selectedVehicle.vehicle.location?.longitude || 0,
              }
            ]}
            strokeColor={colors.primary}
            strokeWidth={4}
            strokePattern={[1]}
          />
        )}
      </MapView>

      {/* Map controls */}
      <View style={styles.mapControls}>
        {/* Map type toggle */}
        <TouchableOpacity style={styles.controlButton} onPress={toggleMapType}>
          <Ionicons name="layers" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Current location */}
        {showUserLocation && (
          <TouchableOpacity style={styles.controlButton} onPress={getCurrentLocation}>
            <Ionicons name="locate" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Route planning */}
        {enableRouteMode && selectedVehicle && (
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => planRouteToVehicle(selectedVehicle)}
            disabled={isLoadingRoute}
          >
            {isLoadingRoute ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="navigate" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}

        {/* Clear route */}
        {routeInfo && (
          <TouchableOpacity style={styles.controlButton} onPress={clearRoute}>
            <Ionicons name="close" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading indicator for clustering */}
      {isLoadingClusters && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Updating map...</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.md,
    gap: spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clusterMarker: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.xs,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  largeCluster: {
    backgroundColor: colors.secondary,
    minWidth: 50,
  },
  unavailableCluster: {
    backgroundColor: colors.lightGrey,
  },
  clusterText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  clusterPrice: {
    color: colors.white,
    fontSize: 10,
  },
  vehicleMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  carMarker: {
    backgroundColor: colors.primary,
  },
  scooterMarker: {
    backgroundColor: colors.secondary,
  },
  motorcycleMarker: {
    backgroundColor: colors.warning,
  },
  bicycleMarker: {
    backgroundColor: colors.success,
  },
  otherMarker: {
    backgroundColor: colors.darkGrey,
  },
  availableMarker: {
    borderColor: colors.success,
  },
  unavailableMarker: {
    borderColor: colors.error,
    opacity: 0.6,
  },
  reservedMarker: {
    borderColor: colors.warning,
  },
  maintenanceMarker: {
    borderColor: colors.darkGrey,
    opacity: 0.7,
  },
  budgetMarker: {
    // Base styling
  },
  standardMarker: {
    // Base styling
  },
  premiumMarker: {
    borderWidth: 3,
  },
  luxuryMarker: {
    borderWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
});

export default EnhancedVehicleMap;
