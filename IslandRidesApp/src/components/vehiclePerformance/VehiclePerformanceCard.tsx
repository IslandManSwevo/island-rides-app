import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../../styles/Theme';
import { RootStackParamList } from '../../navigation/routes';
import { VehicleHeader } from './VehicleHeader';
import { VehicleMetrics } from './VehicleMetrics';
import { VehiclePerformanceMetrics } from './VehiclePerformanceMetrics';
import { VehicleActions } from './VehicleActions';

interface VehiclePerformance {
  id: number;
  make: string;
  model: string;
  year: number;
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
  verificationStatus: string;
  conditionRating: number;
}

interface VehiclePerformanceCardProps {
  vehicle: VehiclePerformance;
  onPress: (vehicle: VehiclePerformance) => void;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
  getPerformanceColor: (value: number, type: string) => string;
  getVerificationStatusColor: (status: string) => string;
  getVerificationStatusIcon: (status: string) => any;
  navigation: NavigationProp<RootStackParamList>;
}

export const VehiclePerformanceCard: React.FC<VehiclePerformanceCardProps> = ({ 
  vehicle, 
  onPress, 
  formatCurrency, 
  formatPercentage, 
  getPerformanceColor, 
  getVerificationStatusColor, 
  getVerificationStatusIcon,
  navigation
}) => (
  <TouchableOpacity 
    style={styles.vehicleCard}
    onPress={() => onPress(vehicle)}
  >
    <VehicleHeader
      vehicle={vehicle}
      formatCurrency={formatCurrency}
      getVerificationStatusColor={getVerificationStatusColor}
      getVerificationStatusIcon={getVerificationStatusIcon}
    />
    
    <VehicleMetrics
      vehicle={vehicle}
      formatCurrency={formatCurrency}
      getPerformanceColor={getPerformanceColor}
    />
    
    <VehiclePerformanceMetrics
      vehicle={vehicle}
      formatCurrency={formatCurrency}
      formatPercentage={formatPercentage}
      getPerformanceColor={getPerformanceColor}
    />
    
    <VehicleActions
      vehicleId={vehicle.id}
      navigation={navigation}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
});