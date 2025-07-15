import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../types';

const { width, height } = Dimensions.get('window');

interface MapViewProps {
  vehicles: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  showUserLocation?: boolean;
  clustering?: boolean;
}

export const InteractiveVehicleMap: React.FC<MapViewProps> = ({
  vehicles,
  onVehicleSelect,
  userLocation,
  showUserLocation = true,
  clustering = true,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [region, setRegion] = useState({
    latitude: 25.0343, // Nassau default
    longitude: -77.3963,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (userLocation) {
      setRegion({
        ...region,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }
  }, [userLocation]);

  const handleMarkerPress = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
  };

  const bahamasMapStyle = [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#f5f5f5" }]
    },
    {
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#616161" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#c9e9ff" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [{ "color": "#e8f4f8" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#ffffff" }]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [{ "color": "#eeeeee" }]
    }
  ];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={bahamasMapStyle}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            coordinate={{
              latitude: vehicle.latitude || 25.0343,
              longitude: vehicle.longitude || -77.3963,
            }}
            onPress={() => handleMarkerPress(vehicle)}
            pinColor={vehicle.available ? '#007AFF' : '#FF3B30'}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.vehicleName}>
                  {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.vehiclePrice}>
                  ${vehicle.dailyRate}/day
                </Text>
                <Text style={styles.vehicleLocation}>
                  {vehicle.location}
                </Text>
                <TouchableOpacity
                  style={styles.calloutButton}
                  onPress={() => handleMarkerPress(vehicle)}
                >
                  <Text style={styles.calloutButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}

        {userLocation && showUserLocation && (
          <Marker
            coordinate={userLocation}
            pinColor="#34C759"
            title="Your Location"
          >
            <Ionicons name="location" size={24} color="#34C759" />
          </Marker>
        )}
      </MapView>

      {selectedVehicle && (
        <View style={styles.selectedVehicleCard}>
          <TouchableOpacity
            style={styles.vehicleInfo}
            onPress={() => {
              setSelectedVehicle(null);
              onVehicleSelect?.(selectedVehicle);
            }}
          >
            <Text style={styles.vehicleTitle}>
              {selectedVehicle.make} {selectedVehicle.model}
            </Text>
            <Text style={styles.vehiclePriceText}>
              ${selectedVehicle.dailyRate}/day
            </Text>
            <Text style={styles.vehicleLocationText}>
              {selectedVehicle.location}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehiclePrice: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  vehicleLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedVehicleCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  vehicleInfo: {
    flexDirection: 'column',
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehiclePriceText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 2,
  },
  vehicleLocationText: {
    fontSize: 14,
    color: '#666',
  },
});

export default InteractiveVehicleMap;
