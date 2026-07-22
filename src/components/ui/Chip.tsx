import React from 'react';
import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * The "island pill": fully rounded, hairline border, and an active state that
 * inverts to ink (not coral — color stays reserved for actions and prices).
 */
export const Chip: React.FC<ChipProps> = ({ label, active = false, onPress, icon, className = '' }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    onPress={onPress}
    className={`flex-row items-center gap-1.5 rounded-pill border px-chip-x py-chip-y ${
      active
        ? 'border-ink bg-ink dark:border-coral-night dark:bg-coral-night'
        : 'border-sand bg-white dark:border-night-line dark:bg-night-raised'
    } ${className}`}
  >
    {icon}
    <Text
      className={`font-ui-semibold text-meta ${
        active ? 'text-paper dark:text-night' : 'text-ink dark:text-night-text'
      }`}
    >
      {label}
    </Text>
  </Pressable>
);
