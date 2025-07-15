import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../styles/Theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'text';
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        (disabled || loading) && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} />
      ) : (
        <Text style={[
          styles.buttonText,
          variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Wrap with React.memo for performance optimization
export default React.memo(Button);

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
});
