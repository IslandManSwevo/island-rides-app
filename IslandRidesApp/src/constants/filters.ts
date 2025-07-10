/**
 * Filter constants for various components
 */

export interface VerificationStatusOption {
  key: string;
  label: string;
  icon: string;
}

export const VERIFICATION_STATUS_OPTIONS: VerificationStatusOption[] = [
  {
    key: 'verified',
    label: 'Verified',
    icon: 'checkmark-circle'
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: 'time-outline'
  },
  {
    key: 'partial',
    label: 'Partially Verified',
    icon: 'checkmark-circle-outline'
  },
  {
    key: 'unverified',
    label: 'Unverified',
    icon: 'help-circle-outline'
  },
  {
    key: 'premium',
    label: 'Premium Verified',
    icon: 'star'
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: 'close-circle'
  }
];

export const VEHICLE_TYPES = [
  'sedan',
  'suv',
  'hatchback',
  'convertible',
  'truck',
  'van',
  'coupe',
  'wagon',
  'motorcycle',
  'scooter'
];

export const FUEL_TYPES = [
  'gasoline',
  'diesel',
  'electric',
  'hybrid',
  'lpg'
];

export const TRANSMISSION_TYPES = [
  'automatic',
  'manual',
  'cvt'
];

export const SORT_OPTIONS = [
  { key: 'popularity', label: 'Most Popular', icon: 'trending-up' },
  { key: 'price_low', label: 'Price: Low to High', icon: 'arrow-up' },
  { key: 'price_high', label: 'Price: High to Low', icon: 'arrow-down' },
  { key: 'rating', label: 'Highest Rated', icon: 'star' },
  { key: 'newest', label: 'Newest First', icon: 'time' },
  { key: 'condition', label: 'Best Condition', icon: 'shield-checkmark' }
];