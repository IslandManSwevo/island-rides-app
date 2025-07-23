import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../styles/theme';

interface CompareVehiclesScreenProps {
  navigation: any;
  route: {
    params: {
      vehicleIds: number[];
    };
  };
}

export const CompareVehiclesScreen: React.FC<CompareVehiclesScreenProps> = ({
  navigation,
  route
}) => {
  const { vehicleIds } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Compare Vehicles</Text>
        <Text style={styles.subtitle}>
          Comparing {vehicleIds.length} vehicle{vehicleIds.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.placeholder}>
          This screen will allow hosts to compare vehicle performance,
          including booking rates, revenue, maintenance costs, and customer ratings
          side by side.
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

export default CompareVehiclesScreen;
