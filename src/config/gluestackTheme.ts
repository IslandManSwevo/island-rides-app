import { config } from '@gluestack-ui/config';
import { createConfig } from '@gluestack-style/react';

// KeyLo-specific color tokens
const keyloColors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB', 
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#007AFF', // KeyLo primary blue
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  secondary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#5856D6', // KeyLo secondary purple
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },
  accent: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9500', // KeyLo accent orange
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },
  success: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#34C759', // KeyLo success green
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#FF3B30', // KeyLo error red
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FF9500', // KeyLo warning orange
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },
  // Dark mode specific colors
  backgroundDark: '#000000',
  surfaceDark: '#1C1C1E',
  surfaceVariantDark: '#2C2C2E',
  textDark: '#FFFFFF',
  textSecondaryDark: '#8E8E93',
  borderDark: '#38383A',
};

// KeyLo spacing tokens (consistent with existing theme)
const keyloSpacing = {
  'px': '1px',
  '0': '0px',
  '0.5': '2px',
  '1': '4px',    // xs
  '1.5': '6px',
  '2': '8px',    // sm
  '2.5': '10px',
  '3': '12px',
  '3.5': '14px',
  '4': '16px',   // md
  '5': '20px',
  '6': '24px',   // lg
  '7': '28px',
  '8': '32px',   // xl
  '9': '36px',
  '10': '40px',
  '11': '44px',
  '12': '48px',  // xxl
  '14': '56px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '32': '128px',
  '40': '160px',
  '48': '192px',
  '56': '224px',
  '64': '256px',
};

// KeyLo typography tokens
const keyloFonts = {
  heading: 'System',
  body: 'System',
  mono: 'Courier',
};

const keyloFontSizes = {
  '2xs': '10px',
  'xs': '12px',   // caption
  'sm': '14px',   // bodySmall
  'md': '16px',   // body
  'lg': '18px',   // heading4
  'xl': '20px',   // heading3
  '2xl': '22px',  // heading2
  '3xl': '28px',  // heading1
  '4xl': '36px',
  '5xl': '48px',
  '6xl': '60px',
};

// Create Gluestack config with KeyLo theme
export const gluestackUIConfig = createConfig({
  ...config,
  tokens: {
    ...config.tokens,
    colors: {
      ...config.tokens.colors,
      ...keyloColors,
    },
    space: {
      ...config.tokens.space,
      ...keyloSpacing,
    },
    fonts: {
      ...config.tokens.fonts,
      ...keyloFonts,
    },
    fontSizes: {
      ...config.tokens.fontSizes,
      ...keyloFontSizes,
    },
    borderRadius: {
      ...config.tokens.radii,
      'xs': '4px',
      'sm': '8px',
      'md': '12px',
      'lg': '16px',
      'xl': '24px',
      '2xl': '32px',
      'full': '9999px',
    },
  },
  // Component themes
  components: {
    ...config.components,
    Button: {
      ...config.components.Button,
      theme: {
        ...config.components.Button.theme,
        // Enhanced button styling
        defaultProps: {
          size: 'md',
          variant: 'solid',
          action: 'primary',
        },
        variants: {
          solid: {
            bg: '$primary500',
            borderColor: '$primary500',
            ':hover': {
              bg: '$primary600',
              borderColor: '$primary600',
            },
            ':active': {
              bg: '$primary700',
              borderColor: '$primary700',
            },
            ':disabled': {
              opacity: 0.5,
            },
            _dark: {
              bg: '$primary400',
              borderColor: '$primary400',
              ':hover': {
                bg: '$primary500',
                borderColor: '$primary500',
              },
            },
          },
          outline: {
            bg: 'transparent',
            borderColor: '$primary500',
            borderWidth: 1,
            _dark: {
              borderColor: '$primary400',
            },
          },
          ghost: {
            bg: 'transparent',
            borderColor: 'transparent',
          },
        },
      },
    },
    Input: {
      ...config.components.Input,
      theme: {
        ...config.components.Input.theme,
        defaultProps: {
          size: 'md',
          variant: 'outline',
        },
        variants: {
          outline: {
            borderColor: '$outline',
            bg: '$surface',
            ':focus': {
              borderColor: '$primary500',
              bg: '$background',
            },
            ':invalid': {
              borderColor: '$error500',
            },
            _dark: {
              borderColor: '$borderDark',
              bg: '$surfaceVariantDark',
              ':focus': {
                borderColor: '$primary400',
                bg: '$surfaceDark',
              },
            },
          },
        },
      },
    },
    Box: {
      ...config.components.Box,
      theme: {
        ...config.components.Box.theme,
        defaultProps: {
          bg: '$surface',
        },
        variants: {
          card: {
            bg: '$surface',
            borderRadius: '$lg',
            shadowColor: '$shadow',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            _dark: {
              bg: '$surfaceDark',
            },
          },
          elevated: {
            bg: '$surface',
            borderRadius: '$lg',
            shadowColor: '$shadow',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
            _dark: {
              bg: '$surfaceDark',
            },
          },
        },
      },
    },
  },
});

export type KeyLoUIConfig = typeof gluestackUIConfig;