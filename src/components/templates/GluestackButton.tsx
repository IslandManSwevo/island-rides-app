import React from 'react';
import {
  Button,
  ButtonText,
  ButtonSpinner,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';

interface GluestackButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  action?: 'primary' | 'secondary' | 'positive' | 'negative';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const GluestackButton: React.FC<GluestackButtonProps> = ({
  title,
  onPress,
  variant = 'solid',
  size = 'md',
  action = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getIconSize = (): number => {
    switch (size) {
      case 'xs': return 12;
      case 'sm': return 16;
      case 'md': return 20;
      case 'lg': return 24;
      case 'xl': return 28;
      default: return 20;
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <Ionicons
        name={icon}
        size={getIconSize()}
        color="currentColor"
        style={{
          marginRight: iconPosition === 'left' ? 8 : 0,
          marginLeft: iconPosition === 'right' ? 8 : 0,
        }}
      />
    );
  };

  return (
    <Button
      variant={variant}
      size={size}
      action={action}
      isDisabled={disabled}
      onPress={onPress}
      width={fullWidth ? '100%' : undefined}
      testID={testID}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      // Enhanced animation and interaction
      sx={{
        ':active': {
          transform: [{ scale: 0.95 }],
        },
        ':hover': {
          transform: [{ scale: 1.02 }],
        },
        // WCAG 2.2 minimum touch target
        minHeight: 44,
        minWidth: 44,
      }}
    >
      {loading ? (
        <ButtonSpinner mr="$1" />
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          <ButtonText>{title}</ButtonText>
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </Button>
  );
};

// Compatibility wrapper to maintain existing API
export const EnhancedStandardButton = GluestackButton;