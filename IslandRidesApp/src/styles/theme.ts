// Material Design 3 Color System
// Based on Material You design principles with HCT color space
const colors = {
  // Primary color palette (Main brand color)
  primary: '#00B8D4',           // Primary 40
  onPrimary: '#FFFFFF',         // On Primary
  primaryContainer: '#B3E5FC',  // Primary 90
  onPrimaryContainer: '#001F24', // Primary 10
  
  // Secondary color palette (Supporting colors)
  secondary: '#4DB6AC',         // Secondary 40
  onSecondary: '#FFFFFF',       // On Secondary
  secondaryContainer: '#B2DFDB', // Secondary 90
  onSecondaryContainer: '#002020', // Secondary 10
  
  // Tertiary color palette (Accent colors)
  tertiary: '#7986CB',          // Tertiary 40
  onTertiary: '#FFFFFF',        // On Tertiary
  tertiaryContainer: '#E8EAF6', // Tertiary 90
  onTertiaryContainer: '#1A1C2E', // Tertiary 10
  
  // Error color palette
  error: '#E74C3C',             // Error 40
  onError: '#FFFFFF',           // On Error
  errorContainer: '#FFEBEE',    // Error 90
  onErrorContainer: '#2C0009',  // Error 10
  
  // Surface color palette
  surface: '#FFFFFF',           // Surface
  onSurface: '#1C1B1F',        // On Surface
  surfaceVariant: '#F3F4F6',   // Surface Variant
  onSurfaceVariant: '#49454F', // On Surface Variant
  
  // Background colors
  background: '#FFFFFF',        // Background
  onBackground: '#1C1B1F',     // On Background
  
  // Outline and borders
  outline: '#79747E',          // Outline
  outlineVariant: '#CAC4D0',   // Outline Variant
  
  // Surface tones for elevation
  surfaceTint: '#00B8D4',      // Surface Tint (Primary)
  
  // Inverse colors for dark themes
  inverseSurface: '#313033',    // Inverse Surface
  inverseOnSurface: '#F4EFF4', // Inverse On Surface
  inversePrimary: '#4DD0E1',   // Inverse Primary
  
  // Additional semantic colors (legacy support)
  success: '#2ECC71',
  warning: '#F1C40F',
  info: '#3498DB',
  
  // Status and utility colors
  star: '#F59E0B',
  verified: '#10B981',
  premium: '#10B981',
  partial: '#F59E0B',
  online: '#10B981',
  offline: '#6B7280',
  pending: '#F59E0B',
  
  // Legacy color mappings for backward compatibility
  dark: '#2C3E50',
  darkGrey: '#2C3E50',
  light: '#F8F9FA',
  lightGrey: '#6C757D',
  offWhite: '#F8F9FA',
  white: '#FFFFFF',
  black: '#000000',
  text: '#1C1B1F',             // Maps to onBackground
  textSecondary: '#49454F',    // Maps to onSurfaceVariant
  grey: '#6B7280',
  lightBorder: '#CAC4D0',      // Maps to outlineVariant
  mediumGrey: '#9CA3AF',
  darkText: '#1F2937',
  shadow: 'rgba(0, 0, 0, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Background variants
  cardBackground: '#FFFFFF',    // Maps to surface
  sectionBackground: '#F3F4F6', // Maps to surfaceVariant
  inputBackground: '#F3F4F6',   // Maps to surfaceVariant
  
  // Border colors
  border: '#CAC4D0',           // Maps to outlineVariant
  focusBorder: '#00B8D4',      // Maps to primary
};

// Material Design 3 Typography Scale
// Based on Material You typography system
const typography = {
  // Font families
  fontFamily: {
    regular: 'Poppins',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
  },
  
  // Display styles (largest text)
  displayLarge: {
    fontFamily: 'Poppins',
    fontSize: 57,
    fontWeight: '400' as const,
    lineHeight: 64,
    letterSpacing: -0.25,
    color: colors.onSurface,
  },
  displayMedium: {
    fontFamily: 'Poppins',
    fontSize: 45,
    fontWeight: '400' as const,
    lineHeight: 52,
    letterSpacing: 0,
    color: colors.onSurface,
  },
  displaySmall: {
    fontFamily: 'Poppins',
    fontSize: 36,
    fontWeight: '400' as const,
    lineHeight: 44,
    letterSpacing: 0,
    color: colors.onSurface,
  },
  
  // Headline styles
  headlineLarge: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '400' as const,
    lineHeight: 40,
    letterSpacing: 0,
    color: colors.onSurface,
  },
  headlineMedium: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '400' as const,
    lineHeight: 36,
    letterSpacing: 0,
    color: colors.onSurface,
  },
  headlineSmall: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '400' as const,
    lineHeight: 32,
    letterSpacing: 0,
    color: colors.onSurface,
  },
  
  // Title styles
  titleLarge: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '400' as const,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.onSurface,
  },
  titleMedium: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
    color: colors.onSurface,
  },
  titleSmall: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
    color: colors.onSurface,
  },
  
  // Label styles (for buttons, chips, etc.)
  labelLarge: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
    color: colors.onSurface,
  },
  labelMedium: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
    color: colors.onSurface,
  },
  labelSmall: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
    color: colors.onSurface,
  },
  
  // Body styles (for paragraphs and content)
  bodyLarge: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: colors.onSurface,
  },
  bodyMedium: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
    color: colors.onSurface,
  },
  bodySmall: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: colors.onSurface,
  },
  
  // Caption style (for small supplementary text)
  caption: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: colors.onSurfaceVariant,
  },
  
  // Button style (for button text)
  button: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
    color: colors.onSurface,
  },
  
  // Legacy typography mappings for backward compatibility
  heading1: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    color: colors.onSurface,
  },
  heading2: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    color: colors.onSurface,
  },
  subheading: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.onSurface,
  },
  body: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.onSurface,
  },
};

// Material Design 3 Spacing System
// Based on 4dp grid system
const spacing = {
  none: 0,
  xs: 4,     // 1 unit
  sm: 8,     // 2 units
  md: 16,    // 4 units
  lg: 24,    // 6 units
  xl: 32,    // 8 units
  xxl: 40,   // 10 units
  xxxl: 48,  // 12 units
  huge: 64,  // 16 units
};

// Material Design 3 Shape System
// Based on rounded corner specifications
const borderRadius = {
  none: 0,
  xs: 4,     // Extra small
  sm: 8,     // Small
  md: 12,    // Medium
  lg: 16,    // Large
  xl: 20,    // Extra large
  xxl: 28,   // Extra extra large
  full: 9999, // Fully rounded
};

// Material Design 3 Elevation System
// Surface elevation with shadow and tint
const elevationStyles = {
  level0: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  level2: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  level3: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
    elevation: 3,
  },
  level4: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  level5: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
};

// Main theme object following Material Design 3 specifications
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  elevationStyles,
};

// Theme utilities for common use cases
export const themeUtils = {
  // Get surface color with elevation tint
  getSurfaceColor: (elevationLevel: keyof typeof elevationStyles = 'level0') => {
    // In Material Design 3, surfaces get tinted with primary color at higher elevations
    const tintOpacity = {
      level0: 0,
      level1: 0.05,
      level2: 0.08,
      level3: 0.11,
      level4: 0.12,
      level5: 0.14,
    }[elevationLevel];
    
    return colors.surface; // Base surface color (tinting would require color mixing)
  },
  
  // Get text color based on surface
  getTextColor: (surface: 'primary' | 'secondary' | 'tertiary' | 'surface' | 'background' = 'surface') => {
    const textColors = {
      primary: colors.onPrimary,
      secondary: colors.onSecondary,
      tertiary: colors.onTertiary,
      surface: colors.onSurface,
      background: colors.onBackground,
    };
    return textColors[surface];
  },
  
  // Get container color and text color pair
  getContainerColors: (variant: 'primary' | 'secondary' | 'tertiary' | 'error' = 'primary') => {
    const containerColors = {
      primary: {
        container: colors.primaryContainer,
        onContainer: colors.onPrimaryContainer,
      },
      secondary: {
        container: colors.secondaryContainer,
        onContainer: colors.onSecondaryContainer,
      },
      tertiary: {
        container: colors.tertiaryContainer,
        onContainer: colors.onTertiaryContainer,
      },
      error: {
        container: colors.errorContainer,
        onContainer: colors.onErrorContainer,
      },
    };
    return containerColors[variant];
  },
};

// Export individual theme parts for direct import
export { colors, typography, spacing, borderRadius, elevationStyles };

// Default export
export default theme;
