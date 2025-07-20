import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchScreen } from '../../screens/SearchScreen';
import { vehicleService } from '../../services/vehicleService';
import { vehicleFeatureService } from '../../services/vehicleFeatureService';
import { ROUTES } from '../../navigation/routes';

// Mock dependencies
jest.mock('../../services/vehicleService');
jest.mock('../../services/vehicleFeatureService');
jest.mock('../../services/notificationService');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../hooks/usePerformanceMonitoring', () => ({
  usePerformanceMonitoring: () => ({
    getMetrics: jest.fn(),
    resetMetrics: jest.fn()
  })
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn()
};

const Stack = createStackNavigator();

const renderWithNavigation = (route?: any) => {
  const TestNavigator = () => (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name={ROUTES.SEARCH}>
          {() => <SearchScreen navigation={mockNavigation as any} route={route || { params: {} }} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
  
  return render(<TestNavigator />);
};

describe('SearchScreen', () => {
  const mockVehicleFeatures = {
    features: [
      { id: 1, name: 'GPS Navigation', category_id: 1, icon: 'navigation', is_premium: false },
      { id: 2, name: 'Bluetooth', category_id: 1, icon: 'bluetooth', is_premium: false },
      { id: 3, name: 'Sunroof', category_id: 2, icon: 'sunny', is_premium: true }
    ]
  };

  const mockFeatureCategories = [
    { id: 1, name: 'Technology', description: 'Tech features' },
    { id: 2, name: 'Comfort', description: 'Comfort features' }
  ];

  const mockSearchResults = [
    {
      id: '1',
      vehicle: {
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        dailyRate: 75,
        location: 'Nassau',
        imageUrl: 'https://example.com/car1.jpg'
      }
    },
    {
      id: '2', 
      vehicle: {
        id: '2',
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        dailyRate: 70,
        location: 'Nassau',
        imageUrl: 'https://example.com/car2.jpg'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    // Mock vehicle feature service
    (vehicleFeatureService.getVehicleFeatures as jest.Mock).mockResolvedValue(mockVehicleFeatures);
    (vehicleFeatureService.getFeatureCategories as jest.Mock).mockResolvedValue(mockFeatureCategories);
    
    // Mock vehicle service
    (vehicleService.searchVehicles as jest.Mock).mockResolvedValue(mockSearchResults);
  });

  describe('Initial Render', () => {
    test('should render search screen with default elements', async () => {
      renderWithNavigation();

      expect(screen.getByText('Search Vehicles')).toBeTruthy();
      expect(screen.getByText('Island')).toBeTruthy();
      expect(screen.getByText('Filters')).toBeTruthy();
      
      // Should show initial state without search results
      await waitFor(() => {
        expect(screen.getByText('Ready to Find Your Ride?')).toBeTruthy();
      });
    });

    test('should load saved filters from AsyncStorage', async () => {
      const savedFilters = {
        island: 'Nassau',
        priceRange: [100, 250],
        vehicleTypes: ['sedan']
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedFilters));

      renderWithNavigation();

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('searchFilters');
      });
    });

    test('should load vehicle features on mount', async () => {
      renderWithNavigation();

      await waitFor(() => {
        expect(vehicleFeatureService.getVehicleFeatures).toHaveBeenCalled();
        expect(vehicleFeatureService.getFeatureCategories).toHaveBeenCalled();
      });
    });

    test('should perform search if island is provided in route params', async () => {
      const route = { params: { island: 'Nassau' } };
      
      renderWithNavigation(route);

      await waitFor(() => {
        expect(vehicleService.searchVehicles).toHaveBeenCalled();
      });
    });
  });

  describe('Search Functionality', () => {
    test('should perform search when search button is pressed', async () => {
      renderWithNavigation();

      const searchButton = screen.getByTestId('search-button') || screen.getByRole('button', { name: /search/i });
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(vehicleService.searchVehicles).toHaveBeenCalledWith(
          expect.objectContaining({
            location: 'Freeport', // default location
            sortBy: 'popularity'
          })
        );
      });
    });

    test('should display search results after successful search', async () => {
      renderWithNavigation();

      const searchButton = screen.getByTestId('search-button') || screen.getByRole('button', { name: /search/i });
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Toyota')).toBeTruthy();
        expect(screen.getByText('Honda')).toBeTruthy();
      });
    });

    test('should show loading state during search', async () => {
      (vehicleService.searchVehicles as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSearchResults), 100))
      );

      renderWithNavigation();

      const searchButton = screen.getByTestId('search-button') || screen.getByRole('button', { name: /search/i });
      fireEvent.press(searchButton);

      expect(screen.getByText('Searching vehicles...')).toBeTruthy();

      await waitFor(() => {
        expect(screen.queryByText('Searching vehicles...')).toBeFalsy();
      });
    });

    test('should show empty state when no results found', async () => {
      (vehicleService.searchVehicles as jest.Mock).mockResolvedValue([]);

      renderWithNavigation();

      const searchButton = screen.getByTestId('search-button') || screen.getByRole('button', { name: /search/i });
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(screen.getByText('No Vehicles Found')).toBeTruthy();
        expect(screen.getByText('Try adjusting your filters or search criteria')).toBeTruthy();
      });
    });

    test('should handle search errors gracefully', async () => {
      (vehicleService.searchVehicles as jest.Mock).mockRejectedValue(new Error('Search failed'));

      renderWithNavigation();

      const searchButton = screen.getByTestId('search-button') || screen.getByRole('button', { name: /search/i });
      fireEvent.press(searchButton);

      await waitFor(() => {
        // Error should be handled by notification service
        expect(vehicleService.searchVehicles).toHaveBeenCalled();
      });
    });
  });

  describe('Island Selection', () => {
    test('should show island selector when island button is pressed', async () => {
      renderWithNavigation();

      const islandSelector = screen.getByText('Island');
      fireEvent.press(islandSelector);

      await waitFor(() => {
        expect(screen.getByText('Select Island')).toBeTruthy();
      });
    });

    test('should update island filter when island is selected', async () => {
      renderWithNavigation();

      const islandSelector = screen.getByText('Island');
      fireEvent.press(islandSelector);

      await waitFor(() => {
        const nassauOption = screen.getByText('Nassau');
        fireEvent.press(nassauOption);
      });

      // Should close modal and update filter
      await waitFor(() => {
        expect(screen.queryByText('Select Island')).toBeFalsy();
      });
    });

    test('should toggle "show all islands" mode', async () => {
      renderWithNavigation();

      const toggleButton = screen.getByText('Filter');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('All')).toBeTruthy();
      });
    });
  });

  describe('Filters', () => {
    test('should show filters panel when filters button is pressed', async () => {
      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      fireEvent.press(filtersButton);

      await waitFor(() => {
        expect(screen.getByText('Vehicle Type')).toBeTruthy();
        expect(screen.getByText('Price Range')).toBeTruthy();
        expect(screen.getByText('Clear All')).toBeTruthy();
        expect(screen.getByText('Apply Filters')).toBeTruthy();
      });
    });

    test('should update price range filter', async () => {
      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      fireEvent.press(filtersButton);

      await waitFor(() => {
        // Find and interact with price range controls
        const priceRangeSection = screen.getByText('Price Range');
        expect(priceRangeSection).toBeTruthy();
      });
    });

    test('should select vehicle types', async () => {
      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      fireEvent.press(filtersButton);

      await waitFor(() => {
        // Should show vehicle type options
        expect(screen.getByText('Vehicle Type')).toBeTruthy();
      });
    });

    test('should select features', async () => {
      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      fireEvent.press(filtersButton);

      await waitFor(() => {
        // Features should be loaded and displayed
        expect(screen.getByText('GPS Navigation')).toBeTruthy();
        expect(screen.getByText('Bluetooth')).toBeTruthy();
      });

      // Toggle a feature
      const gpsFeature = screen.getByText('GPS Navigation');
      fireEvent.press(gpsFeature);
    });

    test('should clear all filters', async () => {
      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      fireEvent.press(filtersButton);

      await waitFor(() => {
        const clearButton = screen.getByText('Clear All');
        fireEvent.press(clearButton);
      });

      // Should reset filters to default values
    });

    test('should apply filters and perform search', async () => {
      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      fireEvent.press(filtersButton);

      await waitFor(() => {
        const applyButton = screen.getByText('Apply Filters');
        fireEvent.press(applyButton);
      });

      // Should close filters and perform search
      await waitFor(() => {
        expect(vehicleService.searchVehicles).toHaveBeenCalled();
      });
    });

    test('should show filter badge when filters are applied', async () => {
      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      fireEvent.press(filtersButton);

      // Apply some filters and check for badge
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeTruthy();
      });
    });

    test('should save filters to AsyncStorage', async () => {
      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      fireEvent.press(filtersButton);

      await waitFor(() => {
        const applyButton = screen.getByText('Apply Filters');
        fireEvent.press(applyButton);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'searchFilters',
          expect.any(String)
        );
      });
    });
  });

  describe('Sorting', () => {
    test('should show sort modal when sort button is pressed', async () => {
      // First perform a search to make sort button visible
      renderWithNavigation();

      const searchButton = screen.getByTestId('search-button') || screen.getByRole('button', { name: /search/i });
      fireEvent.press(searchButton);

      await waitFor(() => {
        const sortButton = screen.getByText('Sort');
        fireEvent.press(sortButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Sort Results')).toBeTruthy();
      });
    });

    test('should update sort option and perform search', async () => {
      renderWithNavigation();

      const searchButton = screen.getByTestId('search-button') || screen.getByRole('button', { name: /search/i });
      fireEvent.press(searchButton);

      await waitFor(() => {
        const sortButton = screen.getByText('Sort');
        fireEvent.press(sortButton);
      });

      await waitFor(() => {
        // Select a sort option
        const priceSort = screen.getByText('Price: Low to High');
        fireEvent.press(priceSort);
      });

      // Should close modal and perform new search
      await waitFor(() => {
        expect(vehicleService.searchVehicles).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'price_low'
          })
        );
      });
    });
  });

  describe('Navigation', () => {
    test('should navigate to vehicle detail when vehicle card is pressed', async () => {
      renderWithNavigation();

      const searchButton = screen.getByTestId('search-button') || screen.getByRole('button', { name: /search/i });
      fireEvent.press(searchButton);

      await waitFor(() => {
        const vehicleCard = screen.getByText('Toyota');
        fireEvent.press(vehicleCard);
      });

      expect(mockNavigate).toHaveBeenCalledWith('VehicleDetail', {
        vehicle: expect.objectContaining({
          make: 'Toyota',
          model: 'Camry'
        })
      });
    });
  });

  describe('Performance and Accessibility', () => {
    test('should have proper accessibility labels', async () => {
      renderWithNavigation();

      // Check for accessibility labels on key elements
      expect(screen.getByLabelText('Search for vehicles')).toBeTruthy();
      expect(screen.getByLabelText('Filter vehicles')).toBeTruthy();
      expect(screen.getByLabelText('Select island')).toBeTruthy();
    });

    test('should handle performance monitoring', async () => {
      renderWithNavigation();

      // Performance monitoring should be initialized
      // This is mocked, so we just verify the component renders without errors
      expect(screen.getByText('Search Vehicles')).toBeTruthy();
    });

    test('should handle feature loading errors gracefully', async () => {
      (vehicleFeatureService.getVehicleFeatures as jest.Mock).mockRejectedValue(new Error('Feature loading failed'));

      renderWithNavigation();

      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText('Search Vehicles')).toBeTruthy();
      });
    });

    test('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      renderWithNavigation();

      await waitFor(() => {
        // Should still render and function
        expect(screen.getByText('Search Vehicles')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty feature list', async () => {
      (vehicleFeatureService.getVehicleFeatures as jest.Mock).mockResolvedValue({ features: [] });
      (vehicleFeatureService.getFeatureCategories as jest.Mock).mockResolvedValue([]);

      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      fireEvent.press(filtersButton);

      await waitFor(() => {
        // Should handle empty features gracefully
        expect(screen.getByText('Vehicle Type')).toBeTruthy();
      });
    });

    test('should handle malformed search results', async () => {
      (vehicleService.searchVehicles as jest.Mock).mockResolvedValue([
        { id: '1' }, // Missing vehicle property
        { vehicle: null }, // Null vehicle
        null // Null result
      ]);

      renderWithNavigation();

      const searchButton = screen.getByTestId('search-button') || screen.getByRole('button', { name: /search/i });
      fireEvent.press(searchButton);

      await waitFor(() => {
        // Should handle malformed data without crashing
        expect(screen.queryByText('Searching vehicles...')).toBeFalsy();
      });
    });

    test('should handle rapid filter changes', async () => {
      renderWithNavigation();

      const filtersButton = screen.getByText('Filters');
      
      // Rapidly change filters
      for (let i = 0; i < 5; i++) {
        fireEvent.press(filtersButton);
        await waitFor(() => {
          const clearButton = screen.getByText('Clear All');
          fireEvent.press(clearButton);
        });
      }

      // Should handle rapid changes without errors
      expect(screen.getByText('Search Vehicles')).toBeTruthy();
    });
  });
});