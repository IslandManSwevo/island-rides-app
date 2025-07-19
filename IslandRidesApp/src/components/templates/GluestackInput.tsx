import React from 'react';
import {
  Input,
  InputField,
  InputSlot,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  HStack,
  Text,
} from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

interface GluestackInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'outline' | 'underlined' | 'rounded';
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const GluestackInput: React.FC<GluestackInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  disabled = false,
  required = false,
  multiline = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  leftIcon,
  rightIcon,
  onRightIconPress,
  size = 'md',
  variant = 'outline',
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getIconSize = (): number => {
    switch (size) {
      case 'sm': return 16;
      case 'md': return 20;
      case 'lg': return 24;
      case 'xl': return 28;
      default: return 20;
    }
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    
    return (
      <InputSlot pl="$3">
        <Ionicons
          name={leftIcon}
          size={getIconSize()}
          color={error ? '#ef4444' : '#6b7280'}
        />
      </InputSlot>
    );
  };

  const renderRightIcon = () => {
    if (!rightIcon) return null;
    
    if (onRightIconPress) {
      return (
        <InputSlot pr="$3" onPress={onRightIconPress}>
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons
              name={rightIcon}
              size={getIconSize()}
              color={error ? '#ef4444' : '#6b7280'}
            />
          </TouchableOpacity>
        </InputSlot>
      );
    }

    return (
      <InputSlot pr="$3">
        <Ionicons
          name={rightIcon}
          size={getIconSize()}
          color={error ? '#ef4444' : '#6b7280'}
        />
      </InputSlot>
    );
  };

  const renderCharacterCount = () => {
    if (!maxLength) return null;
    
    return (
      <Text size="xs" color="$textLight500" alignSelf="flex-end" mt="$1">
        {value.length}/{maxLength}
      </Text>
    );
  };

  return (
    <FormControl
      size={size === 'xl' ? 'lg' : size}
      isDisabled={disabled}
      isInvalid={!!error}
      isRequired={required}
      mb="$4"
    >
      {label && (
        <FormControlLabel mb="$1">
          <FormControlLabelText>
            {label}
            {required && <Text color="$error500"> *</Text>}
          </FormControlLabelText>
        </FormControlLabel>
      )}

      <Input
        variant={variant}
        size={size}
        isInvalid={!!error}
        isDisabled={disabled}
        sx={{
          // WCAG 2.2 minimum touch target
          minHeight: 44,
          // Enhanced focus states
          ':focus': {
            borderColor: '$primary500',
            shadowColor: '$primary500',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          // Dark mode support
          _dark: {
            borderColor: '$borderDark',
            bg: '$surfaceVariantDark',
            ':focus': {
              borderColor: '$primary400',
              bg: '$surfaceDark',
            },
          },
        }}
      >
        {renderLeftIcon()}
        
        <InputField
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          multiline={multiline}
          testID={testID}
          accessible={true}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          // Optimized for multiline
          sx={multiline ? {
            minHeight: 80,
            textAlignVertical: 'top',
          } : {}}
        />
        
        {renderRightIcon()}
      </Input>

      {/* Helper text or error message */}
      {error ? (
        <FormControlError>
          <FormControlErrorIcon>
            <Ionicons name="alert-circle" size={16} color="currentColor" />
          </FormControlErrorIcon>
          <FormControlErrorText>{error}</FormControlErrorText>
        </FormControlError>
      ) : helperText ? (
        <FormControlHelper>
          <FormControlHelperText>{helperText}</FormControlHelperText>
        </FormControlHelper>
      ) : null}

      {/* Character count */}
      <HStack justifyContent="space-between" alignItems="center">
        <Text />
        {renderCharacterCount()}
      </HStack>
    </FormControl>
  );
};

// Compatibility wrapper to maintain existing API
export const EnhancedStandardInput = GluestackInput;