import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/Theme';

interface ServiceOptionsFilterProps {
  deliveryAvailable: boolean;
  airportPickup: boolean;
  onUpdateFilter: <K extends keyof any>(key: K, value: any) => void;
}

const ServiceOptionsFilter: React.FC<ServiceOptionsFilterProps> = ({ deliveryAvailable, airportPickup, onUpdateFilter }) => {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Service Options</Text>
      <View style={styles.serviceOptionsContainer}>
        <TouchableOpacity
          style={[
            styles.serviceOption,
            deliveryAvailable && styles.serviceOptionSelected
          ]}
          onPress={() => onUpdateFilter('deliveryAvailable', !deliveryAvailable)}
          accessibilityRole="button"
          accessibilityLabel="Delivery Available option"
        >
          <Ionicons 
            name="cube-outline" 
            size={20} 
            color={deliveryAvailable ? colors.white : colors.primary} 
          />
          <Text style={[
            styles.serviceOptionText,
            deliveryAvailable && styles.serviceOptionTextSelected
          ]}>
            Delivery Available
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.serviceOption,
            airportPickup && styles.serviceOptionSelected
          ]}
          onPress={() => onUpdateFilter('airportPickup', !airportPickup)}
          accessibilityRole="button"
          accessibilityLabel="Airport Pickup option"
        >
          <Ionicons 
            name="airplane-outline" 
            size={20} 
            color={airportPickup ? colors.white : colors.primary} 
          />
          <Text style={[
            styles.serviceOptionText,
            airportPickup && styles.serviceOptionTextSelected
          ]}>
            Airport Pickup
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.darkGrey,
  },
  serviceOptionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  serviceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  serviceOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceOptionText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.darkGrey,
    fontWeight: '500',
  },
  serviceOptionTextSelected: {
    color: colors.white,
  },
});

export default ServiceOptionsFilter;