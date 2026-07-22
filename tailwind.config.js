/**
 * KeyLo Tailwind config — "Coastal Modern / Junkanoo Night"
 * Semantic brand tokens only. The default Tailwind palette is disabled:
 * there is no gray-200 or blue-500 in this codebase — if a color isn't
 * named here, it isn't in the brand. Source: design/01-brand-identity.md.
 */

const colors = {
  transparent: 'transparent',
  current: 'currentColor',
  white: '#FFFFFF',

  // Neutrals
  ink: {
    DEFAULT: '#141C24',
    soft: '#3E4650',
  },
  paper: '#FAF7F2',       // limestone app background
  limestone: '#FAF7F2',   // alias — reads better in bg-limestone
  sand: {
    DEFAULT: '#E8E0D4',   // hairline borders, dividers
    soft: '#F1EBE1',      // pressed states, secondary fills
  },
  stone: '#8C8578',       // secondary text
  driftwood: '#C9C2B6',   // disabled text

  // Accent — used like a badge, never as wallpaper
  coral: {
    DEFAULT: '#FF5A3C',   // Junkanoo Coral
    pressed: '#E04326',
    night: '#FF7A5C',
    tint: '#FFF1ED',
  },
  teal: {
    DEFAULT: '#0E7C7B',   // Harbour Teal
    night: '#2AA198',
    tint: '#E6F4F4',
  },
  gold: {
    DEFAULT: '#E8B44C',   // Goombay Gold
    night: '#F0C468',
    tint: '#FCF6E9',
    deep: '#9C7420',
  },

  // Semantic
  success: { DEFAULT: '#1E8E5A', tint: '#E6F2EC' },
  warning: { DEFAULT: '#E8B44C', tint: '#FCF6E9' },
  danger: { DEFAULT: '#D6453D', tint: '#FBEBEA' },

  // Night Drive surfaces
  night: {
    DEFAULT: '#10161D',   // dark base
    raised: '#1A222C',    // elevated surface
    line: '#2A3441',      // dark borders
    text: '#F2EFE9',
    muted: '#94A0AD',
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './index.ts', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    colors,
    borderRadius: {
      none: '0',
      field: '8px',    // inputs, chips
      btn: '12px',     // buttons
      card: '16px',    // standard cards
      hero: '20px',    // hero cards, sheets
      pill: '999px',   // island pills, chips, avatars
    },
    fontFamily: {
      display: ['Fraunces_600SemiBold'],
      'display-medium': ['Fraunces_500Medium'],
      ui: ['Inter_400Regular'],
      'ui-medium': ['Inter_500Medium'],
      'ui-semibold': ['Inter_600SemiBold'],
      'ui-bold': ['Inter_700Bold'],
    },
    extend: {
      // 4pt grid comes from Tailwind's default scale (p-1 = 4px …);
      // named steps below encode the mockups' recurring proportions.
      spacing: {
        gutter: '20px',     // screen edge padding (mockups use 20, not 16)
        'card-pad': '16px', // card interior
        'chip-x': '14px',   // island pill horizontal padding
        'chip-y': '8px',
      },
      fontSize: {
        overline: ['11px', { lineHeight: '14px', letterSpacing: '0.08em' }],
        meta: ['13px', { lineHeight: '18px' }],
        body: ['15px', { lineHeight: '21px' }],
        emphasis: ['17px', { lineHeight: '23px' }],
        title: ['21px', { lineHeight: '26px', letterSpacing: '-0.02em' }],
        headline: ['28px', { lineHeight: '33px', letterSpacing: '-0.02em' }],
        hero: ['34px', { lineHeight: '39px', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        rest: '0 1px 2px rgba(20, 28, 36, 0.06)',
        float: '0 8px 24px rgba(20, 28, 36, 0.10)',
      },
    },
  },
};
