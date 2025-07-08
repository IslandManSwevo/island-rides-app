/**
 * Navigation route constants and TypeScript types
 * Centralized route names to prevent typos and ease refactoring
 */

import { ChatContext, Vehicle } from '../types';

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
  CHAT: 'Chat',
  FAVORITES: 'Favorites',
  NOTIFICATION_PREFERENCES: 'NotificationPreferences',
  WRITE_REVIEW: 'WriteReview',
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
    vehicles: Vehicle[];
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
};

