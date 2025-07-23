import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../styles/theme';

interface VehicleAvailabilityScreenProps {
  navigation: any;
  route: {
    params: {
      vehicleId: number;
    };
  };
}

export const VehicleAvailabilityScreen: React.FC<VehicleAvailabilityScreenProps> = ({
  navigation,
  route
}) => {
  const { vehicleId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Vehicle Availability</Text>
        <Text style={styles.subtitle}>Vehicle ID: {vehicleId}</Text>
        <Text style={styles.placeholder}>
          This screen will allow hosts to manage vehicle availability,
          including setting blocked dates, recurring availability patterns,
          and special pricing periods.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  placeholder: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
});

export default VehicleAvailabilityScreen;
