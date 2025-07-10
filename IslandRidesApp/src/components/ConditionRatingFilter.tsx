import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/theme';

interface ConditionRatingFilterProps {
  minConditionRating: number;
  onUpdateFilter: (key: string, value: any) => void;
}

const ConditionRatingFilter: React.FC<ConditionRatingFilterProps> = ({ minConditionRating, onUpdateFilter }) => {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>
        Minimum Condition Rating: {minConditionRating} star{minConditionRating !== 1 ? 's' : ''}
      </Text>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map(rating => (
          <TouchableOpacity
            key={rating}
            style={styles.starButton}
            onPress={() => onUpdateFilter('minConditionRating', rating)}
          >
            <Ionicons
              name={rating <= minConditionRating ? 'star' : 'star-outline'}
              size={24}
              color={rating <= minConditionRating ? '#F59E0B' : colors.lightGrey}
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
    color: colors.dark,
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