import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { ErrorHandlingService } from '../../services/errors/ErrorHandlingService';

// Types
interface Booking {
  id: string;
  vehicleId: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    images: string[];
    pricePerHour: number;
    pricePerDay: number;
  };
  userId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalCost: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  lastUpdated: number | null;
}

// Initial state
const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  lastUpdated: null,
};

// Async thunks
export const fetchBookings = createAsyncThunk<{ bookings: Booking[]; pagination: BookingState['pagination']; refresh: boolean }, { page?: number; limit?: number; status?: string[]; refresh?: boolean }, { rejectValue: string }>(
  'booking/fetchBookings',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<{ bookings: Booking[]; pagination: BookingState['pagination'] }>(
        () => apiService.get('/api/bookings', params),
        'booking/fetchBookings'
      );

      return {
        bookings: response.bookings,
        pagination: response.pagination,
        refresh: params.refresh || false,
      };
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to fetch bookings');
    }
  }
);

export const createBooking = createAsyncThunk<Booking, { vehicleId: string; startDate: string; endDate: string; paymentMethod: string; specialRequests?: string }, { rejectValue: string }>(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<Booking>(
        () => apiService.post('/api/bookings', bookingData),
        'booking/createBooking'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to create booking');
    }
  }
);

export const cancelBooking = createAsyncThunk<Booking, { bookingId: string; reason?: string }, { rejectValue: string }>(
  'booking/cancelBooking',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<Booking>(
        () => apiService.put(`/api/bookings/${params.bookingId}/cancel`, {
          reason: params.reason,
        }),
        'booking/cancelBooking'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to cancel booking');
    }
  }
);

export const confirmBooking = createAsyncThunk<Booking, string, { rejectValue: string }>(
  'booking/confirmBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<Booking>(
        () => apiService.put(`/api/bookings/${bookingId}/confirm`, {}),
        'booking/confirmBooking'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to confirm booking');
    }
  }
);

export const completeBooking = createAsyncThunk<Booking, { bookingId: string; rating?: number; review?: string }, { rejectValue: string }>(
  'booking/completeBooking',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<Booking>(
        () => apiService.put(`/api/bookings/${params.bookingId}/complete`, {
          rating: params.rating,
          review: params.review,
        }),
        'booking/completeBooking'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to complete booking');
    }
  }
);

// Booking slice
const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
    },
    setFilters: (state, action: PayloadAction<BookingState['filters']>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    updateBookingInList: (state, action: PayloadAction<Booking>) => {
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
        state.lastUpdated = Date.now();
      }
    },
    removeBookingFromList: (state, action: PayloadAction<string>) => {
      state.bookings = state.bookings.filter(b => b.id !== action.payload);
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
    clearBookings: (state) => {
      state.bookings = [];
      state.currentBooking = null;
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
    // Fetch bookings
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.refresh) {
          state.bookings = action.payload.bookings;
        } else {
          state.bookings = [...state.bookings, ...action.payload.bookings];
        }
        
        state.pagination = action.payload.pagination;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings.unshift(action.payload);
        state.currentBooking = action.payload;
        state.pagination.total += 1;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel booking
    builder
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload;
        }
        
        state.lastUpdated = Date.now();
      });

    // Confirm booking
    builder
      .addCase(confirmBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload;
        }
        
        state.lastUpdated = Date.now();
      });

    // Complete booking
    builder
      .addCase(completeBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
        
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload;
        }
        
        state.lastUpdated = Date.now();
      });
  },
});

// Selectors
export const selectBookings = (state: { booking: BookingState }) => state.booking.bookings;
export const selectCurrentBooking = (state: { booking: BookingState }) => state.booking.currentBooking;
export const selectBookingLoading = (state: { booking: BookingState }) => state.booking.isLoading;
export const selectBookingError = (state: { booking: BookingState }) => state.booking.error;
export const selectBookingFilters = (state: { booking: BookingState }) => state.booking.filters;
export const selectBookingPagination = (state: { booking: BookingState }) => state.booking.pagination;

// Derived selectors
export const selectActiveBookings = (state: { booking: BookingState }) => 
  state.booking.bookings.filter(b => b.status === 'active');

export const selectUpcomingBookings = (state: { booking: BookingState }) => 
  state.booking.bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.startDate) > new Date()
  );

export const selectPastBookings = (state: { booking: BookingState }) => 
  state.booking.bookings.filter(b => 
    b.status === 'completed' || new Date(b.endDate) < new Date()
  );

// Actions
export const { 
  clearError, 
  setCurrentBooking, 
  setFilters, 
  clearFilters, 
  updateBookingInList, 
  removeBookingFromList, 
  resetPagination, 
  clearBookings 
} = bookingSlice.actions;

// Reducer
export default bookingSlice.reducer;