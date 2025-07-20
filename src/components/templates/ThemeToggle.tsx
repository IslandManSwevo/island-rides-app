import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'icon' | 'text';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = true,
  size = 'medium',
  variant = 'button',
}) => {
  const { mode, theme, colors, typography, spacing, toggleTheme } = useTheme();

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 28;
      default: return 24;
    }
  };

  const getThemeIcon = () => {
    switch (mode) {
      case 'light': return 'sunny-outline';
      case 'dark': return 'moon-outline';
      case 'auto': return 'phone-portrait-outline';
      default: return 'sunny-outline';
    }
  };

  const getThemeLabel = () => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'auto': return 'Auto';
      default: return 'Light';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 8,
      paddingHorizontal: variant === 'icon' ? spacing.sm : spacing.md,
      paddingVertical: spacing.sm,
    };

    if (variant === 'button') {
      return {
        ...baseStyle,
        backgroundColor: colors.surfaceVariant,
        borderWidth: 1,
        borderColor: colors.border,
      };
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    return {
      ...typography.body,
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      color: colors.text,
      marginLeft: showLabel ? spacing.xs : 0,
    };
  };

  if (variant === 'text') {
    return (
      <TouchableOpacity
        onPress={toggleTheme}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.sm,
        }}
        accessibilityLabel={`Switch to next theme mode. Current: ${getThemeLabel()}`}
        accessibilityHint="Cycles between Light, Dark, and Auto theme modes"
        accessibilityRole="button"
      >
        <Ionicons
          name={getThemeIcon()}
          size={getIconSize()}
          color={colors.primary}
        />
        {showLabel && (
          <Text style={getTextStyle()}>
            {getThemeLabel()} Theme
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={toggleTheme}
      accessibilityLabel={`Switch to next theme mode. Current: ${getThemeLabel()}`}
      accessibilityHint="Cycles between Light, Dark, and Auto theme modes"
      accessibilityRole="button"
    >
      <Ionicons
        name={getThemeIcon()}
        size={getIconSize()}
        color={variant === 'icon' ? colors.primary : colors.text}
      />
      {showLabel && variant !== 'icon' && (
        <Text style={getTextStyle()}>
          {getThemeLabel()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Minimal styles since most are dynamic
});