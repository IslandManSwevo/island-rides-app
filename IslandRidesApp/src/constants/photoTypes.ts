import { colors } from '../styles/Theme';

export type PhotoType = 'exterior' | 'interior' | 'engine' | 'dashboard' | 'trunk' | 'other';

export type IconName = 'car-outline' | 'car-sport-outline' | 'hardware-chip-outline' | 'speedometer-outline' | 'cube-outline' | 'image-outline';

export interface PhotoTypeOption {
  key: PhotoType;
  label: string;
  icon: IconName;
  color: string;
}

export const photoTypeOptions: PhotoTypeOption[] = [
  { key: 'exterior', label: 'Exterior', icon: 'car-outline', color: colors.primary },
  { key: 'interior', label: 'Interior', icon: 'car-sport-outline', color: colors.verified },
  { key: 'engine', label: 'Engine', icon: 'hardware-chip-outline', color: colors.star },
  { key: 'dashboard', label: 'Dashboard', icon: 'speedometer-outline', color: colors.secondary },
  { key: 'trunk', label: 'Trunk', icon: 'cube-outline', color: colors.error },
  { key: 'other', label: 'Other', icon: 'image-outline', color: colors.grey }
];
