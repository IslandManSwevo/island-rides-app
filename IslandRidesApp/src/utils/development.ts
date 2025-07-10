/**
 * Creates a function that only exists in development mode.
 * In production, it returns undefined.
 *
 * @param devFunction The function to be available in development.
 * @returns The function in development, otherwise undefined.
 */
export const createDevOnlyFunction = <T extends (...args: any[]) => any>(
  devFunction: T
): T | undefined => {
  return __DEV__ ? devFunction : undefined;
};