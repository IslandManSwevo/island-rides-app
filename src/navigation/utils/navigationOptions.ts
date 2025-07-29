/**
 * Shared Navigation Options Utilities
 * Reduces code duplication across navigation components
 */

import { StackNavigationOptions } from '@react-navigation/stack';
import { colors } from '../../styles/theme';

/**
 * Default screen options for stack navigators
 */
export const defaultStackScreenOptions: StackNavigationOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 18,
  },
  headerBackTitleVisible: false,
  gestureEnabled: true,
};

/**
 * Modal screen options
 */
export const modalScreenOptions: StackNavigationOptions = {
  ...defaultStackScreenOptions,
  presentation: 'modal' as const,
  headerStyle: {
    ...(defaultStackScreenOptions.headerStyle || {}),
    backgroundColor: colors.background,
  },
};

/**
 * Hidden header options for tab navigators
 */
export const hiddenHeaderOptions: StackNavigationOptions = {
  headerShown: false,
  gestureEnabled: true,
};

/**
 * Auth screen options with slide animation
 */
export const authScreenOptions: StackNavigationOptions = {
  headerShown: false,
  gestureEnabled: true,
  cardStyleInterpolator: ({ current, layouts }: any) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
    },
  }),
};

/**
 * Enhanced navigation screen options
 */
export const enhancedScreenOptions: StackNavigationOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontWeight: '600',
  },
};

/**
 * Create screen options with custom title
 */
export const createScreenOptions = (title: string, options?: Partial<StackNavigationOptions>): StackNavigationOptions => ({
  ...defaultStackScreenOptions,
  title,
  ...options,
});

/**
 * Create modal screen options with custom title
 */
export const createModalOptions = (title: string, options?: Partial<StackNavigationOptions>): StackNavigationOptions => ({
  ...modalScreenOptions,
  title,
  ...options,
});

/**
 * Navigation theme configuration
 */
export const navigationTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.error,
  },
};

/**
 * Document title formatter for web
 */
export const createDocumentTitleFormatter = (appName: string = 'KeyLo') => 
  (options: any, route: any) => {
    const routeName = route?.name ?? appName;
    return `${appName} - ${routeName}`;
  };
