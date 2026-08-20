// Jest setup file
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// errorHandler's ErrorAnalytics uses localStorage, which the react-native jest
// preset doesn't provide.
const localStorageMock = (() => {
  let store = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => Object.keys(store)[i] ?? null,
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
})();
global.localStorage = localStorageMock;

// Mock expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
  },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// expo-haptics reaches for expo-modules-core's NativeModule, which doesn't
// exist outside a real runtime — anything importing hapticService (AnimatedButton,
// VehicleCard, …) fails to even load without this.
// expo-modules-core's NativeModule/requireNativeModule only exist inside a real
// Expo runtime. Anything importing @expo/vector-icons (i.e. most components)
// dies on load without this shim.
jest.mock('expo-modules-core', () => {
  class NativeModule {}
  class SharedObject {}
  class SharedRef {}
  const noopModule = new Proxy({}, { get: () => jest.fn() });
  return {
    NativeModule,
    SharedObject,
    SharedRef,
    EventEmitter: class {
      addListener = jest.fn(() => ({ remove: jest.fn() }));
      removeAllListeners = jest.fn();
      emit = jest.fn();
    },
    requireNativeModule: jest.fn(() => noopModule),
    requireOptionalNativeModule: jest.fn(() => null),
    requireNativeViewManager: jest.fn(() => 'MockNativeView'),
    NativeModulesProxy: new Proxy({}, { get: () => noopModule }),
    Platform: { OS: 'ios' },
    uuid: { v4: () => 'test-uuid' },
    createWebModule: jest.fn(() => noopModule),
    registerWebModule: jest.fn((m) => m),
  };
});

// The *Async fns must resolve — hapticService chains .then() off impactAsync
// to feature-detect, and a bare jest.fn() returning undefined throws there.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  createURL: jest.fn((path) => `keylo://${path}`),
  openURL: jest.fn(),
}));

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};