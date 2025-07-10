import type { ReactNode, ErrorInfo } from 'react';

// User role enum for type safety
export enum UserRole {
  CUSTOMER = 'customer',
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

// Password validation rules interface
export interface PasswordRules {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  specialCharsPattern?: RegExp;
}

// Error handling types
export type ApiErrorCode = 
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED'
  | 'INVALID_TOKEN'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'MAINTENANCE_MODE';

export interface ApiErrorDetails {
  code: ApiErrorCode;
  message: string;
  timestamp: string;
  path?: string;
  details?: Record<string, any>;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  handler: () => void;
}

export interface Notification {
  id?: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
  action?: NotificationAction;
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NETWORK = 'network',
  BUSINESS = 'business',
  TECHNICAL = 'technical'
}

export interface ErrorMeta {
  category?: ErrorCategory;
  code?: string;
  fields?: Record<string, string[]>;
  [key: string]: unknown;
}
