import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { colors } from '../../styles/theme';

interface Props {
  rating: number;
  onUpdateRating: (rating: number) => void;
}

export const ConditionRatingSection: React.FC<Props> = ({ rating, onUpdateRating }) => {
  const getRatingText = () => {
    if (rating >= 5) return 'Excellent';
    if (rating >= 4) return 'Very Good';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Fair';
    return 'Poor';
  };

  return (
    <View style={styles.ratingContainer}>
      <Text style={styles.sectionTitle}>Condition Rating</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => onUpdateRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={28}
              color={star <= rating ? colors.star : colors.lightGrey}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingText}>
        {rating}/5 - {getRatingText()}
      </Text>
    </View>
  );
};