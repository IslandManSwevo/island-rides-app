import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { ErrorHandlingService } from '../../services/errors/ErrorHandlingService';

// Types
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'booking' | 'payment' | 'vehicle' | 'system' | 'promotion';
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk<{ notifications: Notification[]; unreadCount: number }, { page?: number; limit?: number }, { rejectValue: string }>(
  'notification/fetchNotifications',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ErrorHandlingService.withErrorHandling<{ notifications: Notification[]; unreadCount: number }>(
        () => apiService.get('/api/notifications', params),
        'notification/fetchNotifications'
      );

      return {
        notifications: response.notifications,
        unreadCount: response.unreadCount,
      };
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk<string, string, { rejectValue: string }>(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await ErrorHandlingService.withErrorHandling<void>(
        () => apiService.put(`/api/notifications/${notificationId}/read`, {}),
        'notification/markAsRead'
      );

      return notificationId;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk<void, void, { rejectValue: string }>(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await ErrorHandlingService.withErrorHandling<void>(
        () => apiService.put('/api/notifications/read-all', {}),
        'notification/markAllAsRead'
      );
      return undefined; // Explicit return for void async thunk
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk<string, string, { rejectValue: string }>(
  'notification/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await ErrorHandlingService.withErrorHandling<void>(
        () => apiService.delete(`/api/notifications/${notificationId}`),
        'notification/deleteNotification'
      );

      return notificationId;
    } catch (error) {
      return rejectWithValue((error as any).userMessage || 'Failed to delete notification');
    }
  }
);

// Notification slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
      state.lastUpdated = Date.now();
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
      state.lastUpdated = Date.now();
    },
    markAsReadLocal: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.lastUpdated = Date.now();
      }
    },
    markAllAsReadLocal: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
      state.lastUpdated = Date.now();
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.lastUpdated = null;
    },
    removeExpiredNotifications: (state) => {
      const now = new Date().toISOString();
      const validNotifications = state.notifications.filter(n => 
        !n.expiresAt || n.expiresAt > now
      );
      
      if (validNotifications.length !== state.notifications.length) {
        state.notifications = validNotifications;
        state.unreadCount = validNotifications.filter(n => !n.isRead).length;
        state.lastUpdated = Date.now();
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.lastUpdated = Date.now();
        }
      });

    // Mark all as read
    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
        state.lastUpdated = Date.now();
      });

    // Delete notification
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
        state.lastUpdated = Date.now();
      });
  },
});

// Selectors
export const selectNotifications = (state: { notification: NotificationState }) => state.notification.notifications;
export const selectUnreadCount = (state: { notification: NotificationState }) => state.notification.unreadCount;
export const selectNotificationLoading = (state: { notification: NotificationState }) => state.notification.isLoading;
export const selectNotificationError = (state: { notification: NotificationState }) => state.notification.error;

// Derived selectors
export const selectUnreadNotifications = (state: { notification: NotificationState }) =>
  state.notification.notifications.filter(n => !n.isRead);

export const selectNotificationsByType = (type: Notification['type']) => 
  (state: { notification: NotificationState }) =>
    state.notification.notifications.filter(n => n.type === type);

export const selectNotificationsByCategory = (category: Notification['category']) => 
  (state: { notification: NotificationState }) =>
    state.notification.notifications.filter(n => n.category === category);

// Actions
export const { 
  clearError, 
  addNotification, 
  removeNotification, 
  markAsReadLocal, 
  markAllAsReadLocal, 
  clearNotifications, 
  removeExpiredNotifications 
} = notificationSlice.actions;

// Reducer
export default notificationSlice.reducer;