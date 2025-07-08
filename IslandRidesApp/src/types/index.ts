import { ReactNode } from 'react';
import { ErrorInfo } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  handler: () => void | Promise<void>;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  closable?: boolean;
  action?: NotificationAction;
  persistent?: boolean;
}

export interface PasswordRules {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  specialCharsPattern?: RegExp;
}

export type ApiErrorCode = 
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED'
  | 'INVALID_TOKEN'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'MAINTENANCE_MODE'
  | 'UNKNOWN_ERROR';

export enum ErrorCategory {
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NETWORK = 'network',
  BUSINESS = 'business',
  TECHNICAL = 'technical'
}

export interface ErrorMeta {
  code: ApiErrorCode;
  category?: ErrorCategory;
  message: string;
  timestamp: string;
  path?: string;
  details?: Record<string, any>;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: string | null;
}

export interface ApiError {
  error: string;
  code?: ApiErrorCode;
  details?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface WebSocketMessage {
  type: 'message' | 'notification' | 'status';
  payload: any;
  timestamp: string;
}

export interface WebSocketError {
  code: string;
  message: string;
  details?: any;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastConnected?: string;
  reconnectAttempt?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
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
  role?: string;
}

export type Island = 'Nassau' | 'Freeport' | 'Exuma';

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  ownerId: number;
  location: string;
  dailyRate: number;
  available: boolean;
  driveSide: 'LHD' | 'RHD';
  createdAt: string;
}

export interface VehicleRecommendation {
  id: string;
  vehicle: Vehicle;
  recommendationScore: number;
  type: string;
  island: Island;
  pricePerDay: number;
  scoreBreakdown: {
    collaborativeFiltering: number;
    vehiclePopularity: number;
    vehicleRating: number;
    hostPopularity: number;
  };
}

export interface Booking {
  id: number;
  userId: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  vehicleId: number;
  startDate: string;
  endDate: string;
}

export interface BookingResponse {
  message: string;
  booking: {
    id: number;
    vehicle: {
      id: number;
      make: string;
      model: string;
      year: number;
      location: string;
      dailyRate: number;
    };
    startDate: string;
    endDate: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  };
}

// Chat-related interfaces
export interface ChatContext {
  hostId?: number;
  vehicleId?: number;
  bookingId?: number;
  participantId?: number;
}

export interface ChatMessage {
  _id: string | number;
  text: string;
  createdAt: Date | string;
  user: {
    _id: string | number;
    name: string;
    avatar?: string;
  };
  image?: string;
  audio?: string;
}

export interface ChatUser {
  _id: string | number;
  name: string;
  avatar?: string;
}

export interface Conversation {
  id: number;
  participant1Id: number;
  participant2Id: number;
  participant1Name?: string;
  participant1Lastname?: string;
  participant2Name?: string;
  participant2Lastname?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  createdAt: string;
}

export interface ConversationResponse {
  conversationId: number;
  participant: {
    id: number;
    firstName: string;
    lastName: string;
  };
  vehicle?: {
    id: number;
    make: string;
    model: string;
    year: number;
  };
}


// Profile-related interfaces
export interface ProfileBooking {
  id: number;
  vehicle: {
    id: number;
    make: string;
    model: string;
    year: number;
    location: string;
  } | null;
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
}

export interface ProfileStats {
  totalBookings: number;
  completedTrips: number;
  totalSpent: number;
}

export interface ProfileData {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    joinDate: string;
  };
  bookings: ProfileBooking[];
  stats: ProfileStats;
}
