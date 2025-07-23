import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'icon' | 'text';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = React.memo(({
  showLabel = true,
  size = 'medium',
  variant = 'button',
}) => {
  const { mode, theme, colors, typography, spacing, toggleTheme } = useTheme();

  const iconSize = useMemo(() => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 28;
      default: return 24;
    }
  }, [size]);

  const themeIcon = useMemo(() => {
    switch (mode) {
      case 'light': return 'sunny-outline';
      case 'dark': return 'moon-outline';
      case 'auto': return 'phone-portrait-outline';
      default: return 'sunny-outline';
    }
  }, [mode]);

  const themeLabel = useMemo(() => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'auto': return 'Auto';
      default: return 'Light';
    }
  }, [mode]);

  const buttonStyle = useMemo(() => {
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
  }, [variant, spacing, colors]);

  const textStyle = useMemo(() => {
    return {
      ...typography.body,
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      color: colors.text,
      marginLeft: showLabel ? spacing.xs : 0,
    };
  }, [typography, size, colors, showLabel, spacing]);

  const accessibilityLabel = useMemo(() => 
    `Switch to next theme mode. Current: ${themeLabel}`,
    [themeLabel]
  );

  if (variant === 'text') {
    return (
      <TouchableOpacity
        onPress={toggleTheme}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.sm,
        }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Cycles between Light, Dark, and Auto theme modes"
        accessibilityRole="button"
      >
        <Ionicons
          name={themeIcon}
          size={iconSize}
          color={colors.primary}
        />
        {showLabel && (
          <Text style={textStyle}>
            {themeLabel} Theme
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={toggleTheme}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Cycles between Light, Dark, and Auto theme modes"
      accessibilityRole="button"
    >
      <Ionicons
        name={themeIcon}
        size={iconSize}
        color={variant === 'icon' ? colors.primary : colors.text}
      />
      {showLabel && variant !== 'icon' && (
        <Text style={textStyle}>
          {themeLabel}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  // Minimal styles since most are dynamic
});