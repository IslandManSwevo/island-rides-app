import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import { VERIFICATION_STATUS_OPTIONS, VerificationStatusOption } from '../constants/filters';

interface VerificationStatusFilterProps<K extends string = string> {
  verificationStatus: string[];
  onToggleFilter: (key: K, value: string) => void;
  filterKey: K;
}

const VerificationStatusFilter = <K extends string = 'verificationStatus'>({ verificationStatus, onToggleFilter, filterKey }: VerificationStatusFilterProps<K>) => {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Verification Status</Text>
      <View style={styles.optionsGrid}>
        {VERIFICATION_STATUS_OPTIONS.map((option: VerificationStatusOption) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.verificationChip,
              verificationStatus.includes(option.key) && styles.verificationChipSelected
            ]}
            onPress={() => onToggleFilter(filterKey, option.key)}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} verification status filter`}
            accessibilityState={{ selected: verificationStatus.includes(option.key) }}
          >
            <Ionicons 
              name={option.icon} 
              size={16} 
              color={verificationStatus.includes(option.key) ? colors.white : colors.primary} 
            />
            <Text style={[
              styles.verificationChipText,
              verificationStatus.includes(option.key) && styles.verificationChipTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  verificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  verificationChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  verificationChipText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.darkGrey,
  },
  verificationChipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default VerificationStatusFilter;