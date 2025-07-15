import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../styles/Theme';

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
        {options.map(option => {
          const isSelected = selectedOptions.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionChip,
                isSelected && styles.optionChipSelected
              ]}
              onPress={() => onToggleOption(option)}
              accessibilityLabel={`${option}, ${isSelected ? 'selected' : 'not selected'}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[
                styles.optionChipText,
                isSelected && styles.optionChipTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
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