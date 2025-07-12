// Type declaration for React Native's __DEV__ global
declare const __DEV__: boolean;

/**
 * Creates a function that only exists in development mode.
 * In production, it returns undefined.
 *
 * @param devFunction The function to be available in development.
 * @returns The function in development, otherwise undefined.
 */
export const createDevOnlyFunction = <T extends (...args: unknown[]) => any>(
  devFunction: T
): T | undefined => {
  return __DEV__ ? devFunction : undefined;
};