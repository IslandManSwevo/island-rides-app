import React from 'react';
import { TouchableOpacity } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { VehicleCard } from '../VehicleCard';
import { ThemeProvider } from '../../context/ThemeContext';
import { Vehicle } from '../../types';

// FavoriteButton performs async API work; it is tested separately.
jest.mock('../FavoriteButton', () => ({
  FavoriteButton: () => null,
}));

const baseVehicle: Vehicle = {
  id: 1,
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  ownerId: 1,
  location: 'Nassau',
  dailyRate: 75,
  available: true,
  driveSide: 'LHD',
  createdAt: '2026-01-01T00:00:00Z',
  vehicleType: 'sedan',
  verificationStatus: 'verified',
  conditionRating: 4.5,
  deliveryAvailable: true,
  airportPickup: true,
  averageRating: 4.8,
  totalReviews: 120,
  photos: [
    {
      id: 1,
      vehicleId: 1,
      photoUrl: 'https://example.com/camry.jpg',
      photoType: 'exterior',
      displayOrder: 1,
      isPrimary: true,
      uploadedAt: '2026-01-01T00:00:00Z',
    },
  ],
  features: [
    { id: 1, categoryId: 1, name: 'A/C', description: 'Air conditioning', iconName: 'snow', isPremium: false, displayOrder: 1 },
    { id: 2, categoryId: 1, name: 'Bluetooth', description: 'Wireless audio', iconName: 'bluetooth', isPremium: false, displayOrder: 2 },
    { id: 3, categoryId: 2, name: 'Backup camera', description: 'Rear view', iconName: 'camera', isPremium: false, displayOrder: 3 },
    { id: 4, categoryId: 2, name: 'Sunroof', description: 'Glass roof', iconName: 'sunny', isPremium: true, displayOrder: 4 },
  ],
};

const renderCard = (vehicle: Vehicle, onPress?: () => void) =>
  render(
    <ThemeProvider>
      <VehicleCard vehicle={vehicle} onPress={onPress} />
    </ThemeProvider>
  );

describe('VehicleCard (2026 kit)', () => {
  it('renders make/model, year line, and location', () => {
    renderCard(baseVehicle);
    expect(screen.getByText('Toyota Camry')).toBeTruthy();
    expect(screen.getByText('2022 • sedan')).toBeTruthy();
    expect(screen.getByText('Nassau')).toBeTruthy();
  });

  it('renders the daily price with a per-day unit', () => {
    renderCard(baseVehicle);
    expect(screen.getByText('$75')).toBeTruthy();
    expect(screen.getByText('per day')).toBeTruthy();
  });

  it('shows the drive-side badge', () => {
    renderCard(baseVehicle);
    expect(screen.getByText('LHD')).toBeTruthy();
  });

  it('shows the Verified badge when the vehicle is verified', () => {
    renderCard(baseVehicle);
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('does not show the Verified badge when verificationStatus is not verified', () => {
    renderCard({ ...baseVehicle, verificationStatus: 'pending' });
    expect(screen.queryByText('Verified')).toBeNull();
  });

  it('shows condition rating with the mapped condition text', () => {
    renderCard(baseVehicle); // 4.5 -> Excellent
    expect(screen.getByText('Condition:')).toBeTruthy();
    expect(screen.getByText('(Excellent)')).toBeTruthy();
  });

  it('renders up to three feature tags plus a +N more tag', () => {
    renderCard(baseVehicle);
    expect(screen.getByText('A/C')).toBeTruthy();
    expect(screen.getByText('Bluetooth')).toBeTruthy();
    expect(screen.getByText('Backup camera')).toBeTruthy();
    expect(screen.queryByText('Sunroof')).toBeNull();
    expect(screen.getByText('+1 more')).toBeTruthy();
  });

  it('renders delivery and airport service labels when available', () => {
    renderCard(baseVehicle);
    expect(screen.getByText('Delivery')).toBeTruthy();
    expect(screen.getByText('Airport')).toBeTruthy();
  });

  it('renders the rating and review count when provided', () => {
    renderCard(baseVehicle);
    // 4.8 appears twice: the card social-proof rating and the reviews row.
    expect(screen.getAllByText('4.8').length).toBeGreaterThan(0);
    expect(screen.getByText('(120 reviews)')).toBeTruthy();
  });

  it('hides advanced info in compact mode', () => {
    render(
      <ThemeProvider>
        <VehicleCard vehicle={baseVehicle} compact />
      </ThemeProvider>
    );
    expect(screen.queryByText('Condition:')).toBeNull();
    expect(screen.queryByText('Delivery')).toBeNull();
  });

  it('calls onPress when the card is pressed', () => {
    const onPress = jest.fn();
    renderCard(baseVehicle, onPress);
    // UNSAFE_getByType matches the host TouchableOpacity at runtime but isn't
    // part of this @testing-library/react-native version's Screen typings.
    fireEvent.press((screen as any).UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes an accessibility label combining make, model and year', () => {
    renderCard(baseVehicle);
    expect(screen.getByLabelText('Vehicle: Toyota Camry 2022')).toBeTruthy();
  });
});
