import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  /** hero = 20px radius + floating shadow, for featured/lead cards only */
  hero?: boolean;
  className?: string;
}

/**
 * Brand rule: cards are defined by a hairline Sand border on a white surface,
 * not by shadow. Only hero cards float.
 */
export const Card: React.FC<CardProps> = ({ hero = false, className = '', children, ...rest }) => (
  <View
    className={`border border-sand bg-white dark:border-night-line dark:bg-night-raised ${
      hero ? 'rounded-hero shadow-float' : 'rounded-card shadow-rest'
    } ${className}`}
    {...rest}
  >
    {children}
  </View>
);
