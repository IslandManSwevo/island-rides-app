import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { AppHeader } from '../components/AppHeader';
import { VehiclePerformanceSkeleton } from '../components/skeletons/VehiclePerformanceSkeleton';
import { VehicleSummaryCards } from '../components/vehiclePerformance/VehicleSummaryCards';
import { VehicleSortControls } from '../components/vehiclePerformance/VehicleSortControls';
import { VehiclePerformanceCard } from '../components/vehiclePerformance/VehiclePerformanceCard';
import { VehicleEmptyState } from '../components/vehiclePerformance/VehicleEmptyState';
import { RootStackParamList } from '../navigation/routes';

interface VehiclePerformance {
  id: number;
  make: string;
  model: string;
  year: number;
  ownerId: number;
  location: string;
  dailyRate: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  occupancyRate: number;
  recentBookings: number;
  recentRevenue: number;
  maintenanceInfo: {
    maintenanceCount: number;
    lastMaintenance: string | null;
  };
  available: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  conditionRating: number;
}

type VehiclePerformanceScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface VehiclePerformanceScreenProps {
  navigation: VehiclePerformanceScreenNavigationProp;
}

interface VehiclePerformanceResponse {
  success: boolean;
  data: VehiclePerformance[];
  message?: string;
}

export const VehiclePerformanceScreen: React.FC<VehiclePerformanceScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<VehiclePerformance[]>([]);
  const [sortBy, setSortBy] = useState('totalRevenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortOptions = [
    { label: 'Revenue', value: 'totalRevenue' },
    { label: 'Bookings', value: 'totalBookings' },
    { label: 'Rating', value: 'averageRating' },
    { label: 'Occupancy', value: 'occupancyRate' },
    { label: 'Recent Performance', value: 'recentRevenue' },
  ];

  useEffect(() => {
    loadVehiclePerformance();
  }, []);

  const loadVehiclePerformance = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.get('/owner/vehicles/performance') as VehiclePerformanceResponse;
      
      if (response.success) {
        setVehicles(response.data || []);
      } else {
        throw new Error('Failed to load vehicle performance data');
      }
    } catch (error) {
      console.error('Vehicle performance error:', error);
      notificationService.error('Failed to load vehicle performance data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVehiclePerformance();
    setRefreshing(false);
  }, []);

  const sortVehicles = (vehicles: VehiclePerformance[]) => {
    return [...vehicles].sort((a, b) => {
      let aValue = a[sortBy as keyof VehiclePerformance];
      let bValue = b[sortBy as keyof VehiclePerformance];

      // Handle null/undefined values
      if (aValue == null) aValue = 0;
      if (bValue == null) bValue = 0;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }
      
      return sortOrder === 'desc' 
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number, type: string) => {
    switch (type) {
      case 'rating':
        if (value >= 4.5) return colors.success;
        if (value >= 4.0) return colors.warning;
        return colors.error;
      case 'occupancy':
        if (value >= 70) return colors.success;
        if (value >= 50) return colors.warning;
        return colors.error;
      case 'condition':
        if (value >= 4.5) return colors.success;
        if (value >= 4.0) return colors.warning;
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getVerificationStatusColor = (status: 'pending' | 'verified' | 'rejected' | 'expired') => {
    switch (status) {
      case 'verified':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      default:
        return colors.lightGrey;
    }
  };

  const getVerificationStatusIcon = (status: 'pending' | 'verified' | 'rejected' | 'expired') => {
    switch (status) {
      case 'verified':
        return 'checkmark-circle';
      case 'pending':
        return 'time-outline';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const handleVehiclePress = (vehicle: VehiclePerformance) => {
    navigation.navigate('VehicleDetail', { 
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        ownerId: vehicle.ownerId,
        location: vehicle.location,
        dailyRate: vehicle.dailyRate,
        available: vehicle.available,
        driveSide: 'LHD' as const, // Add required property with default
        createdAt: new Date().toISOString(), // Add required property with default
        averageRating: vehicle.averageRating,
        totalReviews: vehicle.reviewCount,
        verificationStatus: vehicle.verificationStatus,
        conditionRating: vehicle.conditionRating,
      }
    });
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setSortOrder('desc');
  };

  const handleOrderChange = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };



  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Vehicle Performance" navigation={navigation} showBackButton />
        <VehiclePerformanceSkeleton vehicleCount={5} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Vehicle Performance" navigation={navigation} showBackButton />
      
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <VehicleSummaryCards
          vehicles={vehicles}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
          getPerformanceColor={getPerformanceColor}
        />
        <VehicleSortControls
          sortOptions={sortOptions}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onOrderChange={handleOrderChange}
        />

        {vehicles.length === 0 ? (
          <VehicleEmptyState />
        ) : (
          <View style={styles.vehiclesList}>
            {sortVehicles(vehicles).map(vehicle => (
              <VehiclePerformanceCard
                key={vehicle.id}
                vehicle={vehicle}
                onPress={handleVehiclePress}
                formatCurrency={formatCurrency}
                formatPercentage={formatPercentage}
                getPerformanceColor={getPerformanceColor}
                getVerificationStatusColor={getVerificationStatusColor}
                getVerificationStatusIcon={getVerificationStatusIcon}
                navigation={navigation}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  vehiclesList: {
    paddingHorizontal: spacing.md,
  },
});