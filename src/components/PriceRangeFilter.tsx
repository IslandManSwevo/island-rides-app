import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import { GluestackButton } from './templates/GluestackButton';

interface PriceRangeFilterProps {
  /** The current price range as a tuple of [minimum, maximum] values */
  priceRange: [number, number];
  /** Callback function to update filter values with the specified key and new price range tuple */
  onUpdateFilter: <K extends keyof any>(key: K, value: any) => void;
  /** The increment/decrement step value for price adjustments (default: 25) */
  step?: number;
  /** The minimum allowed price value (default: 25) */
  minValue?: number;
  /** The maximum allowed price value (default: 500) */
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
          <GluestackButton
            title=""
            onPress={() => {
              const newMin = Math.max(priceRange[0] - step, minValue);
              onUpdateFilter('priceRange', [newMin, priceRange[1]]);
            }}
            variant="outline"
            action="primary"
            icon="remove"
            size="sm"
            accessibilityLabel="Decrease minimum price"
            accessibilityHint={`Decrease minimum price by $${step}`}
          />
          <View style={styles.priceBar} />
          <GluestackButton
            title=""
            onPress={() => {
              const newMax = Math.min(priceRange[1] + step, maxValue);
              onUpdateFilter('priceRange', [priceRange[0], newMax]);
            }}
            variant="outline"
            action="primary"
            icon="add"
            size="sm"
            accessibilityLabel="Increase maximum price"
            accessibilityHint={`Increase maximum price by $${step}`}
          />
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