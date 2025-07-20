import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';

interface GluestackCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  variant?: 'elevated' | 'outline' | 'ghost' | 'filled';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const GluestackCard: React.FC<GluestackCardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  variant = 'elevated',
  size = 'md',
  padding = 'md',
  margin = 'md',
  disabled = false,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getPaddingValue = () => {
    switch (padding) {
      case 'none': return '$0';
      case 'sm': return '$2';
      case 'md': return '$4';
      case 'lg': return '$6';
      case 'xl': return '$8';
      default: return '$4';
    }
  };

  const getMarginValue = () => {
    switch (margin) {
      case 'none': return '$0';
      case 'sm': return '$2';
      case 'md': return '$4';
      case 'lg': return '$6';
      case 'xl': return '$8';
      default: return '$4';
    }
  };

  const getVariantStyles = () => {
    const baseStyles = {
      borderRadius: '$lg',
      bg: '$surface',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          shadowColor: '$shadow',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          _dark: {
            bg: '$surfaceDark',
            shadowColor: '$black',
          },
        };
      case 'outline':
        return {
          ...baseStyles,
          borderWidth: 1,
          borderColor: '$outline',
          _dark: {
            bg: '$surfaceDark',
            borderColor: '$borderDark',
          },
        };
      case 'filled':
        return {
          ...baseStyles,
          bg: '$background100',
          _dark: {
            bg: '$surfaceVariantDark',
          },
        };
      case 'ghost':
        return {
          ...baseStyles,
          bg: 'transparent',
        };
      default:
        return baseStyles;
    }
  };

  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <VStack space="xs" mb="$3">
        {title && (
          <Text
            size="lg"
            fontWeight="$semibold"
            color="$textLight900"
            sx={{
              _dark: { color: '$textDark' }
            }}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            size="sm"
            color="$textLight600"
            sx={{
              _dark: { color: '$textSecondaryDark' }
            }}
          >
            {subtitle}
          </Text>
        )}
      </VStack>
    );
  };

  const cardContent = (
    <Box
      sx={{
        ...getVariantStyles(),
        opacity: disabled ? 0.5 : 1,
      }}
      p={getPaddingValue()}
      m={getMarginValue()}
      testID={testID}
    >
      <VStack space="sm">
        {renderHeader()}
        <Box>
          {children}
        </Box>
      </VStack>
    </Box>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        // WCAG 2.2 minimum touch target
        sx={{
          minHeight: 44,
          minWidth: 44,
        }}
      >
        {cardContent}
      </Pressable>
    );
  }

  return (
    <Box
      accessible={accessibilityLabel ? true : false}
      accessibilityLabel={accessibilityLabel}
    >
      {cardContent}
    </Box>
  );
};

// Compatibility wrapper to maintain existing API
export const EnhancedStandardCard = GluestackCard;