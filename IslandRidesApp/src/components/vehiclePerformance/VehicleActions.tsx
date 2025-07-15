import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { colors, typography, spacing } from '../../styles/Theme';
import { RootStackParamList } from '../../navigation/routes';

interface VehicleActionsProps {
  vehicleId: number;
  navigation: NavigationProp<RootStackParamList>;
}

export const VehicleActions: React.FC<VehicleActionsProps> = ({
  vehicleId,
  navigation
}) => (
  <View style={styles.cardActions}>
    <TouchableOpacity 
      style={styles.actionButton}
      onPress={() => navigation.navigate('VehicleConditionTracker', { vehicleId })}
    >
      <Ionicons name="build-outline" size={16} color={colors.primary} />
      <Text style={styles.actionButtonText}>Maintenance</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.actionButton}
      onPress={() => navigation.navigate('VehiclePhotoUpload', { vehicleId })}
    >
      <Ionicons name="camera-outline" size={16} color={colors.primary} />
      <Text style={styles.actionButtonText}>Photos</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.actionButton}
      onPress={() => navigation.navigate('VehicleAvailability', { vehicleId })}
    >
      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
      <Text style={styles.actionButtonText}>Calendar</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.offWhite,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});