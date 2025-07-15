import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C7C7CC',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  const colors = theme === 'dark' 
    ? {
        primary: '#0A84FF',
        secondary: '#5E5CE6',
        background: '#000000',
        surface: '#1C1C1E',
        text: '#FFFFFF',
        textSecondary: '#8E8E93',
        border: '#38383A',
        success: '#32D74B',
        warning: '#FF9F0A',
        error: '#FF453A',
      }
    : {
        primary: '#007AFF',
        secondary: '#5856D6',
        background: '#FFFFFF',
        surface: '#F2F2F7',
        text: '#000000',
        textSecondary: '#8E8E93',
        border: '#C7C7CC',
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
      };

  return (
    <ThemeContext.Provider value={{ theme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
