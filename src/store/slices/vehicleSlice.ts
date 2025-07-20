import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { ErrorHandlingService } from '../../services/errors/ErrorHandlingService';

// Types
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  pricePerHour: number;
  pricePerDay: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
  };
  features: string[];
  images: string[];
  description: string;
  isAvailable: boolean;
  ownerId: string;
  ownerName: string;
  rating: number;
  reviewCount: number;
  category: 'economy' | 'compact' | 'midsize' | 'luxury' | 'suv' | 'truck' | 'van';
  transmission: 'automatic' | 'manual';
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  seatingCapacity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  mileage: number;
  insurance: {
    provider: string;
    policyNumber: string;
    expirationDate: string;
  };
  maintenanceHistory: {
    date: string;
    type: string;
    description: string;
    cost: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface VehicleFilters {
  category?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  features?: string[];
  transmission?: string[];
  fuelType?: string[];
  seatingCapacity?: number[];
  rating?: number;
  availability?: {
    startDate: string;
    endDate: string;
  };
}

// Export the Vehicle type for use in other files
export type { Vehicle, VehicleFilters };

interface VehicleState {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  filters: VehicleFilters;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  lastUpdated: number | null;
}

// Initial state
const initialState: VehicleState = {
  vehicles: [],
  currentVehicle: null,
  filters: {},
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  lastUpdated: null,
};

// Async thunks
export const fetchVehicles = createAsyncThunk<
  { vehicles: Vehicle[]; pagination: VehicleState['pagination']; refresh: boolean },
  { page?: number; limit?: number; filters?: VehicleFilters; refresh?: boolean },
  { rejectValue: string }
>(
  'vehicle/fetchVehicles',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<{ vehicles: Vehicle[]; pagination: VehicleState['pagination'] }>(
        () => apiService.get('/api/vehicles', params),
        'vehicle/fetchVehicles'
      );

      return {
        vehicles: response.vehicles,
        pagination: response.pagination,
        refresh: params.refresh || false,
      };
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to fetch vehicles');
    }
  }
);

export const fetchVehicleById = createAsyncThunk<
  Vehicle,
  string,
  { rejectValue: string }
>(
  'vehicle/fetchVehicleById',
  async (vehicleId, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<Vehicle>(
        () => apiService.get(`/api/vehicles/${vehicleId}`),
        'vehicle/fetchVehicleById'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to fetch vehicle');
    }
  }
);

export const searchVehicles = createAsyncThunk<
  { vehicles: Vehicle[]; pagination: VehicleState['pagination'] },
  { query: string; location?: string; filters?: VehicleFilters },
  { rejectValue: string }
>(
  'vehicle/searchVehicles',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<{ vehicles: Vehicle[]; pagination: VehicleState['pagination'] }>(
        () => apiService.get('/api/vehicles/search', params),
        'vehicle/searchVehicles'
      );

      return {
        vehicles: response.vehicles,
        pagination: response.pagination,
      };
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to search vehicles');
    }
  }
);

export const checkVehicleAvailability = createAsyncThunk<
  { vehicleId: string; isAvailable: boolean; conflicts: unknown[] },
  { vehicleId: string; startDate: string; endDate: string },
  { rejectValue: string }
>(
  'vehicle/checkAvailability',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<{ isAvailable: boolean; conflicts: unknown[] }>(
        () => apiService.get(`/api/vehicles/${params.vehicleId}/availability`, {
          startDate: params.startDate,
          endDate: params.endDate,
        }),
        'vehicle/checkAvailability'
      );

      return {
        vehicleId: params.vehicleId,
        isAvailable: response.isAvailable,
        conflicts: response.conflicts,
      };
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to check availability');
    }
  }
);

export const createVehicle = createAsyncThunk<
  Vehicle,
  Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>,
  { rejectValue: string }
>(
  'vehicle/createVehicle',
  async (vehicleData, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<Vehicle>(
        () => apiService.post('/api/vehicles', vehicleData),
        'vehicle/createVehicle'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to create vehicle');
    }
  }
);

export const updateVehicle = createAsyncThunk<
  Vehicle,
  { vehicleId: string; updates: Partial<Vehicle> },
  { rejectValue: string }
>(
  'vehicle/updateVehicle',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<Vehicle>(
        () => apiService.put(`/api/vehicles/${params.vehicleId}`, params.updates),
        'vehicle/updateVehicle'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to update vehicle');
    }
  }
);

export const deleteVehicle = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'vehicle/deleteVehicle',
  async (vehicleId, { rejectWithValue }) => {
    try {
      await ErrorHandlingService.withErrorHandling<void>(
        () => apiService.delete(`/api/vehicles/${vehicleId}`),
        'vehicle/deleteVehicle'
      );

      return vehicleId;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to delete vehicle');
    }
  }
);

// Vehicle slice
const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<VehicleFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.currentVehicle = action.payload;
    },
    updateVehicleInList: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.vehicles[index] = action.payload;
        state.lastUpdated = Date.now();
      }
    },
    removeVehicleFromList: (state, action: PayloadAction<string>) => {
      state.vehicles = state.vehicles.filter(v => v.id !== action.payload);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
      state.lastUpdated = Date.now();
    },
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: true,
      };
    },
    clearVehicles: (state) => {
      state.vehicles = [];
      state.currentVehicle = null;
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: true,
      };
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch vehicles
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.refresh) {
          state.vehicles = action.payload.vehicles;
        } else {
          state.vehicles = [...state.vehicles, ...action.payload.vehicles];
        }
        
        state.pagination = action.payload.pagination;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch vehicle by ID
    builder
      .addCase(fetchVehicleById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentVehicle = action.payload;
        
        // Update vehicle in list if it exists
        const index = state.vehicles.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
        
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchVehicleById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search vehicles
    builder
      .addCase(searchVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vehicles = action.payload.vehicles;
        state.pagination = action.payload.pagination;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(searchVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create vehicle
    builder
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.vehicles.unshift(action.payload);
        state.pagination.total += 1;
        state.lastUpdated = Date.now();
      });

    // Update vehicle
    builder
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const index = state.vehicles.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
        
        if (state.currentVehicle?.id === action.payload.id) {
          state.currentVehicle = action.payload;
        }
        
        state.lastUpdated = Date.now();
      });

    // Delete vehicle
    builder
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.vehicles = state.vehicles.filter(v => v.id !== action.payload);
        
        if (state.currentVehicle?.id === action.payload) {
          state.currentVehicle = null;
        }
        
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.lastUpdated = Date.now();
      });
  },
});

// Selectors
export const selectVehicles = (state: { vehicle: VehicleState }) => state.vehicle.vehicles;
export const selectCurrentVehicle = (state: { vehicle: VehicleState }) => state.vehicle.currentVehicle;
export const selectVehicleFilters = (state: { vehicle: VehicleState }) => state.vehicle.filters;
export const selectVehicleLoading = (state: { vehicle: VehicleState }) => state.vehicle.isLoading;
export const selectVehicleError = (state: { vehicle: VehicleState }) => state.vehicle.error;
export const selectVehiclePagination = (state: { vehicle: VehicleState }) => state.vehicle.pagination;

// Actions
export const { 
  clearError, 
  setFilters, 
  clearFilters, 
  setCurrentVehicle, 
  updateVehicleInList, 
  removeVehicleFromList, 
  resetPagination, 
  clearVehicles 
} = vehicleSlice.actions;

// Reducer
export default vehicleSlice.reducer;