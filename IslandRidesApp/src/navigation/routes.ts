/**
 * Navigation route constants and TypeScript types
 * Centralized route names to prevent typos and ease refactoring
 */

import { ChatContext, Vehicle, VehicleRecommendation } from '../types';

export const ROUTES = {
  // Authentication routes
  LOGIN: 'Login',
  REGISTRATION: 'Registration',
  
  // Main app routes
  ISLAND_SELECTION: 'IslandSelection',
  SEARCH_RESULTS: 'SearchResults',
  SEARCH: 'Search',
  VEHICLE_DETAIL: 'VehicleDetail',
  CHECKOUT: 'Checkout',
  BOOKING_CONFIRMED: 'BookingConfirmed',
  PAYMENT: 'Payment',
  
  // User routes
  PROFILE: 'Profile',
  PUBLIC_USER_PROFILE: 'PublicUserProfile',
  PAYMENT_HISTORY: 'PaymentHistory',
  CHAT: 'Chat',
  FAVORITES: 'Favorites',
  NOTIFICATION_PREFERENCES: 'NotificationPreferences',
  WRITE_REVIEW: 'WriteReview',
  
  // Owner Dashboard routes
  OWNER_DASHBOARD: 'OwnerDashboard',
  VEHICLE_PERFORMANCE: 'VehiclePerformance',
  FINANCIAL_REPORTS: 'FinancialReports',
  FLEET_MANAGEMENT: 'FleetManagement',
  VEHICLE_CONDITION_TRACKER: 'VehicleConditionTracker',
  VEHICLE_PHOTO_UPLOAD: 'VehiclePhotoUpload',
  VEHICLE_AVAILABILITY: 'VehicleAvailability',
  BULK_RATE_UPDATE: 'BulkRateUpdate',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES];

/**
 * Root Stack Parameter List
 * Defines the parameters for each route in the navigation stack
 */
export type RootStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTRATION]: undefined;
  [ROUTES.ISLAND_SELECTION]: undefined;
  [ROUTES.SEARCH_RESULTS]: {
    island: string;
    vehicles: VehicleRecommendation[];
  };
  [ROUTES.SEARCH]: undefined;
  [ROUTES.VEHICLE_DETAIL]: {
    vehicle: Vehicle;
  };
  [ROUTES.CHECKOUT]: {
    vehicle: Vehicle;
    startDate: string;
    endDate: string;
  };
  [ROUTES.BOOKING_CONFIRMED]: {
    bookingId: number;
  };
  [ROUTES.PROFILE]: undefined;
  [ROUTES.PUBLIC_USER_PROFILE]: {
    userId: number;
  };
  [ROUTES.PAYMENT_HISTORY]: undefined;
  [ROUTES.CHAT]: {
    context: ChatContext;
    title?: string;
  };
  [ROUTES.FAVORITES]: undefined;
  [ROUTES.NOTIFICATION_PREFERENCES]: undefined;
  [ROUTES.WRITE_REVIEW]: {
    booking: {
      id: number;
      vehicle: {
        id: number;
        make: string;
        model: string;
        year: number;
      };
      start_date: string;
      end_date: string;
    };
  };
  Payment: { booking: any };
  
  // Owner Dashboard routes
  [ROUTES.OWNER_DASHBOARD]: undefined;
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
};

