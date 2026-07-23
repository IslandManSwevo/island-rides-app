import React from 'react';
import { Text, View } from 'react-native';

interface StarsProps {
  rating: number; // 0–5
  size?: number;
  className?: string;
}

/** Goombay-gold star rating (design/01 — gold is reserved for ratings). */
export const Stars: React.FC<StarsProps> = ({ rating, size = 14, className = '' }) => {
  const full = Math.round(rating);
  return (
    <View className={`flex-row ${className}`} accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: size, color: i <= full ? '#E8B44C' : '#E8E0D4', letterSpacing: 1 }}>
          ★
        </Text>
      ))}
    </View>
  );
};
