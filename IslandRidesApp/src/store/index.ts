// Note: Install these packages first:
// npm install @reduxjs/toolkit react-redux redux-persist

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';

// Conditional storage for web compatibility
interface Storage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

let storage: Storage;
try {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = AsyncStorage;
} catch {
  // Fallback to localStorage for web
  storage = {
    getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
  };
}

// Slice imports (will add as we create them)
// Note: authSlice removed - using AuthContext for authentication
import userReducer from './slices/userSlice';
import vehicleReducer from './slices/vehicleSlice';
import bookingReducer from './slices/bookingSlice';
import notificationReducer from './slices/notificationSlice';
import searchReducer from './slices/searchSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: storage,
  whitelist: ['user'], // Only persist user data (auth handled by AuthContext)
  blacklist: ['search', 'notification'], // Don't persist temporary data
};

// Root reducer
const rootReducer = combineReducers({
  // Note: auth removed - using AuthContext for authentication
  user: userReducer,
  vehicle: vehicleReducer,
  booking: bookingReducer,
  notification: notificationReducer,
  search: searchReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

// Persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export { useAppDispatch, useAppSelector } from './hooks';