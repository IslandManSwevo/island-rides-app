// Base skeleton components
export { SkeletonBase } from './SkeletonBase';

// Screen-specific skeletons
export { VehicleCardSkeleton } from './VehicleCardSkeleton';
export { SearchResultsSkeleton } from './SearchResultsSkeleton';
export { VehicleDetailSkeleton } from './VehicleDetailSkeleton';

// Feature-specific skeletons
export { VehicleReviewsSkeleton } from './VehicleReviewsSkeleton';
export { ProfileSkeleton } from './ProfileSkeleton';
export { BookingsSkeleton } from './BookingsSkeleton';
export { SavedSearchesSkeleton } from './SavedSearchesSkeleton';
export { OwnerDashboardSkeleton } from './OwnerDashboardSkeleton';
export { VehiclePerformanceSkeleton } from './VehiclePerformanceSkeleton';
export { VerificationSkeleton } from './VerificationSkeleton';

// Skeleton component configurations
export const SKELETON_CONFIGS = {
  search: {
    itemCount: 6,
    animationDuration: 1500,
    compact: false,
  },
  vehicleDetail: {
    animationDuration: 1200,
  },
  reviews: {
    reviewCount: 3,
    animationDuration: 1400,
    showHeader: true,
  },
  dashboard: {
    metricsCount: 4,
    chartHeight: 200,
    animationDuration: 1600,
  },
  profile: {
    showStats: true,
    menuItemsCount: 6,
    animationDuration: 1300,
  },
  bookings: {
    itemCount: 5,
    showFilters: true,
    animationDuration: 1400,
  },
} as const;

// Skeleton loading durations for different content types
export const LOADING_DURATIONS = {
  fast: 800,    // Quick API calls
  normal: 1500, // Standard loading
  slow: 2500,   // Heavy data processing
} as const;