import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../styles/theme';

interface SearchScreenProps {
  navigation: any;
  route: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ route }) => {
  const { island } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 Vehicle Search</Text>
      <Text style={styles.subtitle}>
        {island ? `Searching vehicles in ${island}` : 'Search for vehicles'}
      </Text>
      <Text style={styles.placeholder}>
        Vehicle search functionality will be implemented in future updates.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.subheading,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  placeholder: {
    ...typography.body,
    textAlign: 'center',
  },
});
