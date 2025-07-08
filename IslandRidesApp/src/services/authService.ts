import { apiService } from './apiService';
import { storageService } from './storageService';
import { AuthResponse, LoginRequest, RegisterRequest, User, PasswordRules } from '../types';
import { BusinessLogicError } from './errors/BusinessLogicError';
import { BaseService } from './base/BaseService';

interface RateLimitEntry {
  count: number;
  lastAttempt: Date;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

class AuthService extends BaseService {
  private readonly FAILED_ATTEMPTS_KEY = 'auth_failed_attempts';
  private failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();

  constructor() {
    super();
  }

  protected async onInit(): Promise<void> {
    // Wait for apiService to be initialized first
    await apiService.waitForInitialization();
    this.initializeFailedAttempts();
  }

  // Initialize failed attempts from storage
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
        // Clean up old entries on load
        await this.cleanupOldAttempts();
      }
    } catch (error) {
      console.error('Failed to initialize rate limiting data:', error);
      this.failedAttempts = new Map();
    }
  }

  // Save failed attempts to storage
  private async persistFailedAttempts(): Promise<void> {
    try {
      const data = Object.fromEntries(this.failedAttempts.entries());
      await storageService.set(this.FAILED_ATTEMPTS_KEY, data);
    } catch (error) {
      console.error('Failed to persist rate limiting data:', error);
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Ensure this service is initialized
      await this.waitForInitialization();
      
      // Validate email
      const emailValidation = this.validateEmail(credentials.email);
      if (!emailValidation.valid) {
        throw new AuthError(emailValidation.message!, 'INVALID_EMAIL', 400);
      }

      // Check rate limiting
      const rateLimit = this.checkRateLimit(credentials.email);
      if (!rateLimit.allowed) {
        const waitSeconds = Math.ceil((rateLimit.waitTime || 0) / 1000);
        throw new AuthError(
          `Too many failed attempts. Please wait ${waitSeconds} seconds before trying again.`,
          'RATE_LIMITED',
          429
        );
      }

      const response = await apiService.postWithoutAuth<AuthResponse>('/api/auth/login', credentials);
      
      if (!response.token) {
        throw new AuthError('No token received from server', 'NO_TOKEN', 500);
      }
      
      await apiService.storeToken(response.token);
      // Clear failed attempts on successful login
      if (credentials.email) {
        this.clearFailedAttempts(credentials.email);
      }
      return response;
    } catch (error) {
      // Track failed attempts for non-validation errors
      if (error instanceof AuthError && error.code !== 'INVALID_EMAIL' && error.code !== 'RATE_LIMITED') {
        this.recordFailedAttempt(credentials.email);
      }

      if (error instanceof AuthError) throw error;
      throw new AuthError(
        `Login failed: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
        'LOGIN_FAILED'
      );
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Ensure this service is initialized
      await this.waitForInitialization();
      
      // Validate email and password before sending request
      const emailValidation = this.validateEmail(userData.email);
      if (!emailValidation.valid) {
        throw new AuthError(emailValidation.message || 'Invalid email', 'INVALID_EMAIL');
      }

      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.valid) {
        throw new AuthError(passwordValidation.message || 'Invalid password', 'INVALID_PASSWORD');
      }

      const response = await apiService.postWithoutAuth<AuthResponse>('/api/auth/register', userData);
      
      if (response.token) {
        await apiService.storeToken(response.token);
      }
      
      return response;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        `Registration failed: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
        'REGISTRATION_FAILED'
      );
    }
  }

  async logout(): Promise<void> {
    console.log('🚪 === STARTING LOGOUT PROCESS ===');
    
    try {
      // Ensure this service is initialized
      await this.waitForInitialization();
      
      // Call backend logout endpoint
      try {
        await apiService.post('/api/auth/logout', {});
        console.log('🚪 Backend logout successful');
      } catch (backendError) {
        console.warn('🚪 Backend logout failed, continuing with local logout:', backendError);
        // Continue with local logout even if backend call fails
      }
      
      // Clear the stored token
      await apiService.clearToken();
      console.log('🚪 Token cleared from storage');
      
      // Verify token was actually cleared
      const remainingToken = await apiService.getToken();
      console.log('🚪 Token verification after logout:', remainingToken === null ? 'SUCCESS' : 'FAILED');
      
      console.log('🚪 === LOGOUT PROCESS COMPLETE ===');
    } catch (error) {
      console.error('🚪 Logout error:', error);
      // Even if the API call fails, we should clear the local token
      await apiService.clearToken();
      throw new AuthError('Logout failed', 'LOGOUT_FAILED');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      await this.waitForInitialization();
      const response = await apiService.post<AuthResponse>('/api/auth/refresh', {});
      
      if (response.token) {
        await apiService.storeToken(response.token);
      }
      
      return response;
    } catch (error) {
      await apiService.clearToken();
      throw new AuthError('Token refresh failed', 'REFRESH_FAILED');
    }
  }

  async refreshSession(): Promise<void> {
    try {
      const response = await this.refreshToken();
      if (!response.token) {
        throw new BusinessLogicError('Failed to refresh session', 'SESSION_REFRESH_FAILED');
      }
      await apiService.storeToken(response.token);
    } catch (error) {
      throw new BusinessLogicError(
        'Unable to refresh session',
        'SESSION_REFRESH_FAILED',
        { originalError: error }
      );
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      await this.waitForInitialization();
      const token = await apiService.getToken();
      if (!token) return null;
      
      return await apiService.get<User>('/api/auth/me');
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.waitForInitialization();
      const token = await apiService.getToken();
      if (!token) return false;
      
      // Optionally validate token with backend
      // const user = await this.getCurrentUser();
      // return !!user;
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private checkRateLimit(identifier: string): { allowed: boolean; waitTime?: number } {
    if (!this.failedAttempts.size) {
      this.initializeFailedAttempts();
    }

    const attempts = this.failedAttempts.get(identifier);
    if (!attempts) return { allowed: true };
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
    const waitTime = Math.min(attempts.count * 5000, 60000); // 5 seconds per attempt, max 1 minute
    
    if (timeSinceLastAttempt < waitTime) {
      return { allowed: false, waitTime: waitTime - timeSinceLastAttempt };
    }
    
    // If enough time has passed, clear the attempts
    if (timeSinceLastAttempt > waitTime * 2) {
      this.clearFailedAttempts(identifier);
    }
    
    return { allowed: true };
  }

  private async recordFailedAttempt(identifier: string): Promise<void> {
    if (!this.failedAttempts.size) {
      await this.initializeFailedAttempts();
    }

    const existing = this.failedAttempts.get(identifier);
    
    if (existing) {
      existing.count += 1;
      existing.lastAttempt = new Date();
    } else {
      this.failedAttempts.set(identifier, {
        count: 1,
        lastAttempt: new Date()
      });
    }
    
    await this.persistFailedAttempts();
  }

  private async clearFailedAttempts(identifier: string): Promise<void> {
    this.failedAttempts.delete(identifier);
    await this.persistFailedAttempts();
  }

  private async cleanupOldAttempts(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [identifier, attempts] of this.failedAttempts.entries()) {
      if (now - attempts.lastAttempt.getTime() > maxAge) {
        this.failedAttempts.delete(identifier);
      }
    }
    
    await this.persistFailedAttempts();
  }

  validatePassword(
    password: string,
    customRules?: PasswordRules
  ): { valid: boolean; message?: string } {
    const rules: PasswordRules = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialCharsPattern: /[!@#$%^&*(),.?":{}|<>]/,
      ...customRules
    };

    if (password.length < (rules.minLength || 8)) {
      return { valid: false, message: `Password must be at least ${rules.minLength} characters long` };
    }

    if (rules.requireUppercase && !/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (rules.requireLowercase && !/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (rules.requireNumbers && !/\d/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    if (rules.requireSpecialChars && !rules.specialCharsPattern?.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }

    return { valid: true };
  }

  getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  validateEmail(email: string): { valid: boolean; message?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || email.trim() === '') {
      return { valid: false, message: 'Email is required' };
    }
    
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    
    return { valid: true };
  }
}

export const authService = AuthService.getInstance<AuthService>();