import { NavigatorScreenParams } from '@react-navigation/native';
import { ROUTES } from './routes';
import {
  Vehicle,
  VehicleRecommendation,
  SearchFilters
} from '../types';

// Define missing types locally for now
interface BookingInfo {
  id: number;
  status: string;
  total_amount: number;
}

interface BookingVehicle {
  id: number;
  make: string;
  model: string;
  location: string;
  daily_rate: number;
}

// Root Navigator Types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  CustomerApp: NavigatorScreenParams<CustomerTabParamList>;
  HostApp: NavigatorScreenParams<HostTabParamList>;
  
  // Shared modal screens
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
  [ROUTES.PAYMENT]: {
    amount: number;
    bookingId: number;
    paymentMethod?: string;
  };
  [ROUTES.PAYPAL_CONFIRMATION]: {
    paymentId: string;
    bookingId: number;
  };
};

// Authentication Stack Types
export type AuthStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTRATION]: undefined;
  [ROUTES.ONBOARDING]: NavigatorScreenParams<OnboardingStackParamList>;
};

// Onboarding Stack Types
export type OnboardingStackParamList = {
  [ROUTES.ONBOARDING_WELCOME]: undefined;
  [ROUTES.ONBOARDING_ROLE_SELECTION]: undefined;
  [ROUTES.ONBOARDING_ISLAND_SELECTION]: undefined;
  [ROUTES.ONBOARDING_PERMISSIONS]: undefined;
  [ROUTES.ONBOARDING_COMPLETE]: {
    selectedRole: 'customer' | 'host' | 'owner';
    selectedIsland: string;
  };
};

// Customer Tab Navigator Types
export type CustomerTabParamList = {
  [ROUTES.CUSTOMER_SEARCH_TAB]: NavigatorScreenParams<SearchStackParamList>;
  [ROUTES.CUSTOMER_BOOKINGS_TAB]: NavigatorScreenParams<BookingsStackParamList>;
  [ROUTES.CUSTOMER_FAVORITES_TAB]: NavigatorScreenParams<FavoritesStackParamList>;
  [ROUTES.CUSTOMER_PROFILE_TAB]: NavigatorScreenParams<ProfileStackParamList>;
};

// Host Tab Navigator Types
export type HostTabParamList = {
  [ROUTES.HOST_DASHBOARD_TAB]: NavigatorScreenParams<HostDashboardStackParamList>;
  [ROUTES.HOST_VEHICLES_TAB]: NavigatorScreenParams<VehicleManagementStackParamList>;
  [ROUTES.HOST_BOOKINGS_TAB]: NavigatorScreenParams<HostBookingsStackParamList>;
  [ROUTES.HOST_ANALYTICS_TAB]: NavigatorScreenParams<HostAnalyticsStackParamList>;
};

// Customer Stack Types
export type SearchStackParamList = {
  [ROUTES.SEARCH]: {
    filters?: SearchFilters;
  } | undefined;
  [ROUTES.SEARCH_RESULTS]: {
    island: string;
    vehicles: VehicleRecommendation[];
  };
  [ROUTES.VEHICLE_DETAIL]: {
    vehicle?: Vehicle;
    vehicleId?: number;
  };
};

export type BookingsStackParamList = {
  [ROUTES.MY_BOOKINGS]: undefined;
  [ROUTES.VEHICLE_DETAIL]: {
    vehicle?: Vehicle;
    vehicleId?: number;
  };
  [ROUTES.CHAT]: {
    conversationId: string;
    recipientId: number;
    recipientName: string;
  };
  [ROUTES.WRITE_REVIEW]: {
    bookingId: number;
    vehicleId: number;
    hostId: number;
  };
};

export type FavoritesStackParamList = {
  [ROUTES.FAVORITES]: undefined;
  [ROUTES.VEHICLE_DETAIL]: {
    vehicle?: Vehicle;
    vehicleId?: number;
  };
};

export type ProfileStackParamList = {
  [ROUTES.PROFILE]: undefined;
  [ROUTES.PAYMENT_HISTORY]: undefined;
  [ROUTES.NOTIFICATION_PREFERENCES]: undefined;
};

// Host Stack Types
export type HostDashboardStackParamList = {
  [ROUTES.HOST_DASHBOARD]: undefined;
  [ROUTES.OWNER_DASHBOARD]: undefined;
  [ROUTES.HOST_STOREFRONT]: {
    hostId: number;
  };
};

export type VehicleManagementStackParamList = {
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
  [ROUTES.VEHICLE_DOCUMENT_MANAGEMENT]: {
    vehicleId: number;
  };
  [ROUTES.BULK_RATE_UPDATE]: {
    vehicleIds: number[];
  };
  [ROUTES.COMPARE_VEHICLES]: {
    vehicleIds: number[];
  };
};

export type HostBookingsStackParamList = {
  [ROUTES.MY_BOOKINGS]: undefined;
  [ROUTES.VEHICLE_DETAIL]: {
    vehicle?: Vehicle;
    vehicleId?: number;
  };
  [ROUTES.CHAT]: {
    conversationId: string;
    recipientId: number;
    recipientName: string;
  };
};

export type HostAnalyticsStackParamList = {
  [ROUTES.VEHICLE_PERFORMANCE]: undefined;
  [ROUTES.FINANCIAL_REPORTS]: undefined;
};

// Navigation Props Helper Types
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: any;
  route: {
    params: RootStackParamList[T];
  };
};
