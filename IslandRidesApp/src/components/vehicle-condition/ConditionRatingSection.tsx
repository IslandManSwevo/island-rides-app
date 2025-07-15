import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { colors } from '../../styles/Theme';

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
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Condition Rating</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => onUpdateRating(star)}
            style={{ padding: 5 }}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={28}
              color={star <= rating ? colors.star : colors.lightGrey}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ textAlign: 'center', fontSize: 16, marginTop: 8 }}>
        {rating}/5 - {getRatingText()}
      </Text>
    </View>
  );
};