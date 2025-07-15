import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../styles/Theme';
import { RootStackParamList } from '../navigation/routes';

// Helper function to check if cleaning is due (more than 7 days since last cleaned)
const isCleaningDue = (lastCleaned: string | null): boolean => {
  if (!lastCleaned) return false;
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  return new Date().getTime() - new Date(lastCleaned).getTime() > sevenDaysInMs;
};


type IconName = keyof typeof Ionicons.glyphMap;

interface Vehicle {
    id: number;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    dailyRate: number;
    available: boolean;
    verificationStatus: string;
    conditionRating: number;
    location: string;
    mileage: number;
    nextMaintenanceDate: string | null;
    activeBookings: number;
    upcomingBookings: number;
    lastCleaned: string | null;
    insuranceExpiry: string | null;
    registrationExpiry: string | null;
  }

interface FleetVehicleCardProps {
  vehicle: Vehicle;
  isSelected: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleAvailability: () => void;
  navigation: NavigationProp<RootStackParamList>;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

const getStatusColor = (vehicle: Vehicle) => {
    if (!vehicle.available) return colors.error;
    if (vehicle.nextMaintenanceDate && new Date(vehicle.nextMaintenanceDate) <= new Date()) {
      return colors.warning;
    }
    return colors.success;
  };

const getStatusText = (vehicle: Vehicle) => {
    if (!vehicle.available) return 'Unavailable';
    if (vehicle.nextMaintenanceDate && new Date(vehicle.nextMaintenanceDate) <= new Date()) {
      return 'Maintenance Due';
    }
    return 'Available';
  };

const isMaintenanceDue = (vehicle: Vehicle) => {
    return vehicle.nextMaintenanceDate && new Date(vehicle.nextMaintenanceDate) <= new Date();
  };

const isInsuranceExpiring = (vehicle: Vehicle) => {
    if (!vehicle.insuranceExpiry) return false;
    const expiryDate = new Date(vehicle.insuranceExpiry);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 30); // 30 days warning
    return expiryDate <= warningDate;
  };

export const FleetVehicleCard: React.FC<FleetVehicleCardProps> = ({ 
  vehicle,
  isSelected,
  selectionMode,
  onPress,
  onLongPress,
  onToggleAvailability,
  navigation
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.vehicleCard,
        isSelected && styles.vehicleCardSelected
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {selectionMode && (
        <View style={styles.selectionCheckbox}>
          <Ionicons 
            name={isSelected ? 'checkbox' : 'square-outline'} 
            size={20} 
            color={colors.primary} 
          />
        </View>
      )}

      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.licensePlate}>{vehicle.licensePlate}</Text>
        </View>
        <View style={styles.vehicleStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(vehicle) }
          ]}>
            <Text style={styles.statusText}>{getStatusText(vehicle)}</Text>
          </View>
          <Text style={styles.dailyRate}>{formatCurrency(vehicle.dailyRate)}/day</Text>
        </View>
      </View>

      <View style={styles.vehicleMetrics}>
        <View style={styles.metric}>
          <Ionicons name="location-outline" size={16} color={colors.lightGrey} />
          <Text style={styles.metricText}>{vehicle.location}</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="speedometer-outline" size={16} color={colors.lightGrey} />
          <Text style={styles.metricText}>{vehicle.mileage.toLocaleString()} miles</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="star-outline" size={16} color={colors.lightGrey} />
          <Text style={styles.metricText}>{vehicle.conditionRating.toFixed(1)}/5</Text>
        </View>
      </View>

      <View style={styles.bookingInfo}>
        <Text style={styles.bookingText}>
          Active: {vehicle.activeBookings} • Upcoming: {vehicle.upcomingBookings}
        </Text>
      </View>

      {/* Alerts */}
      <View style={styles.alerts}>
        {isMaintenanceDue(vehicle) && (
          <View style={[styles.alert, { backgroundColor: colors.warning }]}>
            <Ionicons name="build" size={12} color={colors.white} />
            <Text style={styles.alertText}>Maintenance Due</Text>
          </View>
        )}
        {isInsuranceExpiring(vehicle) && (
          <View style={[styles.alert, { backgroundColor: colors.error }]}>
            <Ionicons name="shield" size={12} color={colors.white} />
            <Text style={styles.alertText}>Insurance Expiring</Text>
          </View>
        )}
        {isCleaningDue(vehicle.lastCleaned) && (
          <View style={[styles.alert, { backgroundColor: colors.info }]}>
            <Ionicons name="sparkles" size={12} color={colors.white} />
            <Text style={styles.alertText}>Cleaning Due</Text>
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={onToggleAvailability}
        >
          <Ionicons 
            name={vehicle.available ? 'pause-circle' : 'play-circle'} 
            size={16} 
            color={colors.primary} 
          />
          <Text style={styles.quickActionText}>
            {vehicle.available ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('VehicleConditionTracker', { vehicleId: vehicle.id })}
        >
          <Ionicons name="build-outline" size={16} color={colors.primary} />
          <Text style={styles.quickActionText}>Maintenance</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('VehicleAvailability', { vehicleId: vehicle.id })}
        >
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.quickActionText}>Calendar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    vehicleCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
      },
      vehicleCardSelected: {
        borderColor: colors.primary,
        borderWidth: 2,
      },
      selectionCheckbox: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        zIndex: 1,
      },
      vehicleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
      },
      vehicleInfo: {
        flex: 1,
      },
      vehicleName: {
        ...typography.displayMedium,
        color: colors.text,
      },
      licensePlate: {
        ...typography.body,
        color: colors.textSecondary,
      },
      vehicleStatus: {
        alignItems: 'flex-end',
      },
      statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.xs,
      },
      statusText: {
        fontSize: 12,
        lineHeight: 16,
        color: colors.white,
        fontWeight: 'bold',
      },
      dailyRate: {
        ...typography.displayMedium,
        color: colors.text,
      },
      vehicleMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.sm,
      },
      metric: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      metricText: {
        ...typography.body,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
      },
      bookingInfo: {
        marginBottom: spacing.sm,
      },
      bookingText: {
        ...typography.body,
        color: colors.textSecondary,
        fontStyle: 'italic',
      },
      alerts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.md,
      },
      alert: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
      },
      alertText: {
        fontSize: 12,
        lineHeight: 16,
        color: colors.white,
        marginLeft: spacing.xs,
      },
      quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderColor: colors.border,
        paddingTop: spacing.md,
      },
      quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      quickActionText: {
        ...typography.body,
        color: colors.primary,
        marginLeft: spacing.xs,
        fontWeight: '600',
      },
  });