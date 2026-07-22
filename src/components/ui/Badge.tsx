import React from 'react';
import { View, Text } from 'react-native';

type BadgeTone = 'teal' | 'gold' | 'coral' | 'success' | 'danger';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

const toneStyles: Record<BadgeTone, { box: string; text: string }> = {
  teal: { box: 'bg-teal-tint', text: 'text-teal dark:text-teal-night' },
  gold: { box: 'bg-gold-tint', text: 'text-gold-deep dark:text-gold-night' },
  coral: { box: 'bg-coral-tint', text: 'text-coral-pressed dark:text-coral-night' },
  success: { box: 'bg-success-tint', text: 'text-success' },
  danger: { box: 'bg-danger-tint', text: 'text-danger' },
};

/** Small status marker: ✓ Verified (teal), ★ All-Star (gold), countdowns (coral). */
export const Badge: React.FC<BadgeProps> = ({ label, tone = 'teal', className = '' }) => {
  const s = toneStyles[tone];
  return (
    <View className={`self-start rounded-field px-2 py-1 ${s.box} dark:bg-night-raised ${className}`}>
      <Text className={`font-ui-bold text-overline normal-case tracking-normal ${s.text}`}>{label}</Text>
    </View>
  );
};
