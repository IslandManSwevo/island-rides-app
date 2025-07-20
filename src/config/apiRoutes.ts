/**
 * Authentication API routes configuration
 * 
 * Centralized collection of authentication-related API endpoints for the KeyLo app.
 * This object provides type-safe access to authentication routes and ensures consistency
 * across the application when making API calls.
 * 
 * @example
 * ```typescript
 * // Usage in API service calls
 * const response = await apiService.post(AuthRoutes.LOGIN, credentials);
 * const registerResponse = await apiService.post(AuthRoutes.REGISTER, userData);
 * ```
 * 
 * @readonly
 */
export const AuthRoutes = {
  /** User login endpoint - authenticates user credentials and returns access token */
  LOGIN: '/api/auth/login',
  /** User registration endpoint - creates new user account */
  REGISTER: '/api/auth/register',
} as const;