import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import { SearchFilters } from '../types';

interface SeatingCapacityFilterProps {
  minSeatingCapacity: number;
  onUpdateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
}

const SeatingCapacityFilter: React.FC<SeatingCapacityFilterProps> = React.memo(({ minSeatingCapacity, onUpdateFilter }) => {
  const handleDecrease = useCallback(() => {
    onUpdateFilter('minSeatingCapacity', Math.max(1, minSeatingCapacity - 1));
  }, [minSeatingCapacity, onUpdateFilter]);

  const handleIncrease = useCallback(() => {
    onUpdateFilter('minSeatingCapacity', Math.min(8, minSeatingCapacity + 1));
  }, [minSeatingCapacity, onUpdateFilter]);

  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>
        Minimum Seating: {minSeatingCapacity} passenger{minSeatingCapacity !== 1 ? 's' : ''}
      </Text>
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={handleDecrease}
          accessibilityRole="button"
          accessibilityLabel="Decrease seating capacity"
        >
          <Ionicons name="remove" size={16} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.sliderTrack}>
          <View 
            style={[styles.sliderProgress, { width: `${(minSeatingCapacity - 1) * (100 / 7)}%` }]} 
          />
        </View>
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={handleIncrease}
          accessibilityRole="button"
          accessibilityLabel="Increase seating capacity"
        >
          <Ionicons name="add" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderButton: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.lightGrey,
    borderRadius: 4,
    marginHorizontal: spacing.md,
    justifyContent: 'center',
  },
  sliderProgress: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});

export default SeatingCapacityFilter;