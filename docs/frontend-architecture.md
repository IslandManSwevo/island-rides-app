# KeyLo Frontend Architecture Document

**Document Status**: 🚧 In Progress  
**Last Updated**: December 2024  
**Version**: 1.0  
**Author**: AI Assistant  

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| Dec 2024 | 1.0 | Initial frontend architecture document | AI Assistant |

---

## Template and Framework Selection

### Project Context Analysis

Based on the existing project documentation and codebase analysis:

**Framework Choice**: React Native with Expo  
**Rationale**: The project is already established as a mobile-first peer-to-peer car rental marketplace using React Native/Expo framework.

**Existing Codebase**: This is a brownfield enhancement project with an existing React Native/Expo foundation.

**Key Constraints from Existing Architecture**:
- Mobile-first design approach
- Expo managed workflow
- TypeScript implementation
- Real-time chat functionality
- Geographic/island-based filtering
- Frosted glass design system

**Template Decision**: Building upon existing React Native/Expo codebase rather than using a new starter template.

---

## Frontend Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|----------|
| Framework | React Native | ^0.72.0 | Mobile app development | Cross-platform mobile development with native performance |
| Platform | Expo | ^49.0.0 | Development platform | Simplified development workflow and deployment |
| Language | TypeScript | ^5.0.0 | Type safety | Enhanced developer experience and code reliability |
| State Management | Redux Toolkit | ^1.9.0 | Global state management | Predictable state management for complex app state |
| Navigation | React Navigation | ^6.0.0 | Screen navigation | Standard navigation solution for React Native |
| UI Library | React Native Elements | ^3.4.0 | Component library | Consistent UI components with theming support |
| Styling | StyleSheet + Styled Components | Native + ^5.3.0 | Component styling | Combination of native styling with styled-components for complex theming |
| Form Handling | React Hook Form | ^7.45.0 | Form management | Performant forms with minimal re-renders |
| HTTP Client | Axios | ^1.4.0 | API communication | Robust HTTP client with interceptors |
| Real-time | Socket.io Client | ^4.7.0 | Real-time communication | Chat and live updates |
| Maps | React Native Maps | ^1.7.0 | Geographic features | Island-based location services |
| Testing | Jest + React Native Testing Library | ^29.0.0 | Unit/Integration testing | Comprehensive testing framework |
| Animation | React Native Reanimated | ^3.3.0 | Smooth animations | High-performance animations |
| Storage | AsyncStorage | ^1.19.0 | Local data persistence | Secure local storage for user preferences |

---

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Input, etc.)
│   ├── forms/           # Form-specific components
│   ├── navigation/      # Navigation-related components
│   └── index.ts         # Component exports
├── screens/             # Screen components
│   ├── auth/           # Authentication screens
│   ├── host/           # Host-specific screens (Dashboard, Storefront)
│   ├── renter/         # Renter-specific screens
│   ├── shared/         # Shared screens (Profile, Settings)
│   └── index.ts        # Screen exports
├── services/           # API and external service integrations
│   ├── api/           # API service layer
│   ├── auth/          # Authentication services
│   ├── chat/          # Real-time chat services
│   ├── location/      # Geographic/island services
│   └── index.ts       # Service exports
├── store/             # Redux store configuration
│   ├── slices/        # Redux Toolkit slices
│   ├── middleware/    # Custom middleware
│   ├── selectors/     # Reusable selectors
│   └── index.ts       # Store configuration
├── navigation/        # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── HostNavigator.tsx
│   └── RenterNavigator.tsx
├── hooks/             # Custom React hooks
│   ├── useAuth.ts
│   ├── useLocation.ts
│   ├── useChat.ts
│   └── index.ts
├── utils/             # Utility functions
│   ├── validation.ts
│   ├── formatting.ts
│   ├── constants.ts
│   └── index.ts
├── types/             # TypeScript type definitions
│   ├── api.ts
│   ├── navigation.ts
│   ├── user.ts
│   └── index.ts
├── assets/            # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
└── styles/            # Global styles and themes
    ├── theme.ts
    ├── colors.ts
    └── typography.ts
```

---

## Component Standards

### Component Template

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ComponentNameProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onPress,
  disabled = false,
  children,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile`, `VehicleCard`)
- **Files**: PascalCase for components (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useAuth`, `useLocation`)
- **Services**: camelCase (e.g., `authService`, `vehicleService`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `Vehicle`, `ApiResponse`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`, `ISLAND_CODES`)
- **Screens**: PascalCase with 'Screen' suffix (e.g., `LoginScreen`, `HostDashboardScreen`)
- **Store Slices**: camelCase (e.g., `authSlice`, `vehicleSlice`)

---

## State Management

### Store Structure

```
store/
├── index.ts              # Store configuration and setup
├── rootReducer.ts        # Combine all reducers
├── middleware/
│   ├── authMiddleware.ts # Authentication middleware
│   └── apiMiddleware.ts  # API error handling middleware
├── slices/
│   ├── authSlice.ts      # Authentication state
│   ├── userSlice.ts      # User profile state
│   ├── vehicleSlice.ts   # Vehicle management state
│   ├── bookingSlice.ts   # Booking/rental state
│   ├── chatSlice.ts      # Chat/messaging state
│   ├── locationSlice.ts  # Island/location state
│   └── uiSlice.ts        # UI state (loading, modals, etc.)
└── selectors/
    ├── authSelectors.ts
    ├── vehicleSelectors.ts
    └── index.ts
```

### State Management Template

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { Vehicle, ApiError } from '../../types';
import { vehicleService } from '../../services/api/vehicleService';

// Async thunk example
export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (islandCode: string, { rejectWithValue }) => {
    try {
      const response = await vehicleService.getVehiclesByIsland(islandCode);
      return response.data;
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  loading: boolean;
  error: string | null;
  filters: {
    islandCode: string;
    priceRange: [number, number];
    vehicleType: string;
  };
}

const initialState: VehicleState = {
  vehicles: [],
  selectedVehicle: null,
  loading: false,
  error: null,
  filters: {
    islandCode: '',
    priceRange: [0, 1000],
    vehicleType: 'all',
  },
};

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setSelectedVehicle: (state, action: PayloadAction<Vehicle>) => {
      state.selectedVehicle = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<VehicleState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedVehicle, updateFilters, clearError } = vehicleSlice.actions;
export default vehicleSlice.reducer;

// Selectors
export const selectVehicles = (state: RootState) => state.vehicles.vehicles;
export const selectVehicleLoading = (state: RootState) => state.vehicles.loading;
export const selectFilteredVehicles = (state: RootState) => {
  const { vehicles, filters } = state.vehicles;
  return vehicles.filter(vehicle => 
    vehicle.islandCode === filters.islandCode &&
    vehicle.pricePerDay >= filters.priceRange[0] &&
    vehicle.pricePerDay <= filters.priceRange[1]
  );
};
```

---

## API Integration

### Service Template

```typescript
import axios, { AxiosResponse } from 'axios';
import { ApiResponse, Vehicle, CreateVehicleRequest } from '../../types/api';
import { API_BASE_URL } from '../../utils/constants';

class VehicleService {
  private baseURL = `${API_BASE_URL}/vehicles`;

  async getVehiclesByIsland(islandCode: string): Promise<ApiResponse<Vehicle[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Vehicle[]>> = await axios.get(
        `${this.baseURL}?island=${islandCode}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createVehicle(vehicleData: CreateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    try {
      const response: AxiosResponse<ApiResponse<Vehicle>> = await axios.post(
        this.baseURL,
        vehicleData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateVehicle(id: string, vehicleData: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    try {
      const response: AxiosResponse<ApiResponse<Vehicle>> = await axios.put(
        `${this.baseURL}/${id}`,
        vehicleData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteVehicle(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axios.delete(
        `${this.baseURL}/${id}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      return new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      // Request made but no response received
      return new Error('Network error - please check your connection');
    } else {
      // Something else happened
      return new Error('An unexpected error occurred');
    }
  }
}

export const vehicleService = new VehicleService();
```

### API Client Configuration

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      // Navigate to login screen
      // NavigationService.navigate('Login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Routing

### Route Configuration

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUserRole } from '../store/slices/authSlice';

// Screen imports
import { LoginScreen, RegisterScreen } from '../screens/auth';
import { HostDashboardScreen, HostStorefrontScreen, VehicleManagementScreen } from '../screens/host';
import { RenterHomeScreen, VehicleSearchScreen, BookingScreen } from '../screens/renter';
import { ProfileScreen, SettingsScreen } from '../screens/shared';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Host Tab Navigator
const HostTabNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Dashboard" component={HostDashboardScreen} />
    <Tab.Screen name="Storefront" component={HostStorefrontScreen} />
    <Tab.Screen name="Vehicles" component={VehicleManagementScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Renter Tab Navigator
const RenterTabNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Home" component={RenterHomeScreen} />
    <Tab.Screen name="Search" component={VehicleSearchScreen} />
    <Tab.Screen name="Bookings" component={BookingScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main App Navigator
export const AppNavigator = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : userRole === 'host' ? (
          <Stack.Screen name="HostApp" component={HostTabNavigator} />
        ) : (
          <Stack.Screen name="RenterApp" component={RenterTabNavigator} />
        )}
        {/* Shared modal screens */}
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

---

## Styling Guidelines

### Styling Approach

The KeyLo app uses a **hybrid styling approach** combining:
- **React Native StyleSheet** for performance-critical components
- **Styled Components** for complex theming and dynamic styles
- **Frosted Glass Design System** as the core visual language

### Global Theme Variables

```css
/* Global CSS Variables for Theme System */
:root {
  /* Primary Colors - Island Theme */
  --color-primary: #007AFF;
  --color-primary-light: #5AC8FA;
  --color-primary-dark: #0051D5;
  
  /* Secondary Colors - Tropical Accent */
  --color-secondary: #FF9500;
  --color-secondary-light: #FFCC02;
  --color-secondary-dark: #D1700A;
  
  /* Neutral Colors */
  --color-background: #F2F2F7;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F9F9F9;
  --color-text-primary: #000000;
  --color-text-secondary: #3C3C43;
  --color-text-tertiary: #8E8E93;
  
  /* Frosted Glass Effects */
  --glass-background: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  --glass-backdrop-filter: blur(8px);
  
  /* Spacing Scale */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  
  /* Typography */
  --font-family-primary: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-xxl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #000000;
    --color-surface: #1C1C1E;
    --color-surface-secondary: #2C2C2E;
    --color-text-primary: #FFFFFF;
    --color-text-secondary: #EBEBF5;
    --color-text-tertiary: #8E8E93;
    
    --glass-background: rgba(28, 28, 30, 0.8);
    --glass-border: rgba(255, 255, 255, 0.1);
  }
}
```

---

## Testing Requirements

### Component Test Template

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { VehicleCard } from '../VehicleCard';
import { vehicleSlice } from '../../store/slices/vehicleSlice';

// Mock store setup
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      vehicles: vehicleSlice.reducer,
    },
    preloadedState: initialState,
  });
};

// Mock data
const mockVehicle = {
  id: '1',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  pricePerDay: 75,
  islandCode: 'NAS',
  imageUrl: 'https://example.com/car.jpg',
};

describe('VehicleCard', () => {
  let store: ReturnType<typeof createMockStore>;
  
  beforeEach(() => {
    store = createMockStore();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  it('renders vehicle information correctly', () => {
    const { getByText } = renderWithProvider(
      <VehicleCard vehicle={mockVehicle} onPress={jest.fn()} />
    );

    expect(getByText('Toyota Camry')).toBeTruthy();
    expect(getByText('$75/day')).toBeTruthy();
    expect(getByText('2022')).toBeTruthy();
  });

  it('calls onPress when card is tapped', async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = renderWithProvider(
      <VehicleCard vehicle={mockVehicle} onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId('vehicle-card'));
    
    await waitFor(() => {
      expect(mockOnPress).toHaveBeenCalledWith(mockVehicle);
    });
  });

  it('displays loading state correctly', () => {
    const { getByTestId } = renderWithProvider(
      <VehicleCard vehicle={mockVehicle} onPress={jest.fn()} loading />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

### Testing Best Practices

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test critical user flows (using Detox)
4. **Coverage Goals**: Aim for 80% code coverage
5. **Test Structure**: Arrange-Act-Assert pattern
6. **Mock External Dependencies**: API calls, navigation, AsyncStorage
7. **Test User Interactions**: Focus on user behavior, not implementation details
8. **Snapshot Testing**: Use sparingly for stable UI components

---

## Environment Configuration

### Required Environment Variables

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://api.islandrides.com
EXPO_PUBLIC_WS_URL=wss://api.islandrides.com/ws

# Authentication
EXPO_PUBLIC_AUTH_DOMAIN=islandrides.auth0.com
EXPO_PUBLIC_AUTH_CLIENT_ID=your_auth0_client_id

# Maps & Location
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Payment Processing
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Analytics & Monitoring
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EXPO_PUBLIC_ANALYTICS_ID=your_analytics_id

# Feature Flags
EXPO_PUBLIC_ENABLE_CHAT=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH=true

# Island Configuration
EXPO_PUBLIC_DEFAULT_ISLAND=NAS
EXPO_PUBLIC_SUPPORTED_ISLANDS=NAS,FPO,ELU,ABA
```

---

## Frontend Developer Standards

### Critical Coding Rules

1. **TypeScript Strict Mode**: Always use strict TypeScript configuration
2. **Component Props**: Always define interfaces for component props
3. **Error Boundaries**: Wrap screens in error boundaries
4. **Loading States**: Always handle loading and error states in UI
5. **Accessibility**: Include accessibility props (accessibilityLabel, testID)
6. **Performance**: Use React.memo, useMemo, useCallback for optimization
7. **Navigation Types**: Always type navigation props and routes
8. **API Error Handling**: Never ignore API errors, always provide user feedback
9. **State Management**: Use Redux for global state, local state for component-specific data
10. **Testing**: Write tests for all custom hooks and complex components

### Quick Reference

#### Common Commands
```bash
# Development
npx expo start
npx expo start --ios
npx expo start --android

# Building
npx expo build:ios
npx expo build:android

# Testing
npm test
npm run test:watch
npm run test:coverage

# Type Checking
npx tsc --noEmit
```

#### Key Import Patterns
```typescript
// React Native Core
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Navigation
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Custom Hooks
import { useAuth, useLocation, useTheme } from '../hooks';
```

#### File Naming Conventions
- Components: `PascalCase.tsx` (e.g., `VehicleCard.tsx`)
- Screens: `PascalCaseScreen.tsx` (e.g., `LoginScreen.tsx`)
- Hooks: `camelCase.ts` (e.g., `useAuth.ts`)
- Services: `camelCaseService.ts` (e.g., `vehicleService.ts`)
- Types: `camelCase.ts` (e.g., `navigation.ts`)
- Utils: `camelCase.ts` (e.g., `validation.ts`)

---

## Document Complete

This frontend architecture document provides comprehensive guidance for developing the KeyLo React Native application. It covers all essential aspects from project structure to testing strategies, ensuring consistent development practices across the team.

**Next Steps**:
1. Review and validate the architecture with the development team
2. Set up the project structure according to the defined standards
3. Implement the core components and services
4. Establish the testing framework and CI/CD pipeline
5. Begin development of the host-centric features as outlined in the PRD
