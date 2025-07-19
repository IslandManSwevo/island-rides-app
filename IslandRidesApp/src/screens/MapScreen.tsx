import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import InteractiveVehicleMap from '../components/MapView';
import { Vehicle, VehicleRecommendation, Island } from '../types';
import { locationService } from '../services/LocationService';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, ROUTES } from '../navigation/routes';
import { mapAnalyticsService } from '../services/mapAnalyticsService';
import { vehicleService } from '../services/vehicleService';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [vehicles, setVehicles] = useState<VehicleRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | undefined>(undefined);
  const [enableClustering, setEnableClustering] = useState(true);
  const [currentIsland, setCurrentIsland] = useState<Island>('Nassau');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    initializeMap();
    return () => {
      if (sessionId) {
        mapAnalyticsService.endSession();
      }
    };
  }, []);

  const initializeMap = async () => {
    try {
      await Promise.all([
        loadVehicles(),
        getUserLocation(),
        startAnalyticsSession()
      ]);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const startAnalyticsSession = async () => {
    try {
      const id = await mapAnalyticsService.startSession(currentIsland, {}, userLocation);
      setSessionId(id);
    } catch (error: unknown) {
      console.error('Error starting analytics session:', String(error));
    }
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      // In real app, this would call the search API with map region
      const searchParams = {
        location: currentIsland,
        page: 1,
        limit: 100 // Load more vehicles for map view
      };
      
      const vehicleData = await vehicleService.searchVehicles(searchParams);
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      // Fallback to mock data
      setVehicles(getMockVehicleRecommendations());
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

  const handleVehicleSelect = async (vehicle: Vehicle | VehicleRecommendation) => {
    try {
      // Extract Vehicle data for navigation
      const vehicleData: Vehicle = 'vehicle' in vehicle ? vehicle.vehicle : vehicle as Vehicle;
      
      // Track analytics
      if ('vehicle' in vehicle) {
        await mapAnalyticsService.trackVehicleClick(vehicle.vehicle.id.toString(), vehicle);
      } else {
        const vehicleObj = vehicle as Vehicle;
        await mapAnalyticsService.trackVehicleClick(vehicleObj.id.toString(), {
          vehicle: vehicleObj,
          id: vehicleObj.id.toString(),
          recommendationScore: 0,
          type: vehicleObj.vehicleType || 'unknown',
          island: 'Nassau',
          pricePerDay: vehicleObj.dailyRate,
          scoreBreakdown: {
            collaborativeFiltering: 0,
            vehiclePopularity: 0,
            vehicleRating: 0,
            hostPopularity: 0,
          },
          score: 0,
          reasons: []
        });
      }
      
      navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicle: vehicleData });
    } catch (error) {
      console.error('Error handling vehicle selection:', error);
      // Navigate anyway
      const vehicleData: Vehicle = 'vehicle' in vehicle ? vehicle.vehicle : vehicle as Vehicle;
      navigation.navigate(ROUTES.VEHICLE_DETAIL, { vehicle: vehicleData });
    }
  };

  const handleRegionChange = async (region: any) => {
    try {
      await mapAnalyticsService.trackMapDrag(
        { latitude: region.latitude, longitude: region.longitude },
        currentIsland
      );
    } catch (error) {
      console.error('Error tracking map drag:', error);
    }
  };

  const centerOnUserLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setUserLocation(location.coords);
    }
  };

  const getMockVehicleRecommendations = (): VehicleRecommendation[] => [
    {
      id: '1',
      recommendationScore: 0.9,
      type: 'sedan',
      island: 'Nassau',
      pricePerDay: 65,
      scoreBreakdown: {
        collaborativeFiltering: 0.2,
        vehiclePopularity: 0.3,
        vehicleRating: 0.3,
        hostPopularity: 0.1,
      },
      score: 0.9,
      reasons: ['Highly rated', 'Popular choice'],
      vehicle: {
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
        averageRating: 4.5,
        verificationStatus: 'verified',
      },
    },
    {
      id: '2',
      recommendationScore: 0.8,
      type: 'suv',
      island: 'Nassau',
      pricePerDay: 85,
      scoreBreakdown: {
        collaborativeFiltering: 0.15,
        vehiclePopularity: 0.25,
        vehicleRating: 0.25,
        hostPopularity: 0.15,
      },
      score: 0.8,
      reasons: ['Family-friendly', 'Good value'],
      vehicle: {
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
        averageRating: 4.2,
        verificationStatus: 'verified',
      },
    },
    {
      id: '3',
      recommendationScore: 0.7,
      type: 'convertible',
      island: 'Nassau',
      pricePerDay: 120,
      scoreBreakdown: {
        collaborativeFiltering: 0.1,
        vehiclePopularity: 0.2,
        vehicleRating: 0.35,
        hostPopularity: 0.05,
      },
      score: 0.7,
      reasons: ['Premium experience', 'Sports car'],
      vehicle: {
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
        averageRating: 4.8,
        verificationStatus: 'verified',
      },
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
        <View style={styles.clusterToggle}>
          <Switch
            value={enableClustering}
            onValueChange={setEnableClustering}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={enableClustering ? '#f5dd4b' : '#f4f3f4'}
          />
          <Text style={styles.toggleLabel}>Cluster</Text>
        </View>
      </View>

      <InteractiveVehicleMap
        vehicles={vehicles}
        onVehicleSelect={handleVehicleSelect}
        userLocation={userLocation}
        showUserLocation={true}
        enableClustering={enableClustering}
        island={currentIsland}
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
          <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
          <Text style={styles.legendText}>Instant Book</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
        {enableClustering && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
            <Text style={styles.legendText}>Cluster</Text>
          </View>
        )}
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
  clusterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
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
