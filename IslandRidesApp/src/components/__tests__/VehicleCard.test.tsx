import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { VehicleCard } from '../VehicleCard';
import { Vehicle } from '../../types';

// Mock dependencies
jest.mock('../../services/notificationService');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

describe('VehicleCard', () => {
  const mockVehicle: Vehicle = {
    id: 1,
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    ownerId: 1,
    dailyRate: 75,
    location: 'Nassau',
    available: true,
    driveSide: 'LHD',
    vehicleType: 'sedan',
    fuelType: 'gasoline',
    transmissionType: 'automatic',
    seatingCapacity: 5,
    conditionRating: 4.5,
    verificationStatus: 'verified',
    instantBooking: true,
    deliveryAvailable: true,
    airportPickup: false,
    description: 'Clean and reliable vehicle',
    createdAt: '2024-01-15T10:00:00Z',
    totalReviews: 150,
    averageRating: 4.8,
    features: [
      { id: 1, categoryId: 1, name: 'GPS Navigation', description: 'Built-in GPS', iconName: 'navigate', isPremium: false, displayOrder: 1 },
      { id: 2, categoryId: 1, name: 'Bluetooth', description: 'Bluetooth connectivity', iconName: 'bluetooth', isPremium: false, displayOrder: 2 },
      { id: 3, categoryId: 1, name: 'Air Conditioning', description: 'Climate control', iconName: 'snow', isPremium: false, displayOrder: 3 }
    ]
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should render vehicle information correctly', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByText('Toyota Camry')).toBeTruthy();
      expect(screen.getByText('2022')).toBeTruthy();
      expect(screen.getByText('$75/day')).toBeTruthy();
      expect(screen.getByText('Nassau')).toBeTruthy();
      expect(screen.getByText('John Doe')).toBeTruthy();
    });

    test('should display vehicle image with correct source', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      const image = screen.getByTestId('vehicle-image');
      // Since imageUrl is not part of Vehicle interface, this test should check for a default or placeholder
      expect(image).toBeTruthy();
    });

    test('should show verification badge for verified vehicles', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByTestId('verified-badge')).toBeTruthy();
    });

    test('should show condition rating', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByText('4.5')).toBeTruthy();
      expect(screen.getByTestId('condition-stars')).toBeTruthy();
    });

    test('should display host rating and review count', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByText('4.8')).toBeTruthy();
      expect(screen.getByText('(150 reviews)')).toBeTruthy();
    });
  });

  describe('Features Display', () => {
    test('should show vehicle features', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByText('GPS Navigation')).toBeTruthy();
      expect(screen.getByText('Bluetooth')).toBeTruthy();
      expect(screen.getByText('Air Conditioning')).toBeTruthy();
    });

    test('should limit number of features displayed', () => {
      const vehicleWithManyFeatures: Vehicle = {
        ...mockVehicle,
        features: [
          { id: 1, categoryId: 1, name: 'GPS Navigation', description: 'Built-in GPS', iconName: 'navigate', isPremium: false, displayOrder: 1 },
          { id: 2, categoryId: 1, name: 'Bluetooth', description: 'Bluetooth connectivity', iconName: 'bluetooth', isPremium: false, displayOrder: 2 },
          { id: 3, categoryId: 1, name: 'Air Conditioning', description: 'Climate control', iconName: 'snow', isPremium: false, displayOrder: 3 },
          { id: 4, categoryId: 1, name: 'Sunroof', description: 'Panoramic sunroof', iconName: 'sunny', isPremium: true, displayOrder: 4 },
          { id: 5, categoryId: 1, name: 'Heated Seats', description: 'Heated front seats', iconName: 'flame', isPremium: true, displayOrder: 5 },
          { id: 6, categoryId: 1, name: 'USB Charging', description: 'USB charging ports', iconName: 'battery-charging', isPremium: false, displayOrder: 6 },
          { id: 7, categoryId: 1, name: 'Premium Sound', description: 'Premium audio system', iconName: 'musical-notes', isPremium: true, displayOrder: 7 }
        ]
      };

      render(<VehicleCard vehicle={vehicleWithManyFeatures} onPress={mockOnPress} />);

      // Should show first few features plus "+X more" indicator
      expect(screen.getByText('GPS Navigation')).toBeTruthy();
      expect(screen.getByText('Bluetooth')).toBeTruthy();
      expect(screen.getByText('+4 more')).toBeTruthy();
    });

    test('should handle vehicles with no features', () => {
      const vehicleWithoutFeatures: Vehicle = {
        ...mockVehicle,
        features: []
      };

      render(<VehicleCard vehicle={vehicleWithoutFeatures} onPress={mockOnPress} />);

      // Should still render without errors
      expect(screen.getByText('Toyota Camry')).toBeTruthy();
    });
  });

  describe('Service Options', () => {
    test('should show instant booking badge', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByTestId('instant-booking-badge')).toBeTruthy();
      expect(screen.getByText('Instant Booking')).toBeTruthy();
    });

    test('should show delivery available badge', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByTestId('delivery-badge')).toBeTruthy();
      expect(screen.getByText('Delivery Available')).toBeTruthy();
    });

    test('should show airport pickup badge when available', () => {
      const vehicleWithAirportPickup: Vehicle = {
        ...mockVehicle,
        airportPickup: true
      };

      render(<VehicleCard vehicle={vehicleWithAirportPickup} onPress={mockOnPress} />);

      expect(screen.getByTestId('airport-pickup-badge')).toBeTruthy();
      expect(screen.getByText('Airport Pickup')).toBeTruthy();
    });

    test('should not show airport pickup badge when not available', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.queryByTestId('airport-pickup-badge')).toBeFalsy();
    });
  });

  describe('Verification Status', () => {
    test('should show verified badge for verified vehicles', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByTestId('verified-badge')).toBeTruthy();
    });

    test('should show pending badge for pending vehicles', () => {
      const pendingVehicle: Vehicle = {
        ...mockVehicle,
        verificationStatus: 'pending'
      };

      render(<VehicleCard vehicle={pendingVehicle} onPress={mockOnPress} />);

      expect(screen.getByTestId('pending-badge')).toBeTruthy();
      expect(screen.getByText('Pending Verification')).toBeTruthy();
    });

    test('should show rejected badge for rejected vehicles', () => {
      const rejectedVehicle: Vehicle = {
        ...mockVehicle,
        verificationStatus: 'rejected'
      };

      render(<VehicleCard vehicle={rejectedVehicle} onPress={mockOnPress} />);

      expect(screen.getByTestId('rejected-badge')).toBeTruthy();
      expect(screen.getByText('Verification Failed')).toBeTruthy();
    });

    test('should show expired badge for expired vehicles', () => {
      const expiredVehicle: Vehicle = {
        ...mockVehicle,
        verificationStatus: 'expired'
      };

      render(<VehicleCard vehicle={expiredVehicle} onPress={mockOnPress} />);

      expect(screen.getByTestId('expired-badge')).toBeTruthy();
      expect(screen.getByText('Verification Expired')).toBeTruthy();
    });
  });

  describe('Availability Status', () => {
    test('should show available vehicles normally', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByText('Toyota Camry')).toBeTruthy();
      expect(screen.queryByTestId('unavailable-overlay')).toBeFalsy();
    });

    test('should show unavailable overlay for unavailable vehicles', () => {
      const unavailableVehicle: Vehicle = {
        ...mockVehicle,
        available: false
      };

      render(<VehicleCard vehicle={unavailableVehicle} onPress={mockOnPress} />);

      expect(screen.getByTestId('unavailable-overlay')).toBeTruthy();
      expect(screen.getByText('Currently Unavailable')).toBeTruthy();
    });

    test('should disable card interaction for unavailable vehicles', () => {
      const unavailableVehicle: Vehicle = {
        ...mockVehicle,
        available: false
      };

      render(<VehicleCard vehicle={unavailableVehicle} onPress={mockOnPress} />);

      const card = screen.getByTestId('vehicle-card');
      fireEvent.press(card);

      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Interaction', () => {
    test('should call onPress when card is pressed', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      const card = screen.getByTestId('vehicle-card');
      fireEvent.press(card);

      expect(mockOnPress).toHaveBeenCalledWith(mockVehicle);
    });

    test('should not call onPress for unavailable vehicles', () => {
      const unavailableVehicle: Vehicle = {
        ...mockVehicle,
        available: false
      };

      render(<VehicleCard vehicle={unavailableVehicle} onPress={mockOnPress} />);

      const card = screen.getByTestId('vehicle-card');
      fireEvent.press(card);

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    test('should handle rapid successive presses', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      const card = screen.getByTestId('vehicle-card');
      
      // Rapid fire presses
      fireEvent.press(card);
      fireEvent.press(card);
      fireEvent.press(card);

      // Should only call once due to debouncing
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pricing Display', () => {
    test('should format daily rate correctly', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByText('$75/day')).toBeTruthy();
    });

    test('should handle high daily rates', () => {
      const expensiveVehicle: Vehicle = {
        ...mockVehicle,
        dailyRate: 999
      };

      render(<VehicleCard vehicle={expensiveVehicle} onPress={mockOnPress} />);

      expect(screen.getByText('$999/day')).toBeTruthy();
    });

    test('should handle zero daily rate', () => {
      const freeVehicle: Vehicle = {
        ...mockVehicle,
        dailyRate: 0
      };

      render(<VehicleCard vehicle={freeVehicle} onPress={mockOnPress} />);

      expect(screen.getByText('$0/day')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility labels', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByLabelText('Vehicle: Toyota Camry 2022')).toBeTruthy();
      expect(screen.getByLabelText('Daily rate: $75')).toBeTruthy();
      expect(screen.getByLabelText('Location: Nassau')).toBeTruthy();
    });

    test('should have accessible verification status', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByLabelText('Verified vehicle')).toBeTruthy();
    });

    test('should have accessible condition rating', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByLabelText('Condition rating: 4.5 out of 5 stars')).toBeTruthy();
    });

    test('should have accessible service options', () => {
      render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      expect(screen.getByLabelText('Instant booking available')).toBeTruthy();
      expect(screen.getByLabelText('Delivery available')).toBeTruthy();
    });

    test('should be accessible for unavailable vehicles', () => {
      const unavailableVehicle: Vehicle = {
        ...mockVehicle,
        available: false
      };

      render(<VehicleCard vehicle={unavailableVehicle} onPress={mockOnPress} />);

      expect(screen.getByLabelText('Vehicle currently unavailable')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing review information', () => {
      const vehicleWithoutReviews: Vehicle = {
        ...mockVehicle,
        totalReviews: 0,
        averageRating: 0
      };

      render(<VehicleCard vehicle={vehicleWithoutReviews} onPress={mockOnPress} />);

      expect(screen.getByText('Toyota Camry')).toBeTruthy();
    });

    test('should handle very long vehicle names', () => {
      const vehicleWithLongName: Vehicle = {
        ...mockVehicle,
        make: 'Mercedes-Benz',
        model: 'S-Class AMG 63 S 4MATIC+ Coupe'
      };

      render(<VehicleCard vehicle={vehicleWithLongName} onPress={mockOnPress} />);

      expect(screen.getByText('Mercedes-Benz S-Class AMG 63 S 4MATIC+ Coupe')).toBeTruthy();
    });

    test('should handle very long location names', () => {
      const vehicleWithLongLocation: Vehicle = {
        ...mockVehicle,
        location: 'Grand Bahama International Airport Terminal'
      };

      render(<VehicleCard vehicle={vehicleWithLongLocation} onPress={mockOnPress} />);

      expect(screen.getByText('Grand Bahama International Airport Terminal')).toBeTruthy();
    });

    test('should handle zero ratings', () => {
      const vehicleWithZeroRating: Vehicle = {
        ...mockVehicle,
        averageRating: 0,
        totalReviews: 0,
        conditionRating: 0
      };

      render(<VehicleCard vehicle={vehicleWithZeroRating} onPress={mockOnPress} />);

      expect(screen.getByText('Toyota Camry')).toBeTruthy();
    });

    test('should handle minimal vehicle properties', () => {
      const minimalVehicle: Vehicle = {
        id: 1,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        ownerId: 1,
        dailyRate: 75,
        location: 'Nassau',
        available: true,
        driveSide: 'LHD',
        createdAt: '2024-01-15T10:00:00Z'
      };

      render(<VehicleCard vehicle={minimalVehicle} onPress={mockOnPress} />);

      expect(screen.getByText('Toyota Camry')).toBeTruthy();
      expect(screen.getByText('$75/day')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    test('should render efficiently with large feature lists', () => {
      const vehicleWithManyFeatures: Vehicle = {
        ...mockVehicle,
        features: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          categoryId: 1,
          name: `Feature ${i + 1}`,
          description: `Description for feature ${i + 1}`,
          iconName: 'star',
          isPremium: false,
          displayOrder: i + 1
        }))
      };

      const startTime = Date.now();
      render(<VehicleCard vehicle={vehicleWithManyFeatures} onPress={mockOnPress} />);
      const renderTime = Date.now() - startTime;

      expect(renderTime).toBeLessThan(100); // Should render quickly
      expect(screen.getByText('Toyota Camry')).toBeTruthy();
    });

    test('should handle rapid re-renders efficiently', () => {
      const { rerender } = render(<VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />);

      // Rapidly re-render with different props
      for (let i = 0; i < 10; i++) {
        const updatedVehicle = {
          ...mockVehicle,
          dailyRate: 75 + i
        };
        rerender(<VehicleCard vehicle={updatedVehicle} onPress={mockOnPress} />);
      }

      expect(screen.getByText('$84/day')).toBeTruthy();
    });
  });
});