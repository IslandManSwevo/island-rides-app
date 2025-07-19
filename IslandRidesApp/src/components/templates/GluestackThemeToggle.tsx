import React from 'react';
import {
  HStack,
  VStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface GluestackThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon' | 'text';
  layout?: 'horizontal' | 'vertical';
}

export const GluestackThemeToggle: React.FC<GluestackThemeToggleProps> = ({
  showLabel = true,
  size = 'md',
  variant = 'button',
  layout = 'horizontal',
}) => {
  const { mode, toggleTheme } = useTheme();

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'md': return 24;
      case 'lg': return 32;
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

  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: '$md',
      px: variant === 'icon' ? '$2' : '$4',
      py: '$2',
      minHeight: 44, // WCAG 2.2 minimum touch target
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    };

    switch (variant) {
      case 'button':
        return {
          ...baseStyles,
          bg: '$background100',
          borderWidth: 1,
          borderColor: '$outline',
          ':hover': {
            bg: '$background200',
          },
          ':active': {
            bg: '$background300',
            transform: [{ scale: 0.95 }],
          },
          _dark: {
            bg: '$surfaceVariantDark',
            borderColor: '$borderDark',
            ':hover': {
              bg: '$surfaceDark',
            },
          },
        };
      case 'icon':
        return {
          ...baseStyles,
          bg: 'transparent',
          ':hover': {
            bg: '$background100',
          },
          ':active': {
            transform: [{ scale: 0.9 }],
          },
          _dark: {
            ':hover': {
              bg: '$surfaceVariantDark',
            },
          },
        };
      case 'text':
        return {
          ...baseStyles,
          bg: 'transparent',
          px: '$0',
          ':active': {
            opacity: 0.7,
          },
        };
      default:
        return baseStyles;
    }
  };

  const renderContent = () => {
    const iconColor = variant === 'icon' ? '$primary500' : '$textLight900';
    const textColor = '$textLight900';
    const textSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

    if (layout === 'vertical') {
      return (
        <VStack space="xs" alignItems="center">
          <Ionicons
            name={getThemeIcon()}
            size={getIconSize()}
            color={iconColor}
          />
          {showLabel && variant !== 'icon' && (
            <Text 
              size={textSize} 
              color={textColor} 
              sx={{ _dark: { color: '$textDark' } }}
            >
              {getThemeLabel()}
            </Text>
          )}
        </VStack>
      );
    }

    return (
      <HStack space="sm" alignItems="center">
        <Ionicons
          name={getThemeIcon()}
          size={getIconSize()}
          color={iconColor}
        />
        {showLabel && variant !== 'icon' && (
          <Text 
            size={textSize} 
            color={textColor} 
            sx={{ _dark: { color: '$textDark' } }}
          >
            {variant === 'text' ? `${getThemeLabel()} Theme` : getThemeLabel()}
          </Text>
        )}
      </HStack>
    );
  };

  return (
    <Pressable
      sx={getButtonStyles()}
      onPress={toggleTheme}
      accessible={true}
      accessibilityLabel={`Switch to next theme mode. Current: ${getThemeLabel()}`}
      accessibilityHint="Cycles between Light, Dark, and Auto theme modes"
      accessibilityRole="button"
    >
      {renderContent()}
    </Pressable>
  );
};

// Enhanced theme toggle with more options
export const EnhancedThemeToggle = GluestackThemeToggle;