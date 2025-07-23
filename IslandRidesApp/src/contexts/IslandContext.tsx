/**
 * IslandContext - Foundation for geographic features and island-aware functionality
 * Part of Initiative 4: Island Context Provider (Week 2)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFeatureFlag } from '../services/FeatureFlagService';

export type Island = 'nassau' | 'grand-bahama' | 'paradise' | 'eleuthera' | 'harbour' | 'exumas';

export interface IslandInfo {
  id: Island;
  name: string;
  displayName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  region: string;
  timezone: string;
  currency: 'BSD' | 'USD';
  popularAreas: string[];
  isActive: boolean;
  features: {
    hasAirport: boolean;
    hasPort: boolean;
    allowsVehicleRentals: boolean;
    supportedVehicleTypes: ('car' | 'scooter' | 'boat' | 'bike')[];
  };
}

export interface IslandConfig {
  searchRadius: number; // in kilometers
  priceModifier: number; // multiplier for pricing
  minimumRentalHours: number;
  maximumRentalDays: number;
  popularPickupLocations: string[];
  emergencyContacts: {
    police: string;
    medical: string;
    roadside: string;
  };
}

export interface IslandContextType {
  currentIsland: Island;
  setCurrentIsland: (island: Island) => void;
  availableIslands: IslandInfo[];
  islandConfig: IslandConfig;
  islandInfo: IslandInfo;
  getNearbyIslands: (radius?: number) => IslandInfo[];
  getIslandByCoordinates: (lat: number, lng: number) => Island | null;
  isIslandSupported: (island: Island) => boolean;
  switchToNearestIsland: (lat: number, lng: number) => void;
}

const ISLAND_DATA: Record<Island, IslandInfo> = {
  'nassau': {
    id: 'nassau',
    name: 'Nassau',
    displayName: 'Nassau',
    coordinates: { latitude: 25.0343, longitude: -77.3963 },
    region: 'New Providence',
    timezone: 'America/Nassau',
    currency: 'BSD',
    popularAreas: ['Cable Beach', 'Paradise Island', 'Downtown Nassau', 'Fox Hill', 'Carmichael'],
    isActive: true,
    features: {
      hasAirport: true,
      hasPort: true,
      allowsVehicleRentals: true,
      supportedVehicleTypes: ['car', 'scooter', 'bike']
    }
  },
  'grand-bahama': {
    id: 'grand-bahama',
    name: 'Grand Bahama',
    displayName: 'Grand Bahama',
    coordinates: { latitude: 26.5384, longitude: -78.6569 },
    region: 'Grand Bahama',
    timezone: 'America/Nassau',
    currency: 'BSD',
    popularAreas: ['Freeport', 'Lucaya', 'Port Lucaya', 'Gold Rock Beach', 'West End'],
    isActive: true,
    features: {
      hasAirport: true,
      hasPort: true,
      allowsVehicleRentals: true,
      supportedVehicleTypes: ['car', 'scooter', 'bike']
    }
  },
  'paradise': {
    id: 'paradise',
    name: 'Paradise Island',
    displayName: 'Paradise Island',
    coordinates: { latitude: 25.0867, longitude: -77.3158 },
    region: 'New Providence',
    timezone: 'America/Nassau',
    currency: 'BSD',
    popularAreas: ['Atlantis Resort', 'Paradise Beach', 'Cove Beach', 'Marina Village'],
    isActive: true,
    features: {
      hasAirport: false,
      hasPort: false,
      allowsVehicleRentals: true,
      supportedVehicleTypes: ['scooter', 'bike']
    }
  },
  'eleuthera': {
    id: 'eleuthera',
    name: 'Eleuthera',
    displayName: 'Eleuthera',
    coordinates: { latitude: 25.1504, longitude: -76.1121 },
    region: 'Eleuthera',
    timezone: 'America/Nassau',
    currency: 'BSD',
    popularAreas: ['Governor\'s Harbour', 'Rock Sound', 'Tarpum Bay', 'Gregory Town'],
    isActive: false, // Not yet supported
    features: {
      hasAirport: true,
      hasPort: true,
      allowsVehicleRentals: false,
      supportedVehicleTypes: []
    }
  },
  'harbour': {
    id: 'harbour',
    name: 'Harbour Island',
    displayName: 'Harbour Island',
    coordinates: { latitude: 25.5041, longitude: -76.6437 },
    region: 'Eleuthera',
    timezone: 'America/Nassau',
    currency: 'BSD',
    popularAreas: ['Dunmore Town', 'Pink Sands Beach'],
    isActive: false, // Not yet supported
    features: {
      hasAirport: true,
      hasPort: true,
      allowsVehicleRentals: false,
      supportedVehicleTypes: []
    }
  },
  'exumas': {
    id: 'exumas',
    name: 'Exumas',
    displayName: 'Exumas',
    coordinates: { latitude: 23.5626, longitude: -75.9615 },
    region: 'Exumas',
    timezone: 'America/Nassau',
    currency: 'BSD',
    popularAreas: ['Georgetown', 'Staniel Cay', 'Compass Cay', 'Iguana Beach'],
    isActive: false, // Not yet supported
    features: {
      hasAirport: true,
      hasPort: true,
      allowsVehicleRentals: false,
      supportedVehicleTypes: []
    }
  }
};

const ISLAND_CONFIGS: Record<Island, IslandConfig> = {
  'nassau': {
    searchRadius: 15,
    priceModifier: 1.0,
    minimumRentalHours: 2,
    maximumRentalDays: 30,
    popularPickupLocations: [
      'Lynden Pindling International Airport',
      'Cable Beach Resort Area',
      'Downtown Nassau',
      'Paradise Island Bridge',
      'Atlantis Resort'
    ],
    emergencyContacts: {
      police: '919',
      medical: '911',
      roadside: '+1-242-356-9090'
    }
  },
  'grand-bahama': {
    searchRadius: 20,
    priceModifier: 0.9,
    minimumRentalHours: 3,
    maximumRentalDays: 21,
    popularPickupLocations: [
      'Grand Bahama International Airport',
      'Port Lucaya Marketplace',
      'Freeport Harbour',
      'Our Lucaya Resort'
    ],
    emergencyContacts: {
      police: '919',
      medical: '911',
      roadside: '+1-242-351-8080'
    }
  },
  'paradise': {
    searchRadius: 5,
    priceModifier: 1.2,
    minimumRentalHours: 1,
    maximumRentalDays: 7,
    popularPickupLocations: [
      'Atlantis Resort Main Entrance',
      'Paradise Island Bridge',
      'Marina Village',
      'Cove Beach Club'
    ],
    emergencyContacts: {
      police: '919',
      medical: '911',
      roadside: '+1-242-356-9090'
    }
  },
  'eleuthera': {
    searchRadius: 25,
    priceModifier: 1.1,
    minimumRentalHours: 4,
    maximumRentalDays: 14,
    popularPickupLocations: ['Governor\'s Harbour Airport', 'Rock Sound'],
    emergencyContacts: {
      police: '919',
      medical: '911',
      roadside: '+1-242-335-5000'
    }
  },
  'harbour': {
    searchRadius: 3,
    priceModifier: 1.5,
    minimumRentalHours: 2,
    maximumRentalDays: 5,
    popularPickupLocations: ['Harbour Island Airport', 'Government Dock'],
    emergencyContacts: {
      police: '919',
      medical: '911',
      roadside: '+1-242-333-2621'
    }
  },
  'exumas': {
    searchRadius: 30,
    priceModifier: 1.3,
    minimumRentalHours: 6,
    maximumRentalDays: 10,
    popularPickupLocations: ['Exuma International Airport', 'Georgetown'],
    emergencyContacts: {
      police: '919',
      medical: '911',
      roadside: '+1-242-336-2206'
    }
  }
};

const IslandContext = createContext<IslandContextType | undefined>(undefined);

interface IslandProviderProps {
  children: ReactNode;
  defaultIsland?: Island;
}

export const IslandProvider: React.FC<IslandProviderProps> = ({
  children,
  defaultIsland = 'nassau'
}) => {
  const [currentIsland, setCurrentIslandState] = useState<Island>(defaultIsland);
  const islandContextEnabled = useFeatureFlag('ISLAND_CONTEXT_PROVIDER');

  // Load saved island preference on mount
  useEffect(() => {
    const loadSavedIsland = async () => {
      try {
        const savedIsland = await AsyncStorage.getItem('@island_rides_current_island');
        if (savedIsland && ISLAND_DATA[savedIsland as Island]?.isActive) {
          setCurrentIslandState(savedIsland as Island);
        }
      } catch (error) {
        console.warn('Failed to load saved island preference:', error);
      }
    };

    if (islandContextEnabled) {
      loadSavedIsland();
    }
  }, [islandContextEnabled]);

  const setCurrentIsland = async (island: Island) => {
    if (!ISLAND_DATA[island]?.isActive) {
      console.warn(`Island ${island} is not currently supported`);
      return;
    }

    setCurrentIslandState(island);
    
    // Save preference
    try {
      await AsyncStorage.setItem('@island_rides_current_island', island);
      console.log(`🏝️ Switched to ${ISLAND_DATA[island].displayName}`);
    } catch (error) {
      console.warn('Failed to save island preference:', error);
    }
  };

  const availableIslands = Object.values(ISLAND_DATA).filter(island => island.isActive);

  const islandInfo = ISLAND_DATA[currentIsland];
  const islandConfig = ISLAND_CONFIGS[currentIsland];

  const getNearbyIslands = (radius: number = 50): IslandInfo[] => {
    const currentCoords = islandInfo.coordinates;
    
    return availableIslands.filter(island => {
      if (island.id === currentIsland) return false;
      
      const distance = calculateDistance(
        currentCoords.latitude,
        currentCoords.longitude,
        island.coordinates.latitude,
        island.coordinates.longitude
      );
      
      return distance <= radius;
    });
  };

  const getIslandByCoordinates = (lat: number, lng: number): Island | null => {
    let nearestIsland: Island | null = null;
    let minDistance = Infinity;

    availableIslands.forEach(island => {
      const distance = calculateDistance(
        lat,
        lng,
        island.coordinates.latitude,
        island.coordinates.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIsland = island.id;
      }
    });

    return nearestIsland;
  };

  const isIslandSupported = (island: Island): boolean => {
    return ISLAND_DATA[island]?.isActive || false;
  };

  const switchToNearestIsland = (lat: number, lng: number) => {
    const nearestIsland = getIslandByCoordinates(lat, lng);
    if (nearestIsland && nearestIsland !== currentIsland) {
      setCurrentIsland(nearestIsland);
    }
  };

  const value: IslandContextType = {
    currentIsland,
    setCurrentIsland,
    availableIslands,
    islandConfig,
    islandInfo,
    getNearbyIslands,
    getIslandByCoordinates,
    isIslandSupported,
    switchToNearestIsland
  };

  // If feature flag is disabled, provide minimal functionality
  if (!islandContextEnabled) {
    return (
      <IslandContext.Provider value={{
        ...value,
        currentIsland: 'nassau',
        setCurrentIsland: () => {},
        availableIslands: [ISLAND_DATA.nassau],
      }}>
        {children}
      </IslandContext.Provider>
    );
  }

  return (
    <IslandContext.Provider value={value}>
      {children}
    </IslandContext.Provider>
  );
};

// Custom hook for using the Island context
export const useIsland = (): IslandContextType => {
  const context = useContext(IslandContext);
  if (context === undefined) {
    throw new Error('useIsland must be used within an IslandProvider');
  }
  return context;
};

// Utility function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Additional utility hooks for common island-related operations
export const useIslandAwareSearch = () => {
  const { currentIsland, islandConfig } = useIsland();
  
  return {
    searchRadius: islandConfig.searchRadius,
    priceModifier: islandConfig.priceModifier,
    minimumHours: islandConfig.minimumRentalHours,
    maximumDays: islandConfig.maximumRentalDays,
    addIslandFilter: (params: any) => ({
      ...params,
      island: currentIsland,
      radius: islandConfig.searchRadius
    })
  };
};

export const usePopularLocations = () => {
  const { islandConfig } = useIsland();
  return islandConfig.popularPickupLocations;
};

export const useEmergencyContacts = () => {
  const { islandConfig } = useIsland();
  return islandConfig.emergencyContacts;
};

export default IslandContext;