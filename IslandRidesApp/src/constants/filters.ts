/**
 * Filter constants for various components
 */
import { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export interface VerificationStatusOption {
  key: 'pending' | 'verified' | 'rejected' | 'expired';
  label: string;
  icon: IconName;
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
    key: 'rejected',
    label: 'Rejected',
    icon: 'close-circle'
  },
  {
    key: 'expired',
    label: 'Expired',
    icon: 'time'
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

export interface SortOption {
  key: 'popularity' | 'price_low' | 'price_high' | 'rating' | 'newest' | 'condition';
  label: string;
  icon: IconName;
}

export const SORT_OPTIONS: SortOption[] = [
  { key: 'popularity', label: 'Most Popular', icon: 'trending-up' },
  { key: 'price_low', label: 'Price: Low to High', icon: 'arrow-up' },
  { key: 'price_high', label: 'Price: High to Low', icon: 'arrow-down' },
  { key: 'rating', label: 'Highest Rated', icon: 'star' },
  { key: 'newest', label: 'Newest First', icon: 'time' },
  { key: 'condition', label: 'Best Condition', icon: 'shield-checkmark' }
];