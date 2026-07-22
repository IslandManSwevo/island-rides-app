/**
 * KeyLo design tokens — "Coastal Modern / Junkanoo Night"
 * Source of truth: design/01-brand-identity.md (mirrors design/mockups/tokens.css)
 *
 * Base is warm-neutral (Paper/Sand/Ink); Junkanoo Coral is the only primary
 * accent and should stay scarce — color is punctuation, not decoration.
 */

export const colors = {
  primary: '#FF5A3C',        // Junkanoo Coral — CTAs, prices, favorites
  primaryLight: '#FF7A5C',
  primaryDark: '#E04326',
  secondary: '#0E7C7B',      // Harbour Teal — links, verified, info
  secondaryLight: '#2AA198',
  secondaryDark: '#095958',
  accent: '#E8B44C',         // Goombay Gold — ratings, host tier
  background: '#FAF7F2',     // Paper — warm limestone, not clinical white
  surface: '#FFFFFF',
  surfaceVariant: '#F1EBE1', // Sand Soft — pressed states, secondary fills
  sectionBackground: '#FAF7F2',
  error: '#D6453D',
  warning: '#E8B44C',
  success: '#1E8E5A',
  info: '#0E7C7B',
  text: '#141C24',           // Ink
  textSecondary: '#8C8578',  // Stone
  textDisabled: '#C9C2B6',
  border: '#E8E0D4',         // Sand — hairlines over heavy shadows
  divider: '#E8E0D4',
  shadow: '#141C24',
  overlay: 'rgba(20, 28, 36, 0.5)',
  white: '#FFFFFF',
  offWhite: '#FAF7F2',
  lightGrey: '#8C8578',
  darkGrey: '#3E4650',
  black: '#141C24',
  star: '#E8B44C',
  verified: '#0E7C7B',
  grey: '#8C8578',
  lightBorder: '#E8E0D4',
  inputBackground: '#FFFFFF',
  premium: '#E8B44C',
  partial: '#E8B44C',
  successLight: '#E6F2EC',
  gradient: {
    primary: ['#FF5A3C', '#E04326'],
    secondary: ['#0E7C7B', '#2AA198'],
    accent: ['#141C24', '#3D4C5C']
  }
} as const;

/**
 * "Night Drive" dark palette. Not yet wired (app.json pins light mode);
 * exported so dark-mode work consumes the same token names as `colors`.
 */
export const darkColors = {
  ...colors,
  primary: '#FF7A5C',
  primaryLight: '#FF9C82',
  primaryDark: '#FF5A3C',
  secondary: '#2AA198',
  secondaryLight: '#69BFBD',
  secondaryDark: '#0E7C7B',
  accent: '#F0C468',
  background: '#10161D',
  surface: '#1A222C',
  surfaceVariant: '#232D38',
  sectionBackground: '#10161D',
  text: '#F2EFE9',
  textSecondary: '#94A0AD',
  textDisabled: '#5A6673',
  border: '#2A3441',
  divider: '#2A3441',
  overlay: 'rgba(0, 0, 0, 0.6)',
  offWhite: '#F2EFE9',
  black: '#0B0F14',
  star: '#F0C468',
  verified: '#2AA198',
  inputBackground: '#1A222C',
  successLight: '#16302A',
  gradient: {
    primary: ['#FF7A5C', '#FF5A3C'],
    secondary: ['#2AA198', '#0E7C7B'],
    accent: ['#10161D', '#2E3A47']
  }
} as const;

// Display sizes (heading1/2) are Fraunces once fonts land; UI text stays Inter/system.
// Font family wiring ships with the font-loading pass — tokens here are family-agnostic.
export const typography = {
  heading1: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 33,
    letterSpacing: -0.56, // display: tight -2%
  },
  heading2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.44,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  heading4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 19,
    letterSpacing: 0,
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
    letterSpacing: 0,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  full: '100%' as const,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,   // hero cards, sheets — rounded but not bubbly
  xxl: 32,
  full: 9999,
} as const;

// Brand rule: hairline Sand borders define cards; shadows are soft and rare.
export const shadows = {
  small: {
    shadowColor: '#141C24',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#141C24',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#141C24',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const elevationStyles = {
  1: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  2: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  3: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  4: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  5: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const vehicleCardStyles = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  premiumBadge: {
    backgroundColor: colors.premium,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  premiumBadgeText: {
    color: colors.black,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  verifiedBadge: {
    backgroundColor: colors.verified,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  verifiedText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  advancedInfo: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
} as const;

export const Colors = colors;
export const Spacing = spacing;
export const BorderRadius = borderRadius;
export const Shadows = shadows;
export const VehicleCardStyles = vehicleCardStyles;

export default {
  colors,
  darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  elevationStyles,
  vehicleCardStyles,
};
