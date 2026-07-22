import React from 'react';
import { Text } from 'react-native';

interface SectionLabelProps {
  children: string;
  className?: string;
}

/** 11px uppercase stone overline — the section header used across every mockup. */
export const SectionLabel: React.FC<SectionLabelProps> = ({ children, className = '' }) => (
  <Text className={`font-ui-bold text-overline uppercase text-stone dark:text-night-muted ${className}`}>
    {children}
  </Text>
);
