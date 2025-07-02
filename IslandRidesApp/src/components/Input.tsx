import React from 'react';
import { TextInput, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  iconName?: 'mail' | 'lock' | 'user';
  multiline?: boolean;
  numberOfLines?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  autoCapitalize = 'none',
  keyboardType = 'default',
  iconName,
  multiline = false,
  numberOfLines = 1,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {iconName && (
          <Feather 
            name={iconName} 
            size={20} 
            color={colors.iconGrey} 
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input, 
            error && styles.inputError,
            iconName && styles.inputWithIcon,
            multiline && styles.multilineInput
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          placeholderTextColor={colors.lightGrey}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGrey,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    backgroundColor: colors.white,
    color: colors.darkGrey,
  },
  inputWithIcon: {
    paddingLeft: 45,
  },
  inputError: {
    borderColor: colors.error,
  },
  multilineInput: {
    height: 80,
    paddingTop: spacing.md,
  },
  icon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
