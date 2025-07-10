export const colors = {
  primary: '#00B8D4',
  primaryHover: '#0097A7',
  darkGrey: '#2C3E50',
  lightGrey: '#6C757D',
  offWhite: '#F8F9FA',
  white: '#FFFFFF',
  error: '#E74C3C',
  success: '#2ECC71',
  warning: '#F1C40F',
  info: '#3498DB',
};

const lineHeightRatio = 1.5;

export const typography = {
  fontFamily: 'Poppins',
  heading1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.darkGrey,
    lineHeight: 28 * lineHeightRatio,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.darkGrey,
    lineHeight: 20 * lineHeightRatio,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.lightGrey,
    lineHeight: 16 * lineHeightRatio,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 25,
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
};
