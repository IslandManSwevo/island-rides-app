export const colors = {
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D5',
  secondary: '#5856D6',
  secondaryLight: '#7B7AF7',
  secondaryDark: '#3F3EB3',
  accent: '#FF9500',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceVariant: '#F8F8F8',
  sectionBackground: '#F2F2F7',
  error: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  info: '#007AFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  textDisabled: '#C7C7CC',
  border: '#E5E5EA',
  divider: '#C6C6C8',
  shadow: '#000000',
  white: '#FFFFFF',
  offWhite: '#F8F8F8',
  lightGrey: '#8E8E93',
  darkGrey: '#3A3A3C',
  black: '#000000',
  star: '#FFD700',
  verified: '#34C759',
  grey: '#8E8E93',
  lightBorder: '#E5E5EA',
  gradient: {
    primary: ['#007AFF', '#5856D6'],
    secondary: ['#5856D6', '#AF52DE'],
    accent: ['#FF9500', '#FF2D92']
  }
};

export const typography = {
  heading1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  heading2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 23,
    letterSpacing: -0.45,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 19,
    letterSpacing: -0.15,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const elevationStyles = {
  1: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  2: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  3: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  4: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  5: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
};

export const Colors = colors;
export const Spacing = spacing;
export const BorderRadius = borderRadius;
export const Shadows = shadows;

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  elevationStyles,
};
