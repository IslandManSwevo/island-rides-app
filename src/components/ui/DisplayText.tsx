import React from 'react';
import { Text, TextProps } from 'react-native';

type DisplaySize = 'hero' | 'headline' | 'title';

interface DisplayTextProps extends TextProps {
  size?: DisplaySize;
  className?: string;
}

const sizeClass: Record<DisplaySize, string> = {
  hero: 'text-hero',
  headline: 'text-headline',
  title: 'text-title',
};

/**
 * Fraunces display text — greetings, screen titles, vehicle names, prices.
 * Everything else in the app is Inter; if a string isn't one of those four
 * things, it doesn't get the serif.
 */
export const DisplayText: React.FC<DisplayTextProps> = ({
  size = 'title',
  className = '',
  children,
  ...rest
}) => (
  <Text className={`font-display ${sizeClass[size]} text-ink dark:text-night-text ${className}`} {...rest}>
    {children}
  </Text>
);
