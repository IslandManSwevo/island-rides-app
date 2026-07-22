import { config } from '@gluestack-ui/config';
import { createConfig } from '@gluestack-style/react';

// KeyLo color tokens — "Coastal Modern / Junkanoo Night" (design/01-brand-identity.md)
const keyloColors = {
  primary: {
    50: '#FFF1ED',
    100: '#FFD9CF',
    200: '#FFBDAC',
    300: '#FF9C82',
    400: '#FF7A5C', // Night Drive coral
    500: '#FF5A3C', // Junkanoo Coral
    600: '#E04326', // pressed
    700: '#BC3013',
    800: '#94270F',
    900: '#6E1D0B',
  },
  secondary: {
    50: '#E6F4F4',
    100: '#C0E4E3',
    200: '#96D2D1',
    300: '#69BFBD',
    400: '#2AA198', // Night Drive teal
    500: '#0E7C7B', // Harbour Teal
    600: '#0C6B6A',
    700: '#095958',
    800: '#074747',
    900: '#053434',
  },
  accent: {
    50: '#FCF6E9',
    100: '#F7E7C4',
    200: '#F1D89E',
    300: '#EDCB79',
    400: '#F0C468', // Night Drive gold
    500: '#E8B44C', // Goombay Gold
    600: '#D19E33',
    700: '#AC8125',
    800: '#86641C',
    900: '#614813',
  },
  success: {
    50: '#E6F2EC',
    100: '#C2E0D1',
    200: '#9BCDB3',
    300: '#71B994',
    400: '#48A377',
    500: '#1E8E5A',
    600: '#1A7C4F',
    700: '#156641',
    800: '#105033',
    900: '#0B3A25',
  },
  error: {
    50: '#FBEBEA',
    100: '#F4CCC9',
    200: '#ECA9A5',
    300: '#E48680',
    400: '#DD655E',
    500: '#D6453D',
    600: '#BC3830',
    700: '#9C2D26',
    800: '#7C231E',
    900: '#5B1915',
  },
  warning: {
    50: '#FCF6E9',
    100: '#F7E7C4',
    200: '#F1D89E',
    300: '#EDCB79',
    400: '#EABF5F',
    500: '#E8B44C', // Goombay Gold doubles as warning
    600: '#D19E33',
    700: '#AC8125',
    800: '#86641C',
    900: '#614813',
  },
  // Dark mode ("Night Drive") colors
  backgroundDark: '#10161D',
  surfaceDark: '#1A222C',
  surfaceVariantDark: '#232D38',
  textDark: '#F2EFE9',
  textSecondaryDark: '#94A0AD',
  borderDark: '#2A3441',
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