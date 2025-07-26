/**
 * Unified Authentication Service
 * Consolidates all authentication logic to resolve dual auth system vulnerability
 * Implements JWT-based authentication with role-based access control
 */

import { apiService } from '../apiService';
import { storageService } from '../storageService';
import { loggingService } from '../LoggingService';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from '../../types';
import { BusinessLogicError } from '../errors/BusinessLogicError';
import { BaseService } from '../base/BaseService';
import jwtDecode from 'jwt-decode';

export interface TokenPayload {
  userId: number;
  email: string;
  role: UserRole;
  island?: string;
  permissions?: string[];
  exp: number;
  iat: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: Date | null;
}

export interface AuthEventListener {
  onAuthStateChanged: (state: AuthState) => void;
  onTokenRefreshed?: (token: string) => void;
  onAuthError?: (error: AuthError) => void;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

interface RateLimitEntry {
  count: number;
  lastAttempt: Date;
}

export class UnifiedAuthService extends BaseService {
  private static instance: UnifiedAuthService;
  
  // Storage keys
  private readonly TOKEN_KEY = '@keylo_auth_token';
  private readonly REFRESH_TOKEN_KEY = '@keylo_refresh_token';
  private readonly USER_KEY = '@keylo_user_data';
  private readonly FAILED_ATTEMPTS_KEY = '@keylo_failed_attempts';
  
  // Rate limiting
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private failedAttempts = new Map<string, RateLimitEntry>();
  
  // Token management
  private readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
  private refreshTokenPromise: Promise<string> | null = null;
  
  // Authentication state
  private authState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    lastActivity: null,
  };
  
  // Event listeners
  private listeners: AuthEventListener[] = [];
  
  // Session management
  private sessionTimeoutId: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    super();
  }

  static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService();
    }
    return UnifiedAuthService.instance;
  }

  protected override async onInit(): Promise<void> {
    await apiService.waitForInitialization();
    await this.initializeFailedAttempts();
    await this.restoreAuthState();
    this.setupTokenRefreshInterceptor();
    this.startSessionMonitoring();
  }

  /**
   * Initialize failed attempts from storage
   */
  private async initializeFailedAttempts(): Promise<void> {
    try {
      const stored = await storageService.get<Record<string, RateLimitEntry>>(this.FAILED_ATTEMPTS_KEY);
      if (stored) {
        this.failedAttempts = new Map(
          Object.entries(stored).map(([key, value]) => [
            key,
            { ...value, lastAttempt: new Date(value.lastAttempt) }
          ])
        );
        await this.cleanupOldAttempts();
      }
    } catch (error) {
      loggingService.warn('Failed to initialize failed attempts', { error });
    }
  }

  /**
   * Restore authentication state from storage
   */
  private async restoreAuthState(): Promise<void> {
    try {
      this.setLoading(true);
      
      const [token, refreshToken, userData] = await Promise.all([
        storageService.get<string>(this.TOKEN_KEY),
        storageService.get<string>(this.REFRESH_TOKEN_KEY),
        storageService.get<User>(this.USER_KEY),
      ]);

      if (token && refreshToken && userData) {
        // Validate token
        if (this.isTokenValid(token)) {
          this.updateAuthState({
            user: userData,
            token,
            refreshToken,
            isAuthenticated: true,
            lastActivity: new Date(),
          });
          
          loggingService.info('Auth state restored successfully', { userId: userData.id });
        } else {
          // Try to refresh token
          try {
            await this.refreshAccessToken();
          } catch (error) {
            loggingService.warn('Token refresh failed during restore', { error });
            await this.clearAuthState();
          }
        }
      }
    } catch (error) {
      loggingService.error('Failed to restore auth state', error instanceof Error ? error : undefined);
      await this.clearAuthState();
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      this.setLoading(true);
      
      // Check rate limiting
      this.checkRateLimit(credentials.email);
      
      const response = await apiService.postWithoutAuth<AuthResponse>('/api/auth/login', credentials);
      
      if (!response.token || !response.refreshToken) {
        throw new AuthError('Invalid response from server', 'INVALID_RESPONSE', 500);
      }
      
      // Store tokens and user data
      await this.storeAuthData(response.token, response.refreshToken, response.user);
      
      // Update auth state
      this.updateAuthState({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        lastActivity: new Date(),
      });
      
      // Clear failed attempts on successful login
      this.clearFailedAttempts(credentials.email);
      
      loggingService.info('Login successful', { userId: response.user.id, role: response.user.role });
      
      return response;
    } catch (error) {
      // Record failed attempt
      this.recordFailedAttempt(credentials.email);
      
      const authError = this.handleAuthError(error, 'login');
      loggingService.error('Login failed', authError);
      throw authError;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      this.setLoading(true);
      
      const response = await apiService.postWithoutAuth<AuthResponse>('/api/auth/register', userData);
      
      if (!response.token || !response.refreshToken) {
        throw new AuthError('Invalid response from server', 'INVALID_RESPONSE', 500);
      }
      
      // Store tokens and user data
      await this.storeAuthData(response.token, response.refreshToken, response.user);
      
      // Update auth state
      this.updateAuthState({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        lastActivity: new Date(),
      });
      
      loggingService.info('Registration successful', { userId: response.user.id, role: response.user.role });
      
      return response;
    } catch (error) {
      const authError = this.handleAuthError(error, 'register');
      loggingService.error('Registration failed', authError);
      throw authError;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if authenticated
      if (this.authState.isAuthenticated && this.authState.token) {
        try {
          await apiService.post('/api/auth/logout', {});
        } catch (error) {
          // Continue with logout even if API call fails
          loggingService.warn('Logout API call failed', { error });
        }
      }
      
      await this.clearAuthState();
      loggingService.info('Logout successful');
    } catch (error) {
      loggingService.error('Logout failed', error instanceof Error ? error : undefined);
      // Force clear state even if there's an error
      await this.clearAuthState();
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshTokenPromise;
      return newToken;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    if (!this.authState.refreshToken) {
      throw new AuthError('No refresh token available', 'NO_REFRESH_TOKEN', 401);
    }

    try {
      const response = await apiService.postWithoutAuth<{ token: string; refreshToken: string }>('/api/auth/refresh', {
        refreshToken: this.authState.refreshToken,
      });

      // Store new tokens
      await this.storeAuthData(response.token, response.refreshToken, this.authState.user!);
      
      // Update auth state
      this.updateAuthState({
        ...this.authState,
        token: response.token,
        refreshToken: response.refreshToken,
        lastActivity: new Date(),
      });

      // Notify listeners
      this.notifyListeners();
      this.listeners.forEach(listener => {
        listener.onTokenRefreshed?.(response.token);
      });

      loggingService.info('Token refreshed successfully');
      return response.token;
    } catch (error) {
      loggingService.error('Token refresh failed', error instanceof Error ? error : undefined);
      await this.clearAuthState();
      throw new AuthError('Token refresh failed', 'REFRESH_FAILED', 401);
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(requiredRole: UserRole): boolean {
    if (!this.authState.isAuthenticated || !this.authState.user) {
      return false;
    }

    const userRole = this.authState.user.role;

    // Role hierarchy: admin > owner > host > user
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'host': 2,
      'owner': 3,
      'admin': 4,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    if (!this.authState.isAuthenticated || !this.authState.user) {
      return false;
    }

    // Check user permissions
    const userPermissions = this.authState.user.permissions || {};
    return userPermissions[permission] === true;
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.authState.user;
  }

  /**
   * Get current token
   */
  getCurrentToken(): string | null {
    return this.authState.token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && this.isTokenValid(this.authState.token);
  }

  /**
   * Add authentication event listener
   */
  addListener(listener: AuthEventListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update user activity timestamp
   */
  updateActivity(): void {
    if (this.authState.isAuthenticated) {
      this.updateAuthState({
        ...this.authState,
        lastActivity: new Date(),
      });
      this.resetSessionTimeout();
    }
  }

  // Private helper methods

  private isTokenValid(token: string | null): boolean {
    if (!token) return false;

    try {
      const payload = jwtDecode<TokenPayload>(token);
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }

  private shouldRefreshToken(token: string | null): boolean {
    if (!token) return false;

    try {
      const payload = jwtDecode<TokenPayload>(token);
      const now = Date.now() / 1000;
      const timeUntilExpiry = (payload.exp - now) * 1000;
      return timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD;
    } catch (error) {
      return false;
    }
  }

  private async storeAuthData(token: string, refreshToken: string, user: User): Promise<void> {
    await Promise.all([
      storageService.set(this.TOKEN_KEY, token),
      storageService.set(this.REFRESH_TOKEN_KEY, refreshToken),
      storageService.set(this.USER_KEY, user),
    ]);
  }

  private async clearAuthState(): Promise<void> {
    // Clear storage
    await Promise.all([
      storageService.remove(this.TOKEN_KEY),
      storageService.remove(this.REFRESH_TOKEN_KEY),
      storageService.remove(this.USER_KEY),
    ]);

    // Clear session timeout
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }

    // Update auth state
    this.updateAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: null,
    });
  }

  private updateAuthState(newState: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...newState };
    this.notifyListeners();
  }

  private setLoading(isLoading: boolean): void {
    this.updateAuthState({ isLoading });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener.onAuthStateChanged(this.authState);
      } catch (error) {
        loggingService.error('Auth listener error', error instanceof Error ? error : undefined);
      }
    });
  }

  private checkRateLimit(email: string): void {
    const attempts = this.failedAttempts.get(email);
    if (!attempts) return;

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();

    if (attempts.count >= this.MAX_FAILED_ATTEMPTS && timeSinceLastAttempt < this.LOCKOUT_DURATION) {
      const remainingTime = Math.ceil((this.LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
      throw new AuthError(
        `Too many failed attempts. Try again in ${remainingTime} minutes.`,
        'RATE_LIMITED',
        429
      );
    }
  }

  private recordFailedAttempt(email: string): void {
    const now = new Date();
    const existing = this.failedAttempts.get(email);

    if (existing && now.getTime() - existing.lastAttempt.getTime() < this.LOCKOUT_DURATION) {
      existing.count++;
      existing.lastAttempt = now;
    } else {
      this.failedAttempts.set(email, { count: 1, lastAttempt: now });
    }

    this.persistFailedAttempts();
  }

  private clearFailedAttempts(email: string): void {
    this.failedAttempts.delete(email);
    this.persistFailedAttempts();
  }

  private async persistFailedAttempts(): Promise<void> {
    try {
      const data = Object.fromEntries(this.failedAttempts);
      await storageService.set(this.FAILED_ATTEMPTS_KEY, data);
    } catch (error) {
      loggingService.warn('Failed to persist failed attempts', { error });
    }
  }

  private async cleanupOldAttempts(): Promise<void> {
    const now = new Date();
    let hasChanges = false;

    for (const [email, attempts] of this.failedAttempts.entries()) {
      if (now.getTime() - attempts.lastAttempt.getTime() > this.LOCKOUT_DURATION) {
        this.failedAttempts.delete(email);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await this.persistFailedAttempts();
    }
  }

  private setupTokenRefreshInterceptor(): void {
    // Set up automatic token refresh before API calls
    apiService.addRequestInterceptor(async (config) => {
      if (this.authState.token && this.shouldRefreshToken(this.authState.token)) {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          loggingService.warn('Auto token refresh failed', { error });
        }
      }
      return config;
    });
  }

  private startSessionMonitoring(): void {
    this.resetSessionTimeout();
  }

  private resetSessionTimeout(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }

    if (this.authState.isAuthenticated) {
      this.sessionTimeoutId = setTimeout(() => {
        loggingService.info('Session timeout - logging out user');
        this.logout();
      }, this.SESSION_TIMEOUT);
    }
  }

  private handleAuthError(error: unknown, context: string): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    if (error instanceof BusinessLogicError) {
      return new AuthError(error.message, error.code, error.statusCode);
    }

    if (error instanceof Error) {
      return new AuthError(error.message, 'UNKNOWN_ERROR', 500);
    }

    return new AuthError('An unexpected error occurred', 'UNKNOWN_ERROR', 500);
  }
}

// Export singleton instance
export const unifiedAuthService = UnifiedAuthService.getInstance();
