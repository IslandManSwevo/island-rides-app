import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../styles/theme';

interface OptionFilterProps {
  title: string;
  options: readonly string[];
  selectedOptions: string[];
  onToggleOption: (option: string) => void;
}

const OptionFilter: React.FC<OptionFilterProps> = ({ title, options, selectedOptions, onToggleOption }) => {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionChip,
              selectedOptions.includes(option) && styles.optionChipSelected
            ]}
            onPress={() => onToggleOption(option)}
          >
            <Text style={[
              styles.optionChipText,
              selectedOptions.includes(option) && styles.optionChipTextSelected
            ]}>
              {option}
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
    color: colors.dark,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.light,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: colors.dark,
  },
  optionChipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default OptionFilter;