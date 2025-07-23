import React from 'react';
import { Text } from 'react-native';
import { 
  customRender, 
  createTestUser, 
  createTestVehicle, 
  createTestBooking,
  createMockNavigation,
  createMockRoute,
  measureRenderTime,
  getAccessibilityInfo
} from '../test-utils';

// Simple test component
const TestComponent: React.FC<{ testID?: string }> = ({ testID }) => (
  <Text testID={testID || 'test-component'}>Test Component</Text>
);

describe('Test Utils', () => {
  describe('Performance Polyfill', () => {
    it('should have performance.now available', () => {
      expect(typeof performance.now).toBe('function');
      expect(typeof performance.now()).toBe('number');
    });

    it('should measure render time', async () => {
      const renderTime = await measureRenderTime(() => {
        customRender(<TestComponent />);
      });
      
      expect(typeof renderTime).toBe('number');
      expect(renderTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Custom Render', () => {
    it('should render component with providers', () => {
      const { getByTestId } = customRender(<TestComponent />);
      expect(getByTestId('test-component')).toBeTruthy();
    });

    it('should render with custom store', () => {
      const preloadedState = { test: 'value' };
      const { store } = customRender(<TestComponent />, { preloadedState });
      
      expect(store).toBeDefined();
      expect(store.getState()).toEqual(expect.objectContaining(preloadedState));
    });
  });

  describe('Mock Factories', () => {
    it('should create test user with defaults', () => {
      const user = createTestUser();
      
      expect(user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        profileImageUrl: null,
        isVerified: false,
      });
    });

    it('should create test user with overrides', () => {
      const user = createTestUser({ name: 'Custom User', isVerified: true });
      
      expect(user.name).toBe('Custom User');
      expect(user.isVerified).toBe(true);
      expect(user.email).toBe('test@example.com'); // Default preserved
    });

    it('should create test vehicle', () => {
      const vehicle = createTestVehicle();
      
      expect(vehicle).toEqual({
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        pricePerHour: 25,
        location: 'Test Location',
        isAvailable: true,
        ownerId: '1',
      });
    });

    it('should create test booking', () => {
      const booking = createTestBooking();
      
      expect(booking).toEqual({
        id: '1',
        vehicleId: '1',
        userId: '1',
        startDate: expect.any(String),
        endDate: expect.any(String),
        totalCost: 100,
        status: 'confirmed',
      });
    });
  });

  describe('Mock Navigation', () => {
    it('should create mock navigation with all methods', () => {
      const navigation = createMockNavigation();
      
      expect(navigation.navigate).toBeInstanceOf(Function);
      expect(navigation.goBack).toBeInstanceOf(Function);
      expect(navigation.dispatch).toBeInstanceOf(Function);
      expect(navigation.reset).toBeInstanceOf(Function);
    });

    it('should create mock route', () => {
      const route = createMockRoute({ userId: '123' });
      
      expect(route).toEqual({
        key: 'test-route',
        name: 'TestScreen',
        params: { userId: '123' },
      });
    });
  });

  describe('Accessibility Helpers', () => {
    it('should get accessibility info for existing element', () => {
      const { getByTestId } = customRender(
        <TestComponent testID="accessible-component" />
      );
      
      const accessibilityInfo = getAccessibilityInfo('accessible-component', getByTestId);
      
      expect(accessibilityInfo).toEqual({
        accessibilityLabel: undefined,
        accessibilityHint: undefined,
        accessibilityRole: undefined,
        accessibilityState: undefined,
        testID: 'accessible-component',
      });
    });

    it('should return null for non-existent element', () => {
      const { getByTestId } = customRender(<TestComponent />);
      
      const accessibilityInfo = getAccessibilityInfo('non-existent', getByTestId);
      
      expect(accessibilityInfo).toBeNull();
    });
  });
});
