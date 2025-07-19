import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const tokenUtils = {
  /**
   * Decode JWT token
   */
  decodeToken: (token: string): JWTPayload | null => {
    try {
      return jwtDecode<JWTPayload>(token);
    } catch (error) {
      console.warn('Failed to decode token:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired: (token: string): boolean => {
    const decoded = tokenUtils.decodeToken(token);
    if (!decoded) return true;

    const now = Date.now() / 1000;
    return decoded.exp < now;
  },

  /**
   * Check if token will expire soon (within next 5 minutes)
   */
  isTokenExpiringSoon: (token: string, bufferMinutes: number = 5): boolean => {
    const decoded = tokenUtils.decodeToken(token);
    if (!decoded) return true;

    const now = Date.now() / 1000;
    const bufferSeconds = bufferMinutes * 60;
    return decoded.exp < (now + bufferSeconds);
  },

  /**
   * Get token expiration time
   */
  getTokenExpiration: (token: string): Date | null => {
    const decoded = tokenUtils.decodeToken(token);
    if (!decoded) return null;

    return new Date(decoded.exp * 1000);
  },

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiration: (token: string): number => {
    const decoded = tokenUtils.decodeToken(token);
    if (!decoded) return 0;

    const now = Date.now() / 1000;
    return Math.max(0, decoded.exp - now);
  },

  /**
   * Get user ID from token
   */
  getUserIdFromToken: (token: string): string | null => {
    const decoded = tokenUtils.decodeToken(token);
    return decoded?.sub || null;
  },

  /**
   * Get user email from token
   */
  getUserEmailFromToken: (token: string): string | null => {
    const decoded = tokenUtils.decodeToken(token);
    return decoded?.email || null;
  },

  /**
   * Get user role from token
   */
  getUserRoleFromToken: (token: string): string | null => {
    const decoded = tokenUtils.decodeToken(token);
    return decoded?.role || null;
  },

  /**
   * Validate token format
   */
  isValidTokenFormat: (token: string): boolean => {
    if (!token || typeof token !== 'string') return false;
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  },

  /**
   * Get token age (in seconds)
   */
  getTokenAge: (token: string): number => {
    const decoded = tokenUtils.decodeToken(token);
    if (!decoded) return 0;

    const now = Date.now() / 1000;
    return now - decoded.iat;
  },

  /**
   * Check if token is valid (format + not expired)
   */
  isValidToken: (token: string): boolean => {
    return tokenUtils.isValidTokenFormat(token) && !tokenUtils.isTokenExpired(token);
  },

  /**
   * Format token expiration for display
   */
  formatTokenExpiration: (token: string): string => {
    const expiration = tokenUtils.getTokenExpiration(token);
    if (!expiration) return 'Invalid token';

    const now = new Date();
    const diff = expiration.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  },
};