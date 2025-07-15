import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Theme from '../styles/Theme';

interface ShimmerLoadingProps {
  width?: number;
  height?: number;
  style?: any;
  borderRadius?: number;
}

const ShimmerLoading: React.FC<ShimmerLoadingProps> = ({
  width = 100,
  height = 20,
  style,
  borderRadius = Theme.borderRadius.sm,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surfaceVariant,
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default ShimmerLoading;
