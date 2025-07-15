import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import InteractiveVehicleMap from '../components/MapView';
import { Vehicle } from '../types';
import { locationService } from '../services/LocationService';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | undefined>(undefined);

  useEffect(() => {
    loadVehicles();
    getUserLocation();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      // For now, use mock data - in real app, this would call API
      setVehicles(getMockVehicles());
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles(getMockVehicles());
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location.coords);
      } else {
        // Fallback to Nassau
        setUserLocation({
          latitude: 25.0343,
          longitude: -77.3963,
        });
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      // Fallback to Nassau
      setUserLocation({
        latitude: 25.0343,
        longitude: -77.3963,
      });
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicle });
  };

  const centerOnUserLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setUserLocation(location.coords);
    }
  };

  const getMockVehicles = (): Vehicle[] => [
    {
      id: 1,
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      ownerId: 1,
      location: 'Nassau Downtown',
      dailyRate: 65,
      available: true,
      driveSide: 'LHD',
      createdAt: '2024-01-15',
      latitude: 25.0343,
      longitude: -77.3963,
      vehicleType: 'sedan',
      seatingCapacity: 5,
      color: 'Silver',
      description: 'Clean and reliable sedan perfect for exploring Nassau',
    },
    {
      id: 2,
      make: 'Honda',
      model: 'CR-V',
      year: 2023,
      ownerId: 2,
      location: 'Paradise Island',
      dailyRate: 85,
      available: true,
      driveSide: 'LHD',
      createdAt: '2024-01-20',
      latitude: 25.0833,
      longitude: -77.3167,
      vehicleType: 'suv',
      seatingCapacity: 7,
      color: 'Blue',
      description: 'Spacious SUV ideal for family trips',
    },
    {
      id: 3,
      make: 'Ford',
      model: 'Mustang',
      year: 2021,
      ownerId: 3,
      location: 'Cable Beach',
      dailyRate: 120,
      available: true,
      driveSide: 'LHD',
      createdAt: '2024-01-10',
      latitude: 25.0580,
      longitude: -77.3430,
      vehicleType: 'convertible',
      seatingCapacity: 4,
      color: 'Red',
      description: 'Convertible sports car for the ultimate island experience',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading vehicles on map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Vehicle Map</Text>
        <TouchableOpacity
          style={styles.mapTypeButton}
          onPress={() => {}}
        >
          <Ionicons name="map" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <InteractiveVehicleMap
        vehicles={vehicles}
        onVehicleSelect={handleVehicleSelect}
        userLocation={userLocation}
        showUserLocation={true}
        clustering={true}
      />

      <TouchableOpacity
        style={styles.locationButton}
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  mapTypeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  legend: {
    position: 'absolute',
    top: 80,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default MapScreen;
