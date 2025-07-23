import { apiService } from '../apiService';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
  role: 'customer' | 'host' | 'owner' | 'admin';
  isVerified: boolean;
  joinedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  currency: string;
  language: string;
  defaultIsland: string;
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    bookingConfirmation: boolean;
    bookingReminders: boolean;
    promotions: boolean;
    hostMessages: boolean;
  };
}

/**
 * UserService - Domain service for user-related operations
 * Consolidates all user API calls into a single service layer
 */
export class UserService {
  
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return await apiService.get<User>('/api/user/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(updateData: UserUpdateData): Promise<User> {
    return await apiService.put<User>('/api/user/profile', updateData);
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(avatarData: FormData): Promise<{ avatarUrl: string }> {
    return await apiService.uploadFile<{ avatarUrl: string }>('/api/user/avatar', avatarData);
  }

  /**
   * Get user's favorites
   */
  async getFavorites(): Promise<string[]> {
    const response = await apiService.get<{ favorites: string[] }>('/favorites');
    return response.favorites;
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return await apiService.get<NotificationPreferences>('/api/user/notifications');
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return await apiService.put<NotificationPreferences>('/api/user/notifications', preferences);
  }

  /**
   * Get user verification status
   */
  async getVerificationStatus(): Promise<{ 
    identity: boolean; 
    email: boolean; 
    phone: boolean; 
    driversLicense: boolean; 
  }> {
    return await apiService.get('/api/user/verification/status');
  }

  /**
   * Submit verification documents
   */
  async submitVerification(documents: FormData): Promise<{ success: boolean; message: string }> {
    return await apiService.uploadFile<{ success: boolean; message: string }>('/api/user/verification', documents);
  }

  /**
   * Get public user profile (for host/owner profiles)
   */
  async getPublicProfile(userId: string): Promise<Partial<User>> {
    return await apiService.get<Partial<User>>(`/api/users/${userId}/public`);
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return await apiService.post<{ success: boolean }>('/api/user/password', {
      currentPassword,
      newPassword
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    return await apiService.post<{ success: boolean }>('/api/auth/password-reset', { email });
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<{ success: boolean }> {
    return await apiService.post<{ success: boolean }>('/api/user/verify-email', { token });
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<{ success: boolean }> {
    return await apiService.delete<{ success: boolean }>('/api/user/account', { 
      data: { password } 
    });
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(): Promise<any[]> {
    const response = await apiService.get<{ searches: any[] }>('/api/user/saved-searches');
    return response.searches;
  }

  /**
   * Save a search
   */
  async saveSearch(searchData: any): Promise<{ id: string }> {
    return await apiService.post<{ id: string }>('/api/user/saved-searches', searchData);
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId: string): Promise<void> {
    await apiService.delete(`/api/user/saved-searches/${searchId}`);
  }
}

export const userService = new UserService();