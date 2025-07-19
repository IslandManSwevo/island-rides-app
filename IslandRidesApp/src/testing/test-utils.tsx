import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { ReactTestInstance } from 'react-test-renderer';
import { ThemeProvider } from 'styled-components/native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import theme from '../styles/theme';

// Mock store for testing
const createMockStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      // Add your reducers here when implementing Redux
    },
    preloadedState,
  });
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Record<string, unknown>;
  store?: ReturnType<typeof createMockStore>;
  navigationProps?: Record<string, unknown>;
}

const AllTheProviders: React.FC<{
  children: React.ReactNode;
  store?: ReturnType<typeof createMockStore>;
  navigationProps?: Record<string, unknown>;
}> = ({ children, store, navigationProps }) => {
  return (
    <Provider store={store || createMockStore()}>
      <ThemeProvider theme={theme}>
        <NavigationContainer {...navigationProps}>
          {children}
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
};

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { preloadedState, store, navigationProps, ...renderOptions } = options;
  
  const mockStore = store || createMockStore(preloadedState);
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders store={mockStore} navigationProps={navigationProps}>
      {children}
    </AllTheProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store: mockStore,
  };
};

// Mock navigation helpers
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
});

export const createMockRoute = (params = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  params,
});

// Mock API service
export const createMockApiService = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  uploadFile: jest.fn(),
});

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  profileImageUrl: null,
  isVerified: false,
  ...overrides,
});

export const createTestVehicle = (overrides = {}) => ({
  id: '1',
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  pricePerHour: 25,
  location: 'Test Location',
  isAvailable: true,
  ownerId: '1',
  ...overrides,
});

export const createTestBooking = (overrides = {}) => ({
  id: '1',
  vehicleId: '1',
  userId: '1',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  totalCost: 100,
  status: 'confirmed',
  ...overrides,
});

// Accessibility test helpers
export const checkAccessibilityProps = (element: ReactTestInstance) => {
  const accessibilityProps = [
    'accessibilityLabel',
    'accessibilityHint',
    'accessibilityRole',
    'accessibilityState',
    'testID',
  ];
  
  return accessibilityProps.reduce((acc, prop) => {
    acc[prop] = element.props[prop] || null;
    return acc;
  }, {} as Record<string, unknown>);
};

// Performance test helpers
export const measureRenderTime = async (renderFunction: () => void) => {
  const start = performance.now();
  renderFunction();
  const end = performance.now();
  return end - start;
};

// Mock async storage
export const createMockAsyncStorage = () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
});

// Export everything needed for tests
export * from '@testing-library/react-native';
export { customRender as render };