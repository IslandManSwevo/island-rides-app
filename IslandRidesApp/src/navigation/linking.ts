import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { ROUTES } from './routes';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['keylo://', 'https://keylo.app', 'https://www.keylo.app'],
  config: {
    screens: {
      // Authentication Flow
      Auth: {
        screens: {
          [ROUTES.LOGIN]: 'login',
          [ROUTES.REGISTRATION]: 'register',
          [ROUTES.ONBOARDING]: {
            screens: {
              [ROUTES.ONBOARDING_WELCOME]: 'onboarding/welcome',
              [ROUTES.ONBOARDING_ROLE_SELECTION]: 'onboarding/role',
              [ROUTES.ONBOARDING_ISLAND_SELECTION]: 'onboarding/island',
              [ROUTES.ONBOARDING_PERMISSIONS]: 'onboarding/permissions',
              [ROUTES.ONBOARDING_COMPLETE]: 'onboarding/complete',
            },
          },
        },
      },

      // Customer App Flow
      CustomerApp: {
        screens: {
          [ROUTES.CUSTOMER_SEARCH_TAB]: {
            screens: {
              [ROUTES.SEARCH]: 'search',
              [ROUTES.SEARCH_RESULTS]: 'search/results',
              [ROUTES.VEHICLE_DETAIL]: 'vehicle/:vehicleId',
            },
          },
          [ROUTES.CUSTOMER_BOOKINGS_TAB]: {
            screens: {
              [ROUTES.MY_BOOKINGS]: 'bookings',
              [ROUTES.VEHICLE_DETAIL]: 'bookings/vehicle/:vehicleId',
              [ROUTES.CHAT]: 'chat/:conversationId',
              [ROUTES.WRITE_REVIEW]: 'review/:bookingId',
            },
          },
          [ROUTES.CUSTOMER_FAVORITES_TAB]: {
            screens: {
              [ROUTES.FAVORITES]: 'favorites',
              [ROUTES.VEHICLE_DETAIL]: 'favorites/vehicle/:vehicleId',
            },
          },
          [ROUTES.CUSTOMER_PROFILE_TAB]: {
            screens: {
              [ROUTES.PROFILE]: 'profile',
              [ROUTES.PAYMENT_HISTORY]: 'profile/payments',
              [ROUTES.NOTIFICATION_PREFERENCES]: 'profile/notifications',
            },
          },
        },
      },

      // Host App Flow
      HostApp: {
        screens: {
          [ROUTES.HOST_DASHBOARD_TAB]: {
            screens: {
              [ROUTES.HOST_DASHBOARD]: 'host/dashboard',
              [ROUTES.OWNER_DASHBOARD]: 'owner/dashboard',
              [ROUTES.HOST_STOREFRONT]: 'host/storefront/:hostId',
            },
          },
          [ROUTES.HOST_VEHICLES_TAB]: {
            screens: {
              [ROUTES.FLEET_MANAGEMENT]: 'host/vehicles',
              [ROUTES.VEHICLE_CONDITION_TRACKER]: 'host/vehicles/:vehicleId/condition',
              [ROUTES.VEHICLE_PHOTO_UPLOAD]: 'host/vehicles/:vehicleId/photos',
              [ROUTES.VEHICLE_AVAILABILITY]: 'host/vehicles/:vehicleId/availability',
              [ROUTES.VEHICLE_DOCUMENT_MANAGEMENT]: 'host/vehicles/:vehicleId/documents',
              [ROUTES.BULK_RATE_UPDATE]: 'host/vehicles/rates',
              [ROUTES.COMPARE_VEHICLES]: 'host/vehicles/compare',
            },
          },
          [ROUTES.HOST_BOOKINGS_TAB]: {
            screens: {
              [ROUTES.MY_BOOKINGS]: 'host/bookings',
              [ROUTES.VEHICLE_DETAIL]: 'host/bookings/vehicle/:vehicleId',
              [ROUTES.CHAT]: 'host/chat/:conversationId',
            },
          },
          [ROUTES.HOST_ANALYTICS_TAB]: {
            screens: {
              [ROUTES.VEHICLE_PERFORMANCE]: 'host/analytics/performance',
              [ROUTES.FINANCIAL_REPORTS]: 'host/analytics/financial',
            },
          },
        },
      },

      // Shared Modal Screens
      [ROUTES.VEHICLE_DETAIL]: 'vehicle/:vehicleId',
      [ROUTES.CHECKOUT]: 'checkout',
      [ROUTES.BOOKING_CONFIRMED]: 'booking/confirmed/:bookingId',
      [ROUTES.PAYMENT]: 'payment/:bookingId',
      [ROUTES.PAYPAL_CONFIRMATION]: 'payment/paypal/:paymentId',
    },
  },
  
  // Custom URL parsing for complex parameters
  getInitialURL: async () => {
    // Handle custom URL schemes and universal links
    const url = await import('expo-linking').then(Linking => Linking.getInitialURL());
    return url;
  },
  
  subscribe: (listener) => {
    // Listen for URL changes
    const linkingSubscription = import('expo-linking').then(Linking =>
      Linking.addEventListener('url', ({ url }: { url: string }) => listener(url))
    );
    
    return () => {
      linkingSubscription.then(subscription => subscription?.remove());
    };
  },
};

// Helper functions for generating deep links
export const generateDeepLink = {
  // Authentication
  login: () => 'keylo://login',
  register: () => 'keylo://register',
  
  // Vehicle
  vehicle: (vehicleId: number) => `keylo://vehicle/${vehicleId}`,
  
  // Search
  search: (filters?: Record<string, any>) => {
    const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return `keylo://search${params}`;
  },
  
  // Bookings
  booking: (bookingId: number) => `keylo://booking/confirmed/${bookingId}`,
  
  // Chat
  chat: (conversationId: string) => `keylo://chat/${conversationId}`,
  
  // Host
  hostDashboard: () => 'keylo://host/dashboard',
  hostVehicles: () => 'keylo://host/vehicles',
  hostBookings: () => 'keylo://host/bookings',
  
  // Profile
  profile: () => 'keylo://profile',
  favorites: () => 'keylo://favorites',
};

// URL validation helpers
export const validateDeepLink = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['keylo:', 'https:'].includes(parsedUrl.protocol) &&
           ['keylo.app', 'www.keylo.app', ''].includes(parsedUrl.hostname || '');
  } catch {
    return false;
  }
};

export const parseDeepLinkParams = (url: string): Record<string, any> => {
  try {
    const parsedUrl = new URL(url);
    const params: Record<string, any> = {};
    
    // Extract path parameters
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    pathSegments.forEach((segment, index) => {
      if (segment.startsWith(':')) {
        const paramName = segment.slice(1);
        const paramValue = pathSegments[index + 1];
        if (paramValue) {
          params[paramName] = paramValue;
        }
      }
    });
    
    // Extract query parameters
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch {
    return {};
  }
};

export default linking;
