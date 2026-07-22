import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as lightColors, darkColors, typography, spacing, borderRadius, shadows, elevationStyles } from '../styles/theme';
import { loggingService } from '../services/LoggingService';

type ThemeMode = 'light' | 'dark' | 'auto';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ColorScheme;
  colors: typeof lightColors | typeof darkColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  elevationStyles: typeof elevationStyles;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

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
        loggingService.warn('Failed to load theme mode from storage', { error: String(error) });
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
      loggingService.warn('Failed to save theme mode to storage', { error: String(error) });
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
