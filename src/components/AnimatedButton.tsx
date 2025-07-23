import React, { useCallback } from 'react';
import { TouchableOpacity, ViewStyle, TextStyle, StyleProp, Animated } from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { hapticService, HapticType } from '../services/hapticService';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  disabled?: boolean;
  hapticType?: HapticType;
  scaleIntensity?: number;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onPress,
  style,
  disabled = false,
  hapticType = 'light',
  scaleIntensity = 0.95,
  ...props
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(async () => {
    if (disabled) return;
    
    scale.value = withSpring(scaleIntensity, { damping: 15 });
    opacity.value = withSpring(0.8, { damping: 15 });
    
    // Trigger haptic feedback using the service
    if (hapticType) {
      await hapticService.trigger(hapticType);
    }
  }, [disabled, hapticType, scaleIntensity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.05, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    opacity.value = withSpring(1, { damping: 15 });
  }, []);

  const handlePress = useCallback(() => {
    if (disabled || !onPress) return;
    onPress();
  }, [disabled, onPress]);

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1} // We handle opacity ourselves
      {...props}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};