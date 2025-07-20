import React from 'react';
import { Provider } from 'react-redux';
import { store, persistor } from './index';
import { View, ActivityIndicator } from 'react-native';

// Conditional import for redux-persist PersistGate
let PersistGate: any;
try {
  PersistGate = require('redux-persist/integration/react').PersistGate;
} catch {
  // Fallback for web builds
  PersistGate = ({ children }: { children: React.ReactNode }) => <>{children}</>;
}

interface ReduxProviderProps {
  children: React.ReactNode;
}

const LoadingFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingFallback />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};