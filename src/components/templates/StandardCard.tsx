import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface StandardCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const StandardCard: React.FC<StandardCardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  variant = 'default',
  padding = 'medium',
  margin = 'medium',
  disabled = false,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [
      {
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
      }
    ];
    
    // Dynamic theme-aware variant styles
    switch (variant) {
      case 'default':
        baseStyle.push({
          borderWidth: 1,
          borderColor: colors.border,
        });
        break;
      case 'elevated':
        baseStyle.push({
          ...shadows.medium,
          backgroundColor: colors.surface,
        });
        break;
      case 'outlined':
        baseStyle.push({
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.surface,
        });
        break;
      case 'filled':
        baseStyle.push({
          backgroundColor: colors.surfaceVariant,
        });
        break;
    }
    
    // Padding styles
    if (padding !== 'none') {
      const paddingValue = padding === 'small' ? spacing.sm : padding === 'large' ? spacing.lg : spacing.md;
      baseStyle.push({ padding: paddingValue });
    }
    
    // Margin styles
    if (margin !== 'none') {
      const marginValue = margin === 'small' ? spacing.sm : margin === 'large' ? spacing.lg : spacing.md;
      baseStyle.push({ margin: marginValue });
    }
    
    // Disabled state
    if (disabled) {
      baseStyle.push({ opacity: 0.5 });
    }
    
    return baseStyle;
  };

  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <View style={{ marginBottom: spacing.sm }}>
        {title && (
          <Text style={{
            ...typography.heading4,
            color: colors.text,
            marginBottom: spacing.xs,
          }}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={{
            ...typography.bodySmall,
            color: colors.textSecondary,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  };

  const CardContent = () => (
    <View style={getCardStyle()}>
      {renderHeader()}
      <View>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={disabled ? { opacity: 0.5 } : undefined}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View
      testID={testID}
      accessible={accessibilityLabel ? true : false}
      accessibilityLabel={accessibilityLabel}
    >
      <CardContent />
    </View>
  );
};

const styles = StyleSheet.create({
  // Minimal styles since most are dynamic
});