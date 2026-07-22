import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

type ButtonVariant = 'primary' | 'ink' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const container: Record<ButtonVariant, string> = {
  // Coral is the one loud element on a screen — one primary button per view.
  primary: 'bg-coral active:bg-coral-pressed',
  ink: 'bg-ink active:bg-ink-soft dark:bg-night-text',
  ghost: 'bg-transparent border border-sand active:bg-sand-soft dark:border-night-line dark:active:bg-night-raised',
};

const labelStyle: Record<ButtonVariant, string> = {
  primary: 'text-white',
  ink: 'text-paper dark:text-night',
  ghost: 'text-ink dark:text-night-text',
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  className = '',
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled: disabled || loading }}
    disabled={disabled || loading}
    onPress={onPress}
    className={`flex-row items-center justify-center gap-2 rounded-btn p-4 ${container[variant]} ${
      disabled ? 'opacity-50' : ''
    } ${className}`}
  >
    {loading ? (
      <ActivityIndicator size="small" color={variant === 'primary' ? '#FFFFFF' : '#FF5A3C'} />
    ) : (
      icon
    )}
    <Text className={`font-ui-semibold text-emphasis ${labelStyle[variant]}`}>{label}</Text>
  </Pressable>
);
