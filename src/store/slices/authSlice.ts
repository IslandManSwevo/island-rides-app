import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { ErrorHandlingService } from '../../services/errors/ErrorHandlingService';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  isVerified: boolean;
  role: 'user' | 'owner' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLoginTime: number | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastLoginTime: null,
};

// Async thunks
export const loginUser = createAsyncThunk<{ user: User; token: string; refreshToken: string }, { email: string; password: string }, { rejectValue: string }>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<{ accessToken: string; refreshToken: string; user: User }>(
        () => apiService.postWithoutAuth('/api/auth/login', credentials),
        'auth/loginUser',
        { showNotification: false }
      );

      // Store tokens
      await apiService.storeToken(response.accessToken, response.refreshToken);
      
      return {
        user: response.user,
        token: response.accessToken,
        refreshToken: response.refreshToken,
      };
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk<{ user: User; token: string; refreshToken: string }, { name: string; email: string; password: string; confirmPassword: string }, { rejectValue: string }>(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<{ accessToken: string; refreshToken: string; user: User }>(
        () => apiService.postWithoutAuth('/api/auth/register', userData),
        'auth/registerUser',
        { showNotification: false }
      );

      // Store tokens
      await apiService.storeToken(response.accessToken, response.refreshToken);
      
      return {
        user: response.user,
        token: response.accessToken,
        refreshToken: response.refreshToken,
      };
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await ErrorHandlingService.withErrorHandling(
        () => apiService.post('/api/auth/logout', {}),
        'auth/logoutUser',
        { showNotification: false }
      );

      // Clear stored tokens
      await apiService.clearToken();
    } catch (error) {
      await apiService.clearToken();
      return;
    }
  }
);

export const refreshAuthToken = createAsyncThunk<{ token: string }, void, { rejectValue: string }>(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.refreshToken();
      const newToken = await apiService.getToken();
      if (!newToken) {
        return rejectWithValue('Token refresh failed');
      }
      return { token: newToken! };
    } catch (error) {
      return rejectWithValue('Token refresh failed');
    }
  }
);

export const verifyEmail = createAsyncThunk<User, string, { rejectValue: string }>(
  'auth/verifyEmail',
  async (verificationCode, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<{ user: User }>(
        () => apiService.post('/api/auth/verify-email', { code: verificationCode }),
        'auth/verifyEmail'
      );

      return response.user;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Email verification failed');
    }
  }
);

export const resetPassword = createAsyncThunk<void, string, { rejectValue: string }>(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      await ErrorHandlingService.withErrorHandling(
        () => apiService.postWithoutAuth('/api/auth/reset-password', { email }),
        'auth/resetPassword'
      );
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Password reset failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setAuthToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.lastLoginTime = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.lastLoginTime = Date.now();
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.lastLoginTime = Date.now();
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        state.lastLoginTime = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        // Still clear auth even if logout API fails
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.lastLoginTime = null;
      });

    // Refresh token
    builder
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        // Token refresh failed, clear auth
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });

    // Email verification
    builder
      .addCase(verifyEmail.fulfilled, (state, action) => {
        if (state.user) {
          state.user = action.payload;
        }
      });
  },
});

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Actions
export const { clearError, updateUser, setAuthToken, clearAuth } = authSlice.actions;

// Reducer
export default authSlice.reducer;