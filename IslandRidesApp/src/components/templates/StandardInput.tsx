import React, { useState } from 'react';
import { TextInput, Text, View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface StandardInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
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
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const StandardInput: React.FC<StandardInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
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
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getInputContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [
      {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        backgroundColor: colors.inputBackground,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }
    ];
    
    if (isFocused) {
      baseStyle.push({
        borderColor: colors.primary,
        backgroundColor: colors.surface,
      });
    }
    
    if (error) {
      baseStyle.push({
        borderColor: colors.error,
      });
    }
    
    if (disabled) {
      baseStyle.push({
        backgroundColor: colors.surfaceVariant,
        opacity: 0.6,
      });
    }
    
    return baseStyle;
  };

  const renderLabel = () => {
    if (!label) return null;
    
    return (
      <Text style={{
        ...typography.bodySmall,
        fontWeight: '600' as const,
        color: colors.text,
        marginBottom: spacing.xs,
      }}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
    );
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    
    return (
      <Ionicons
        name={leftIcon}
        size={20}
        color={error ? colors.error : isFocused ? colors.primary : colors.textSecondary}
        style={{ marginRight: spacing.xs }}
      />
    );
  };

  const renderRightIcon = () => {
    if (!rightIcon) return null;
    
    return (
      <TouchableOpacity
        onPress={onRightIconPress}
        disabled={!onRightIconPress}
        style={{ padding: spacing.xs }}
      >
        <Ionicons
          name={rightIcon}
          size={20}
          color={error ? colors.error : isFocused ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  const renderError = () => {
    if (!error) return null;
    
    return (
      <View style={{
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        flex: 1,
      }}>
        <Ionicons name="alert-circle" size={16} color={colors.error} />
        <Text style={{
          ...typography.caption,
          color: colors.error,
          marginLeft: spacing.xs,
        }}>
          {error}
        </Text>
      </View>
    );
  };

  const renderCharacterCount = () => {
    if (!maxLength) return null;
    
    return (
      <Text style={{
        ...typography.caption,
        color: colors.textSecondary,
      }}>
        {value.length}/{maxLength}
      </Text>
    );
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      {renderLabel()}
      
      <View style={getInputContainerStyle()}>
        {renderLeftIcon()}
        
        <TextInput
          style={{
            flex: 1,
            ...typography.body,
            color: colors.text,
            padding: 0,
            ...(multiline && {
              minHeight: 80,
              textAlignVertical: 'top' as const,
            }),
            ...(leftIcon && { marginLeft: spacing.sm }),
            ...(rightIcon && { marginRight: spacing.sm }),
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          testID={testID}
          accessible={true}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
        />
        
        {renderRightIcon()}
      </View>
      
      <View style={{
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginTop: spacing.xs,
      }}>
        {renderError()}
        {renderCharacterCount()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Minimal styles since most are dynamic
});