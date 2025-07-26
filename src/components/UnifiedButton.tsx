/**
 * Unified Button Component
 * Consolidates Button.tsx, StandardButton.tsx, and GluestackButton.tsx
 * Provides a single, comprehensive button implementation with all features
 */

import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

export interface UnifiedButtonProps {
  // Core props
  title: string;
  onPress: () => void;
  
  // Styling variants
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  // State props
  disabled?: boolean;
  loading?: boolean;
  
  // Icon props
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  
  // Layout props
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Accessibility props
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'text';
  
  // Animation props
  enableAnimation?: boolean;
  hapticFeedback?: boolean;
}

export const UnifiedButton: React.FC<UnifiedButtonProps> = React.memo(({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  enableAnimation = true,
  hapticFeedback = true,
}) => {
  const { colors: themeColors, typography: themeTypography, spacing: themeSpacing } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Size configurations
  const sizeConfig = {
    xs: { height: 28, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, iconSize: 12 },
    sm: { height: 32, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, iconSize: 16 },
    md: { height: 44, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, iconSize: 20 },
    lg: { height: 52, paddingHorizontal: 20, paddingVertical: 14, fontSize: 18, iconSize: 24 },
    xl: { height: 60, paddingHorizontal: 24, paddingVertical: 18, fontSize: 20, iconSize: 28 },
  };

  const currentSize = sizeConfig[size];

  // Animation handlers
  const handlePressIn = useCallback(() => {
    if (enableAnimation && !disabled && !loading) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [enableAnimation, disabled, loading, scaleAnim, opacityAnim]);

  const handlePressOut = useCallback(() => {
    if (enableAnimation) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [enableAnimation, scaleAnim, opacityAnim]);

  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      if (hapticFeedback) {
        // Add haptic feedback if available
        try {
          const { HapticFeedback } = require('expo-haptics');
          HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light);
        } catch (error) {
          // Haptic feedback not available, continue without it
        }
      }
      onPress();
    }
  }, [disabled, loading, hapticFeedback, onPress]);

  // Style calculations
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: currentSize.height,
      paddingHorizontal: currentSize.paddingHorizontal,
      paddingVertical: currentSize.paddingVertical,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: fullWidth ? '100%' : undefined,
      width: fullWidth ? '100%' : undefined,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.gray300 : colors.primary,
          ...shadows.sm,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.gray100 : colors.secondary,
          ...shadows.sm,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? colors.gray300 : colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'link':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          paddingHorizontal: 0,
          paddingVertical: 0,
          height: 'auto',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: currentSize.fontSize,
      fontWeight: '600',
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseTextStyle,
          color: disabled ? colors.gray500 : colors.white,
        };
      case 'secondary':
        return {
          ...baseTextStyle,
          color: disabled ? colors.gray500 : colors.white,
        };
      case 'outline':
        return {
          ...baseTextStyle,
          color: disabled ? colors.gray400 : colors.primary,
        };
      case 'ghost':
        return {
          ...baseTextStyle,
          color: disabled ? colors.gray400 : colors.primary,
        };
      case 'link':
        return {
          ...baseTextStyle,
          color: disabled ? colors.gray400 : colors.primary,
          textDecorationLine: 'underline',
          fontWeight: '500',
        };
      default:
        return baseTextStyle;
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconColor = variant === 'primary' || variant === 'secondary' 
      ? (disabled ? colors.gray500 : colors.white)
      : (disabled ? colors.gray400 : colors.primary);

    return (
      <Ionicons
        name={icon}
        size={currentSize.iconSize}
        color={iconColor}
        style={iconPosition === 'left' ? { marginRight: 8 } : { marginLeft: 8 }}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      const spinnerColor = variant === 'primary' || variant === 'secondary'
        ? colors.white
        : colors.primary;
      
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={spinnerColor} />
          {title && (
            <Text style={[getTextStyle(), textStyle, { marginLeft: 8 }]}>
              {title}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && renderIcon()}
        <Text style={[getTextStyle(), textStyle]} numberOfLines={1}>
          {title}
        </Text>
        {icon && iconPosition === 'right' && renderIcon()}
      </View>
    );
  };

  const animatedStyle = enableAnimation ? {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  } : {};

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        style={[getButtonStyle()]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        testID={testID}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
        }}
      >
        {renderContent()}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Export as default for easy migration
export default UnifiedButton;
