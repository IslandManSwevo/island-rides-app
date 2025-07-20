import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';
import { SearchFilters } from '../types';

interface ConditionRatingFilterProps {
  minConditionRating: number;
  onUpdateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
}

const ConditionRatingFilter: React.FC<ConditionRatingFilterProps> = ({ minConditionRating, onUpdateFilter }) => {
  // Clamp minConditionRating to valid range (1-5)
  const validatedRating = Math.max(1, Math.min(5, minConditionRating));
  
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>
        Minimum Condition Rating: {validatedRating} star{validatedRating !== 1 ? 's' : ''}
      </Text>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map(rating => (
          <TouchableOpacity
            key={rating}
            style={styles.starButton}
            onPress={() => onUpdateFilter('minConditionRating', rating)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Set minimum condition rating to ${rating} star${rating !== 1 ? 's' : ''}`}
          >
            <Ionicons
              name={rating <= validatedRating ? 'star' : 'star-outline'}
              size={24}
              color={rating <= validatedRating ? colors.warning : colors.lightGrey}
              accessible={false}
            />
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
    color: colors.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  starButton: {
    padding: spacing.xs,
  },
});

export default ConditionRatingFilter;