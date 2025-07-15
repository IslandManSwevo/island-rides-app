import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../styles/Theme';

export const VehicleEmptyState: React.FC = () => (
  <View style={styles.emptyState}>
    <Ionicons name="car-outline" size={64} color={colors.lightGrey} />
    <Text style={styles.emptyStateTitle}>No vehicles found</Text>
    <Text style={styles.emptyStateText}>
      Add your first vehicle to start tracking performance
    </Text>
  </View>
);

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.heading2,
    color: colors.darkGrey,
    marginTop: spacing.md,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGrey,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});