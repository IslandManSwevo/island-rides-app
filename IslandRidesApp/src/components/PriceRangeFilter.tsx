import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';

interface PriceRangeFilterProps {
  priceRange: [number, number];
  onUpdateFilter: (key: string, value: [number, number]) => void;
  step?: number;
  minValue?: number;
  maxValue?: number;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({ 
  priceRange, 
  onUpdateFilter, 
  step = 25, 
  minValue = 25, 
  maxValue = 500 
}) => {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>
        Price Range: ${priceRange[0]} - ${priceRange[1]}/day
      </Text>
      <View style={styles.priceRangeContainer}>
        <Text style={styles.priceLabel}>${priceRange[0]}</Text>
        <View style={styles.priceSliderContainer}>
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => {
              const newMin = Math.max(Math.min(priceRange[0] + step, priceRange[1]), minValue);
              onUpdateFilter('priceRange', [newMin, priceRange[1]]);
            }}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.priceBar} />
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => {
              const newMax = Math.min(Math.max(priceRange[1] - step, priceRange[0]), maxValue);
              onUpdateFilter('priceRange', [priceRange[0], newMax]);
            }}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.priceLabel}>${priceRange[1]}</Text>
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
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  priceButton: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
  priceBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.lightGrey,
    marginHorizontal: spacing.sm,
    borderRadius: 2,
  },
  priceLabel: {
    fontSize: 16,
    color: colors.darkGrey,
  },
});

export default PriceRangeFilter;