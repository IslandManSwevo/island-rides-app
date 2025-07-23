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
  details?: Record<string, unknown>;
}

export type UserRole = 'user' | 'host' | 'owner' | 'admin';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: string | null;
  profileImageUrl?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  preferredIsland?: string;
  onboardingCompleted?: boolean;
  permissions?: Record<string, boolean>;
}

export interface ApiError {
  error: string;
  code?: ApiErrorCode;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
  notification?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
}

export interface WebSocketMessage {
  type: 'message' | 'notification' | 'status';
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface WebSocketError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
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
  refreshToken: string;
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
  description?: string;
  
  // Advanced specifications
  engineType?: string;
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  transmissionType?: 'automatic' | 'manual' | 'cvt';
  seatingCapacity?: number;
  doors?: number;
  fuelEfficiency?: string;
  vehicleType?: 'sedan' | 'suv' | 'truck' | 'van' | 'convertible' | 'coupe' | 'hatchback';
  color?: string;
  licensePlate?: string;
  vin?: string;
  mileage?: number;
  
  // Pricing and availability
  weeklyRate?: number;
  monthlyRate?: number;
  securityDeposit?: number;
  minimumRentalDays?: number;
  maximumRentalDays?: number;
  
  // Condition and verification
  conditionRating?: number; // 1-5 rating
  lastInspectionDate?: string;
  nextServiceDue?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  safetyFeatures?: string[];
  insurancePolicyNumber?: string;
  insuranceExpires?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'expired';
  verificationNotes?: string;
  
  // Location and delivery
  address?: string;
  latitude?: number;
  longitude?: number;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
  deliveryRadius?: number; // in kilometers
  airportPickup?: boolean;
  airportPickupFee?: number;
  instantBooking?: boolean;
  
  // Related data
  photos?: VehiclePhoto[];
  features?: VehicleFeature[];
  amenities?: VehicleAmenity[];
  averageRating?: number;
  totalReviews?: number;
  price?: number; // For compatibility with map components
  rating?: number; // For compatibility with map components
  
  // Booking and analytics data
  lastBookingDate?: string;
  totalBookings?: number;
  island?: string;
  type?: string;
}

export interface VehiclePhoto {
  id: number;
  vehicleId: number;
  photoUrl: string;
  photoType: 'exterior' | 'interior' | 'engine' | 'dashboard' | 'trunk' | 'other';
  displayOrder: number;
  caption?: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface VehicleFeatureCategory {
  id: number;
  name: string;
  description: string;
  iconName: string;
  displayOrder: number;
}

export interface VehicleFeature {
  id: number;
  categoryId: number;
  category?: VehicleFeatureCategory;
  name: string;
  description: string;
  iconName: string;
  isPremium: boolean;
  displayOrder: number;
  isIncluded?: boolean;
  additionalCost?: number;
  notes?: string;
}

// Type aliases for backward compatibility and cleaner imports
export type Feature = VehicleFeature;
export type FeatureCategory = VehicleFeatureCategory;

export interface VehicleAmenity {
  id: number;
  vehicleId: number;
  amenityType: string;
  amenityName: string;
  description?: string;
  isStandard: boolean;
  additionalCost: number;
  createdAt: string;
}

export interface VehicleAvailability {
  id: number;
  vehicleId: number;
  date: string;
  isAvailable: boolean;
  priceOverride?: number;
  reason?: string;
  createdAt: string;
}

export interface VehicleMaintenance {
  id: number;
  vehicleId: number;
  maintenanceType: string;
  description: string;
  cost?: number;
  serviceProvider?: string;
  scheduledDate?: string;
  completedDate?: string;
  mileageAtService?: number;
  notes?: string;
  createdAt: string;
}

export interface VehicleDamageReport {
  id: number;
  vehicleId: number;
  bookingId?: number;
  reportedBy: number;
  damageType: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  repairCost?: number;
  photos?: string[]; // Array of photo URLs
  insuranceClaimNumber?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
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
  // Extended properties for AI-powered recommendations
  score?: number;
  reasons?: string[];
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

// Owner Dashboard types
export interface DashboardOverview {
  grossRevenue: number;
  netRevenue: number;
  activeVehicles: number;
  totalVehicles: number;
  totalBookings: number;
  pendingBookings: number;
  occupancyRate: number;
  averageRating: number;
  totalReviews: number;
  newBookingsThisWeek: number;
}

export interface DailyRevenue {
  date: string;
  grossRevenue: number;
}

export interface VehicleRevenue {
  id: string;
  make: string;
  model: string;
  year: number;
  bookings: number;
  grossRevenue: number;
}

export interface RevenueData {
  dailyData: DailyRevenue[];
  vehicleBreakdown: VehicleRevenue[];
}

export interface Goal {
  id: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  targetPeriod: 'monthly' | 'quarterly' | 'yearly';
  createdAt: string;
  updatedAt: string;
}

export interface NewGoal {
  goalType: string;
  targetValue: string;
  targetPeriod: 'monthly' | 'quarterly' | 'yearly';
}

// Search-related interfaces
export interface SearchFilters {
  island: Island | '';
  startDate: Date | null;
  endDate: Date | null;
  priceRange: [number, number];
  vehicleTypes: string[];
  fuelTypes: string[];
  transmissionTypes: string[];
  minSeatingCapacity: number;
  features: number[]; // Feature IDs
  minConditionRating: number;
  verificationStatus: ('pending' | 'verified' | 'rejected' | 'expired')[];
  deliveryAvailable: boolean;
  airportPickup: boolean;
  instantBooking: boolean;
  sortBy: 'popularity' | 'price_low' | 'price_high' | 'rating' | 'newest' | 'condition';
}

export interface UserPreferences {
  hasBookings?: boolean;
  preferredVehicleTypes?: Array<{ type: string; count: number }>;
  preferredPriceRange?: [number, number];
  preferredIslands?: Island[];
  preferredFeatures?: number[];
  searchHistory?: string[];
  bookingHistory?: string[];
  lastSearchDate?: string;
  favoriteHosts?: number[];
}

// Re-export VehicleFilters from store slice
export type { VehicleFilters } from '../store/slices/vehicleSlice';

export type FleetVehicle = Vehicle & {
  licensePlate: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  conditionRating: number;
  mileage: number;
  nextMaintenanceDate: string | undefined;
  activeBookings: number;
  upcomingBookings: number;
  lastCleaned: string | null;
  insuranceExpiry: string | null;
  registrationExpiry: string | null;
};

// ============================================================================
// Navigation Types
// ============================================================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  VehicleDetail: { vehicleId: string };
  Booking: { vehicleId: string };
  Profile: { userId?: string };
  Settings: undefined;
  HostDashboard: undefined;
  OwnerDashboard: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Profile: undefined;
  Host?: undefined;
};

// ============================================================================
// Redux Store Types
// ============================================================================

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
  vehicles: {
    list: Vehicle[];
    current: Vehicle | null;
    loading: boolean;
    error: string | null;
  };
  bookings: {
    list: Booking[];
    current: Booking | null;
    loading: boolean;
    error: string | null;
  };
  ui: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
