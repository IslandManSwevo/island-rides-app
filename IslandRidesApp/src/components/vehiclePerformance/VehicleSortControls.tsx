import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../styles/Theme';

interface SortOption {
  label: string;
  value: string;
}

interface VehicleSortControlsProps {
  sortOptions: SortOption[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (value: string) => void;
  onOrderChange: () => void;
}

export const VehicleSortControls: React.FC<VehicleSortControlsProps> = ({ 
  sortOptions,
  sortBy,
  sortOrder,
  onSortChange,
  onOrderChange
}) => (
  <View style={styles.sortControls}>
    <Text style={styles.sortLabel}>Sort by:</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {sortOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.sortOption,
            sortBy === option.value && styles.sortOptionActive
          ]}
          onPress={() => {
            if (sortBy === option.value) {
              onOrderChange();
            } else {
              onSortChange(option.value);
            }
          }}
        >
          <Text style={[
            styles.sortOptionText,
            sortBy === option.value && styles.sortOptionTextActive
          ]}>
            {option.label}
          </Text>
          {sortBy === option.value && (
            <Ionicons 
              name={sortOrder === 'desc' ? 'chevron-down' : 'chevron-up'} 
              size={16} 
              color={colors.white} 
            />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  sortControls: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  sortLabel: {
    ...typography.body,
    color: colors.darkGrey,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    ...typography.body,
    color: colors.darkGrey,
    marginRight: spacing.xs,
  },
  sortOptionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});