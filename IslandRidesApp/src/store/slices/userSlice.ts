import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { ErrorHandlingService } from '../../services/errors/ErrorHandlingService';

// Types
interface UserProfile {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  isVerified: boolean;
  role: 'user' | 'owner' | 'admin';
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    currency: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    theme: 'light' | 'dark' | 'system';
  };
  stats: {
    totalBookings: number;
    totalSpent: number;
    favoriteVehicles: string[];
    recentSearches: string[];
  };
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk<UserProfile, void, { rejectValue: string }>(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<UserProfile>(
        () => apiService.get('/api/user/profile'),
        'user/fetchProfile'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk<UserProfile, Partial<UserProfile>, { rejectValue: string }>(
  'user/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<UserProfile>(
        () => apiService.put('/api/user/profile', updates),
        'user/updateProfile'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to update profile');
    }
  }
);

export const uploadProfileImage = createAsyncThunk<string, string, { rejectValue: string }>(
  'user/uploadProfileImage',
  async (imageUri, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await ErrorHandlingService.withErrorHandling<{ imageUrl: string }>(
        () => apiService.uploadFile('/api/user/profile/image', formData),
        'user/uploadProfileImage'
      );

      return response.imageUrl;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to upload image');
    }
  }
);

export const updateUserPreferences = createAsyncThunk<UserProfile['preferences'], Partial<UserProfile['preferences']>, { rejectValue: string }>(
  'user/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<UserProfile['preferences']>(
        () => apiService.put('/api/user/preferences', preferences),
        'user/updatePreferences'
      );

      return response;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to update preferences');
    }
  }
);

export const deleteUserAccount = createAsyncThunk<null, string, { rejectValue: string }>(
  'user/deleteAccount',
  async (password, { rejectWithValue }) => {
    try {
      await ErrorHandlingService.withErrorHandling<void>(
        () => apiService.delete('/api/user/account', { data: { password } }),
        'user/deleteAccount'
      );

      return null;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to delete account');
    }
  }
);

export const addFavoriteVehicle = createAsyncThunk<string, string, { rejectValue: string }>(
  'user/addFavoriteVehicle',
  async (vehicleId, { rejectWithValue }) => {
    try {
      await ErrorHandlingService.withErrorHandling<void>(
        () => apiService.post('/api/user/favorites', { vehicleId }),
        'user/addFavoriteVehicle'
      );

      return vehicleId;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to add favorite');
    }
  }
);

export const removeFavoriteVehicle = createAsyncThunk<string, string, { rejectValue: string }>(
  'user/removeFavoriteVehicle',
  async (vehicleId, { rejectWithValue }) => {
    try {
      await ErrorHandlingService.withErrorHandling<void>(
        () => apiService.delete(`/api/user/favorites/${vehicleId}`),
        'user/removeFavoriteVehicle'
      );

      return vehicleId;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to remove favorite');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateLocalProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
        state.lastUpdated = Date.now();
      }
    },
    addRecentSearch: (state, action: PayloadAction<string>) => {
      if (state.profile?.stats) {
        const searches = state.profile.stats.recentSearches;
        const newSearch = action.payload;
        
        // Remove if already exists
        const filtered = searches.filter(s => s !== newSearch);
        
        // Add to beginning and limit to 10
        state.profile.stats.recentSearches = [newSearch, ...filtered].slice(0, 10);
        state.lastUpdated = Date.now();
      }
    },
    clearRecentSearches: (state) => {
      if (state.profile?.stats) {
        state.profile.stats.recentSearches = [];
        state.lastUpdated = Date.now();
      }
    },
    clearUserData: (state) => {
      state.profile = null;
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Upload profile image
    builder
      .addCase(uploadProfileImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.profileImageUrl = action.payload;
          state.lastUpdated = Date.now();
        }
        state.error = null;
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update preferences
    builder
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.preferences = { ...state.profile.preferences, ...action.payload };
          state.lastUpdated = Date.now();
        }
      });

    // Add favorite vehicle
    builder
      .addCase(addFavoriteVehicle.fulfilled, (state, action) => {
        if (state.profile?.stats) {
          const favorites = state.profile.stats.favoriteVehicles;
          if (!favorites.includes(action.payload)) {
            favorites.push(action.payload);
            state.lastUpdated = Date.now();
          }
        }
      });

    // Remove favorite vehicle
    builder
      .addCase(removeFavoriteVehicle.fulfilled, (state, action) => {
        if (state.profile?.stats) {
          state.profile.stats.favoriteVehicles = state.profile.stats.favoriteVehicles.filter(
            id => id !== action.payload
          );
          state.lastUpdated = Date.now();
        }
      });

    // Delete account
    builder
      .addCase(deleteUserAccount.fulfilled, (state) => {
        state.profile = null;
        state.error = null;
        state.lastUpdated = null;
      });
  },
});

// Selectors
export const selectUserProfile = (state: { user: UserState }) => state.user.profile;
export const selectUserLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectUserPreferences = (state: { user: UserState }) => state.user.profile?.preferences;
export const selectUserStats = (state: { user: UserState }) => state.user.profile?.stats;
export const selectFavoriteVehicles = (state: { user: UserState }) => state.user.profile?.stats?.favoriteVehicles || [];
export const selectRecentSearches = (state: { user: UserState }) => state.user.profile?.stats?.recentSearches || [];

// Actions
export const { 
  clearError, 
  updateLocalProfile, 
  addRecentSearch, 
  clearRecentSearches, 
  clearUserData 
} = userSlice.actions;

// Reducer
export default userSlice.reducer;