import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../styles/theme';

interface BulkRateUpdateScreenProps {
  navigation: any;
  route: {
    params: {
      vehicleIds: number[];
    };
  };
}

export const BulkRateUpdateScreen: React.FC<BulkRateUpdateScreenProps> = ({
  navigation,
  route
}) => {
  const { vehicleIds } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bulk Rate Update</Text>
        <Text style={styles.subtitle}>
          Updating rates for {vehicleIds.length} vehicle{vehicleIds.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.placeholder}>
          This screen will allow hosts to update pricing for multiple vehicles
          simultaneously, including seasonal rates, discounts, and special offers.
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

export default BulkRateUpdateScreen;
