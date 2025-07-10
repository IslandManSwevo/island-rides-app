import { Island } from '../types';

export interface IslandOption {
  id: Island;
  name: string;
  description: string;
  emoji: string;
  features: string[];
}

export const islands: IslandOption[] = [
  {
    id: 'Nassau',
    name: 'New Providence (Nassau)',
    description: 'Capital city with beaches, resorts, and cultural attractions',
    emoji: '🏙️',
    features: ['City Life', 'Beaches', 'Shopping', 'Nightlife']
  },
  {
    id: 'Freeport',
    name: 'Grand Bahama (Freeport)', 
    description: 'Duty-free shopping, pristine beaches, and water sports',
    emoji: '🏖️',
    features: ['Duty-Free Shopping', 'Water Sports', 'Beaches', 'Resorts']
  },
  {
    id: 'Exuma',
    name: 'Exuma',
    description: 'Swimming pigs, iguanas, and crystal-clear waters',
    emoji: '🐷',
    features: ['Swimming Pigs', 'Nature', 'Adventures', 'Secluded Beaches']
  },
];