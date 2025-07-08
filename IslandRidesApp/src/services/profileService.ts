import { apiService } from './apiService';
import { ProfileData } from '../types';

export class ProfileService {
  /**
   * Gets the current user's profile data
   */
  static async getProfile(): Promise<ProfileData> {
    const profileData = await apiService.get<ProfileData>('/api/users/me/profile');
    return profileData;
  }
}
