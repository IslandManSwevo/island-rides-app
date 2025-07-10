import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

interface PhotoIndicatorsProps {
  count: number;
  currentIndex: number;
  onPress: (index: number) => void;
}

export const PhotoIndicators: React.FC<PhotoIndicatorsProps> = ({ count, currentIndex, onPress }) => {
  return (
    <View style={styles.indicatorContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.indicator,
            index === currentIndex && styles.activeIndicator,
          ]}
          onPress={() => onPress(index)}
          accessibilityLabel={`Photo indicator ${index + 1}`}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  indicatorContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D3D3D3',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
  },
});