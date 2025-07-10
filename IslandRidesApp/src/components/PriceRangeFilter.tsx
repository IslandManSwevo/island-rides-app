import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';

interface PriceRangeFilterProps {
  priceRange: [number, number];
  onUpdateFilter: (key: string, value: any) => void;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({ priceRange, onUpdateFilter }) => {
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
            onPress={() => onUpdateFilter('priceRange', [Math.max(25, priceRange[0] - 25), priceRange[1]])}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.priceBar} />
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => onUpdateFilter('priceRange', [priceRange[0], Math.min(500, priceRange[1] + 25)])}
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
    color: colors.dark,
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
    backgroundColor: colors.light,
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
    color: colors.grey,
  },
});

export default PriceRangeFilter;