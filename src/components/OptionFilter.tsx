import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../styles/theme';
import { GluestackButton } from './templates/GluestackButton';

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
            <GluestackButton
              key={option}
              title={option}
              onPress={() => onToggleOption(option)}
              variant={isSelected ? "solid" : "outline"}
              action="primary"
              size="sm"
              accessibilityLabel={`${option}, ${isSelected ? 'selected' : 'not selected'}`}
              accessibilityHint={`Toggle ${option} filter option`}
            />
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
    color: colors.text,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceVariant,
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
    color: colors.text,
  },
  optionChipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default OptionFilter;