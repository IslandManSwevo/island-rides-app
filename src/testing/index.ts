// Testing utilities and templates
import React from 'react';
import { render } from '@testing-library/react-native';
// Note: You need to install @testing-library/react-native first:
// npm install --save-dev @testing-library/react-native
import { ApiResponse } from '../types';

export * from './test-utils';

// Test templates (for reference, not for runtime import)
// Copy these templates to create your actual tests:
// - component-test-template.tsx: Template for testing React components
// - screen-test-template.tsx: Template for testing screen components
// - service-test-template.tsx: Template for testing service classes

// Common test helpers
export const mockTimers = () => {
  jest.useFakeTimers();
  return () => jest.useRealTimers();
};

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

export const waitForNextTick = () => new Promise(resolve => process.nextTick(resolve));

// Mock implementations for common React Native modules
export const mockReactNativeModules = () => {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
  
  jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => {};
    return Reanimated;
  });

  jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
  );

  jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
  
  jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  }));
};

// Performance testing utilities
export const measureComponentPerformance = async (
  Component: React.ComponentType<any>,
  props: Record<string, unknown> = {},
  iterations: number = 100
) => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    render(React.createElement(Component, props));
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    average: times.reduce((a, b) => a + b) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    median: times.sort()[Math.floor(times.length / 2)],
  };
};

// Accessibility testing helpers
export const checkAccessibilityCompliance = (component: any) => {
  const issues: string[] = [];
  
  // Check for required accessibility props
  if (!component.props.accessibilityLabel && !component.props.children) {
    issues.push('Missing accessibilityLabel');
  }
  
  if (component.props.onPress && !component.props.accessibilityRole) {
    issues.push('Interactive element missing accessibilityRole');
  }
  
  // Add more accessibility checks as needed
  
  return {
    isCompliant: issues.length === 0,
    issues,
  };
};

// Network mocking utilities
export const createNetworkMock = () => {
  const responses = new Map();
  
  return {
    mockResponse: (url: string, response: ApiResponse<unknown>) => {
      responses.set(url, response);
    },
    mockError: (url: string, error: Error) => {
      responses.set(url, Promise.reject(error));
    },
    clear: () => responses.clear(),
    fetch: (url: string) => {
      const response = responses.get(url);
      if (!response) {
        return Promise.reject(new Error(`No mock response for ${url}`));
      }
      return Promise.resolve(response);
    },
  };
};