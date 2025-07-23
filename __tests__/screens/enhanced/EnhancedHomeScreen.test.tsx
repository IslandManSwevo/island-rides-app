/**
 * Enhanced Home Screen Test Suite
 * 
 * Tests the enhanced home screen functionality including feature flag
 * integration, smart island selection, and enhanced navigation features.
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { EnhancedHomeScreen } from '../../../src/screens/enhanced/EnhancedHomeScreen';
import { featureFlagsSlice } from '../../../src/store/slices/featureFlagsSlice';
import { vehicleService } from '../../../src/services/vehicleService';

// Mock the vehicle service
jest.mock('../../../src/services/vehicleService', () => ({
  vehicleService: {
    getPopularVehicles: jest.fn(),
    getRecommendedVehicles: jest.fn(),
    enhancedSearchVehicles: jest.fn(),
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  dispatch: jest.fn(),
};

// Mock feature flag hooks
jest.mock('../../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: jest.fn(),
  useEnhancedNavigation: () => ({
    actions: {
      logNavigationEvent: jest.fn(),
    },
  }),
}));

import { useFeatureFlag } from '../../../src/hooks/useFeatureFlags';

describe('EnhancedHomeScreen', () => {
  let store: any;
  let mockUseFeatureFlag: jest.MockedFunction<typeof useFeatureFlag>;

  beforeEach(() => {
    // Create test store
    store = configureStore({
      reducer: {
        featureFlags: featureFlagsSlice.reducer,
      },
      preloadedState: {
        featureFlags: {
          flags: {
            ENHANCED_HOME_SCREEN: true,
            SMART_ISLAND_SELECTION: true,
            OPTIMIZED_NAVIGATION: true,
          },
          isInitialized: true,
          lastUpdated: Date.now(),
        },
      },
    });

    mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
    
    // Mock vehicle service responses
    (vehicleService.getPopularVehicles as jest.Mock).mockResolvedValue([
      {
        vehicle: {
          id: '1',
          make: 'Toyota',
          model: 'Corolla',
          price_per_day: 45,
          rating: 4.5,
        },
        popularity: 85,
        distance: 5.2,
      },
    ]);

    (vehicleService.getRecommendedVehicles as jest.Mock).mockResolvedValue([]);

    // Clear mocks
    jest.clearAllMocks();
  });

  const renderEnhancedHomeScreen = () => {
    return render(
      <Provider store={store}>
        <NavigationContainer>
          <EnhancedHomeScreen navigation={mockNavigation as any} />
        </NavigationContainer>
      </Provider>
    );
  };

  describe('Feature Flag Integration', () => {
    it('should render when ENHANCED_HOME_SCREEN flag is enabled', () => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN';
      });

      const { getByTestId } = renderEnhancedHomeScreen();
      expect(getByTestId('enhanced-home-screen')).toBeTruthy();
    });

    it('should not render when ENHANCED_HOME_SCREEN flag is disabled', () => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return false; // All flags disabled
      });

      const { queryByTestId } = renderEnhancedHomeScreen();
      expect(queryByTestId('enhanced-home-screen')).toBeNull();
    });

    it('should show smart island features when SMART_ISLAND_SELECTION is enabled', () => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN' || flag === 'SMART_ISLAND_SELECTION';
      });

      const { getByText } = renderEnhancedHomeScreen();
      expect(getByText('Recommended Destinations')).toBeTruthy();
    });

    it('should show basic island features when SMART_ISLAND_SELECTION is disabled', () => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN';
      });

      const { getByText } = renderEnhancedHomeScreen();
      expect(getByText('Popular Destinations')).toBeTruthy();
    });
  });

  describe('Welcome Section', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN';
      });
    });

    it('should display welcome message', () => {
      const { getByText } = renderEnhancedHomeScreen();
      expect(getByText(/Welcome back/)).toBeTruthy();
      expect(getByText(/Ready for your next adventure/)).toBeTruthy();
    });

    it('should show location indicator when location is detected', async () => {
      const { getByText } = renderEnhancedHomeScreen();
      
      await waitFor(() => {
        expect(getByText(/Location detected/)).toBeTruthy();
      });
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN';
      });
    });

    it('should render all quick action cards', () => {
      const { getByTestId } = renderEnhancedHomeScreen();
      
      expect(getByTestId('quick-action-search')).toBeTruthy();
      expect(getByTestId('quick-action-bookings')).toBeTruthy();
      expect(getByTestId('quick-action-favorites')).toBeTruthy();
      expect(getByTestId('quick-action-map')).toBeTruthy();
    });

    it('should navigate to search when search action is pressed', () => {
      const { getByTestId } = renderEnhancedHomeScreen();
      
      fireEvent.press(getByTestId('quick-action-search'));
      expect(mockNavigate).toHaveBeenCalledWith('Search');
    });

    it('should navigate to map when map action is pressed', () => {
      const { getByTestId } = renderEnhancedHomeScreen();
      
      fireEvent.press(getByTestId('quick-action-map'));
      expect(mockNavigate).toHaveBeenCalledWith('Map');
    });
  });

  describe('Island Recommendations', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN' || flag === 'SMART_ISLAND_SELECTION';
      });
    });

    it('should render island cards', async () => {
      const { getByTestId } = renderEnhancedHomeScreen();
      
      await waitFor(() => {
        expect(getByTestId('island-card-Nassau')).toBeTruthy();
      });
    });

    it('should navigate to search with island when island card is pressed', async () => {
      const { getByTestId } = renderEnhancedHomeScreen();
      
      await waitFor(() => {
        const islandCard = getByTestId('island-card-Nassau');
        fireEvent.press(islandCard);
        expect(mockNavigate).toHaveBeenCalledWith('Search', { island: 'Nassau' });
      });
    });

    it('should show distance when location is available', async () => {
      const { getByText } = renderEnhancedHomeScreen();
      
      await waitFor(() => {
        expect(getByText(/km away/)).toBeTruthy();
      });
    });
  });

  describe('Popular Vehicles', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN';
      });
    });

    it('should load and display popular vehicles', async () => {
      const { getByTestId } = renderEnhancedHomeScreen();
      
      await waitFor(() => {
        expect(vehicleService.getPopularVehicles).toHaveBeenCalledWith(6);
        expect(getByTestId('popular-vehicle-1')).toBeTruthy();
      });
    });

    it('should navigate to vehicle detail when vehicle card is pressed', async () => {
      const { getByTestId } = renderEnhancedHomeScreen();
      
      await waitFor(() => {
        const vehicleCard = getByTestId('popular-vehicle-1');
        fireEvent.press(vehicleCard);
        expect(mockNavigate).toHaveBeenCalledWith('VehicleDetail', {
          vehicle: expect.objectContaining({
            id: '1',
            make: 'Toyota',
            model: 'Corolla',
          }),
        });
      });
    });

    it('should show "View All" link', () => {
      const { getByText } = renderEnhancedHomeScreen();
      expect(getByText('View All')).toBeTruthy();
    });

    it('should navigate to search when "View All" is pressed', () => {
      const { getByText } = renderEnhancedHomeScreen();
      
      fireEvent.press(getByText('View All'));
      expect(mockNavigate).toHaveBeenCalledWith('Search');
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN';
      });
    });

    it('should handle loading states gracefully', async () => {
      // Mock delayed response
      (vehicleService.getPopularVehicles as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const { getByTestId } = renderEnhancedHomeScreen();
      
      // Should render without crashing during loading
      expect(getByTestId('enhanced-home-screen')).toBeTruthy();
      
      await waitFor(() => {
        expect(vehicleService.getPopularVehicles).toHaveBeenCalled();
      });
    });

    it('should handle service errors gracefully', async () => {
      // Mock service error
      (vehicleService.getPopularVehicles as jest.Mock).mockRejectedValue(
        new Error('Service unavailable')
      );

      const { getByTestId } = renderEnhancedHomeScreen();
      
      // Should render without crashing even with service errors
      expect(getByTestId('enhanced-home-screen')).toBeTruthy();
      
      await waitFor(() => {
        expect(vehicleService.getPopularVehicles).toHaveBeenCalled();
      });
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN';
      });
    });

    it('should support pull-to-refresh', async () => {
      const { getByTestId } = renderEnhancedHomeScreen();
      const scrollView = getByTestId('enhanced-home-screen');
      
      // Simulate pull-to-refresh
      fireEvent(scrollView, 'refresh');
      
      await waitFor(() => {
        // Should call service methods again
        expect(vehicleService.getPopularVehicles).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Brownfield Safety', () => {
    it('should return null when feature flag is disabled', () => {
      mockUseFeatureFlag.mockImplementation(() => false);

      const { queryByTestId } = renderEnhancedHomeScreen();
      expect(queryByTestId('enhanced-home-screen')).toBeNull();
    });

    it('should not interfere with existing navigation patterns', () => {
      mockUseFeatureFlag.mockImplementation((flag: string) => {
        return flag === 'ENHANCED_HOME_SCREEN';
      });

      const { getByTestId } = renderEnhancedHomeScreen();
      
      // Should render enhanced screen
      expect(getByTestId('enhanced-home-screen')).toBeTruthy();
      
      // Navigation calls should use existing route names
      fireEvent.press(getByTestId('quick-action-search'));
      expect(mockNavigate).toHaveBeenCalledWith('Search');
    });
  });
});
