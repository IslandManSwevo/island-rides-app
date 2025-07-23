/**
 * Navigation route constants and TypeScript types
 * Centralized route names to prevent typos and ease refactoring
 */

import { ChatContext, SearchFilters, Vehicle, VehicleRecommendation } from '../types';

export const ROUTES = {
  // Authentication routes
  LOGIN: 'Login',
  REGISTRATION: 'Registration',
  ONBOARDING: 'Onboarding',

  // Onboarding routes
  ONBOARDING_WELCOME: 'OnboardingWelcome',
  ONBOARDING_ROLE_SELECTION: 'OnboardingRoleSelection',
  ONBOARDING_ISLAND_SELECTION: 'OnboardingIslandSelection',
  ONBOARDING_PERMISSIONS: 'OnboardingPermissions',
  ONBOARDING_COMPLETE: 'OnboardingComplete',

  // Main app routes
  ISLAND_SELECTION: 'IslandSelection',
  ROLE_BASED_DASHBOARD: 'RoleBasedDashboard',
  SEARCH_RESULTS: 'SearchResults',
  SEARCH: 'Search',
  VEHICLE_DETAIL: 'VehicleDetail',
  CHECKOUT: 'Checkout',
  BOOKING_CONFIRMED: 'BookingConfirmed',
  PAYMENT: 'Payment',
  PAYPAL_CONFIRMATION: 'PayPalConfirmation',

  // Customer Tab Routes
  CUSTOMER_SEARCH_TAB: 'CustomerSearchTab',
  CUSTOMER_BOOKINGS_TAB: 'CustomerBookingsTab',
  CUSTOMER_FAVORITES_TAB: 'CustomerFavoritesTab',
  CUSTOMER_PROFILE_TAB: 'CustomerProfileTab',

  // Host Tab Routes
  HOST_DASHBOARD_TAB: 'HostDashboardTab',
  HOST_VEHICLES_TAB: 'HostVehiclesTab',
  HOST_BOOKINGS_TAB: 'HostBookingsTab',
  HOST_ANALYTICS_TAB: 'HostAnalyticsTab',

  // User routes
  PROFILE: 'Profile',
  PUBLIC_USER_PROFILE: 'PublicUserProfile',
  MY_BOOKINGS: 'MyBookings',
  PAYMENT_HISTORY: 'PaymentHistory',
  CHAT: 'Chat',
  FAVORITES: 'Favorites',
  NOTIFICATION_PREFERENCES: 'NotificationPreferences',
  WRITE_REVIEW: 'WriteReview',
  
  // Owner Dashboard routes
  OWNER_DASHBOARD: 'OwnerDashboard',
  HOST_DASHBOARD: 'HostDashboard',
  HOST_STOREFRONT: 'HostStorefront',
  VEHICLE_PERFORMANCE: 'VehiclePerformance',
  FINANCIAL_REPORTS: 'FinancialReports',
  FLEET_MANAGEMENT: 'FleetManagement',
  VEHICLE_CONDITION_TRACKER: 'VehicleConditionTracker',
  VEHICLE_PHOTO_UPLOAD: 'VehiclePhotoUpload',
  VEHICLE_AVAILABILITY: 'VehicleAvailability',
  BULK_RATE_UPDATE: 'BulkRateUpdate',
  COMPARE_VEHICLES: 'CompareVehicles',
  VEHICLE_DOCUMENT_MANAGEMENT: 'VehicleDocumentManagement',
  
  // Saved Searches
  SAVED_SEARCHES: 'SavedSearches',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES];

/**
 * Root Stack Parameter List
 * Defines the parameters for each route in the navigation stack
 */

/**
 * Shared types for navigation routes to reduce duplication
 */
type BookingVehicle = {
  id: number;
  make: string;
  model: string;
  year: number;
};

type BookingInfo = {
  id: number;
  start_date: string;
  end_date: string;
};

export type RootStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTRATION]: undefined;
  [ROUTES.ISLAND_SELECTION]: undefined;
  [ROUTES.ROLE_BASED_DASHBOARD]: undefined;
  [ROUTES.SEARCH_RESULTS]: {
    island: string;
    vehicles: VehicleRecommendation[];
  };
  [ROUTES.SEARCH]: {
    filters?: SearchFilters; // SearchFilters type
  } | undefined;
  [ROUTES.VEHICLE_DETAIL]: {
    vehicle?: Vehicle;
    vehicleId?: number;
  };
  [ROUTES.CHECKOUT]: {
    vehicle: Vehicle;
    startDate: string;
    endDate: string;
  };
  [ROUTES.BOOKING_CONFIRMED]: {
    booking: BookingInfo & {
      status: string;
      total_amount: number;
      vehicle: BookingVehicle & {
        location: string;
        daily_rate: number;
      };
    };
    vehicle: Vehicle;
  };
  [ROUTES.PROFILE]: undefined;
  [ROUTES.PUBLIC_USER_PROFILE]: {
    userId: number;
  };
  [ROUTES.MY_BOOKINGS]: undefined;
  [ROUTES.HOST_STOREFRONT]: {
    hostId: number;
  };
  [ROUTES.PAYMENT_HISTORY]: undefined;
  [ROUTES.CHAT]: {
    context?: ChatContext;
    conversationId?: number;
    title?: string;
  };
  [ROUTES.FAVORITES]: undefined;
  [ROUTES.NOTIFICATION_PREFERENCES]: undefined;
  [ROUTES.WRITE_REVIEW]: {
    booking: BookingInfo & {
      vehicle: BookingVehicle;
    };
  };
  [ROUTES.PAYMENT]: {
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
  };
  BankTransferInstructions: {
    instructions?: Record<string, unknown>;
    reference?: string;
    booking: BookingInfo & {
      vehicle: BookingVehicle & {
        location: string;
        dailyRate: number;
      };
      totalAmount: number;
    };
  };
  CryptoPayment: {
    walletAddress?: string;
    amount?: number;
    currency?: string;
    qrCode?: string;
    booking: BookingInfo & {
      vehicle: BookingVehicle & {
        location: string;
        dailyRate: number;
      };
      totalAmount: number;
    };
  };
  PayPalConfirmation: {
    orderId: string;
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
  };
  
  // Owner Dashboard routes
  [ROUTES.OWNER_DASHBOARD]: undefined;
  [ROUTES.HOST_DASHBOARD]: undefined;
  [ROUTES.HOST_STOREFRONT]: {
    hostId: number;
  };
  [ROUTES.VEHICLE_PERFORMANCE]: undefined;
  [ROUTES.FINANCIAL_REPORTS]: undefined;
  [ROUTES.FLEET_MANAGEMENT]: undefined;
  [ROUTES.VEHICLE_CONDITION_TRACKER]: {
    vehicleId: number;
  };
  [ROUTES.VEHICLE_PHOTO_UPLOAD]: {
    vehicleId: number;
  };
  [ROUTES.VEHICLE_AVAILABILITY]: {
    vehicleId: number;
  };
  [ROUTES.BULK_RATE_UPDATE]: {
    vehicleIds: number[];
  };
  [ROUTES.COMPARE_VEHICLES]: {
    vehicleIds: number[];
  };
  [ROUTES.VEHICLE_DOCUMENT_MANAGEMENT]: {
    vehicleId: number;
  };
  [ROUTES.SAVED_SEARCHES]: {
    filters?: SearchFilters;
  };
};
