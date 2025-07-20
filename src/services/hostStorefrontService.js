import { API_BASE_URL } from '../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

class HostStorefrontService {
  async getHostStorefront(hostId) {
    try {
      // Get auth token for optional authentication
      const token = await AsyncStorage.getItem('authToken');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add auth header if token exists (for profile view tracking)
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/host-storefront/${hostId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Host not found or not verified');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching host storefront:', error);
      throw error;
    }
  }
}

export default new HostStorefrontService();