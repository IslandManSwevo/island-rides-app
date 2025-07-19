import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Animated, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface StandardButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const StandardButton: React.FC<StandardButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getButtonStyle = () => {
    const baseStyle: ViewStyle[] = [
      styles.button,
      {
        borderRadius: borderRadius.md,
        minHeight: size === 'small' ? 32 : size === 'large' ? 52 : 44,
        paddingHorizontal: size === 'small' ? spacing.sm : size === 'large' ? spacing.lg : spacing.md,
        paddingVertical: size === 'small' ? spacing.xs : size === 'large' ? spacing.md : spacing.sm,
      }
    ];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }
    
    // Dynamic theme-aware variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push({
          backgroundColor: colors.primary,
          ...shadows.small,
        });
        break;
      case 'secondary':
        baseStyle.push({
          backgroundColor: colors.secondary,
          ...shadows.small,
        });
        break;
      case 'outline':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        });
        break;
      case 'ghost':
        baseStyle.push({
          backgroundColor: 'transparent',
        });
        break;
    }
    
    // Add custom style if provided
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...typography.button,
      textAlign: 'center' as const,
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
    };
    
    // Dynamic theme-aware text colors
    switch (variant) {
      case 'primary':
      case 'secondary':
        baseStyle.color = colors.white;
        break;
      case 'outline':
      case 'ghost':
        baseStyle.color = colors.primary;
        break;
    }
    
    if (disabled || loading) {
      baseStyle.color = colors.textDisabled;
    }
    
    return baseStyle;
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <Ionicons
        name={icon}
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
        color={getIconColor()}
        style={iconPosition === 'left' ? { marginRight: spacing.xs } : { marginLeft: spacing.xs }}
      />
    );
  };

  const getIconColor = () => {
    if (disabled || loading) return colors.textDisabled;
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.white;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.white;
    }
  };

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        testID={testID}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={getIconColor()}
              style={{ marginRight: spacing.xs }}
            />
          ) : (
            <>
              {iconPosition === 'left' && renderIcon()}
              <Text style={getTextStyle()}>{title}</Text>
              {iconPosition === 'right' && renderIcon()}
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});