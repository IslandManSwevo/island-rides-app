import React, { useEffect } from 'react';
import { View, ViewStyle, DimensionValue, Animated } from 'react-native';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate,
  Easing
} from 'react-native-reanimated';
import { colors, borderRadius } from '../../styles/theme';

interface SkeletonBaseProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  animationDuration?: number;
}

export const SkeletonBase: React.FC<SkeletonBaseProps> = ({
  width = '100%',
  height = 20,
  borderRadius: skeletonBorderRadius = borderRadius.sm,
  style,
  animationDuration = 1500,
}) => {
  const shimmerTranslateX = useSharedValue(-100);

  useEffect(() => {
    shimmerTranslateX.value = withRepeat(
      withTiming(100, {
        duration: animationDuration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [animationDuration]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerTranslateX.value,
      [-100, 100],
      [-100, 100]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: colors.offWhite,
          borderRadius: skeletonBorderRadius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.white,
            opacity: 0.6,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};