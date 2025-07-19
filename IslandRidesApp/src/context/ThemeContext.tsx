import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as lightColors, typography, spacing, borderRadius, shadows, elevationStyles } from '../styles/theme';

type ThemeMode = 'light' | 'dark' | 'auto';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ColorScheme;
  colors: typeof lightColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  elevationStyles: typeof elevationStyles;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const darkColors = {
  ...lightColors,
  primary: '#4A9EFF',
  primaryLight: '#70B7FF',
  primaryDark: '#2980FF',
  secondary: '#7B7AF7',
  secondaryLight: '#9B9BFF',
  secondaryDark: '#5856D6',
  accent: '#FF9F0A',
  background: '#000000',
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  sectionBackground: '#1C1C1E',
  error: '#FF453A',
  warning: '#FF9F0A',
  success: '#32D74B',
  info: '#4A9EFF',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textDisabled: '#48484A',
  border: '#38383A',
  divider: '#38383A',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  white: '#FFFFFF',
  offWhite: '#F2F2F7',
  lightGrey: '#8E8E93',
  darkGrey: '#EBEBF5',
  black: '#000000',
  star: '#FFD60A',
  verified: '#32D74B',
  grey: '#8E8E93',
  lightBorder: '#38383A',
  inputBackground: '#2C2C2E',
  premium: '#FFD60A',
  partial: '#FF9F0A',
  gradient: {
    primary: ['#4A9EFF', '#7B7AF7'],
    secondary: ['#7B7AF7', '#AF52DE'],
    accent: ['#FF9F0A', '#FF453A']
  }
};

const THEME_STORAGE_KEY = '@keylo_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const systemColorScheme = useColorScheme();

  // Load theme mode from storage on app start
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme mode from storage:', String(error));
      }
    };
    loadThemeMode();
  }, []);

  // Determine current theme based on mode and system preference
  const theme: ColorScheme = mode === 'auto' 
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : mode as ColorScheme;

  // Get colors based on current theme
  const colors = theme === 'dark' ? darkColors : lightColors;

  const setMode = async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      console.warn('Failed to save theme mode to storage:', String(error));
      setModeState(newMode); // Still update state even if storage fails
    }
  };

  const toggleTheme = async () => {
    if (mode === 'auto') {
      await setMode('light');
    } else if (mode === 'light') {
      await setMode('dark');
    } else {
      await setMode('auto');
    }
  };

  const value: ThemeContextType = {
    mode,
    theme,
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    elevationStyles,
    setMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
