import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

export class ApiService {
  static async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await AsyncStorage.getItem('authToken');
    
    console.log('🔐 DEBUG: Making authenticated request to:', endpoint);
    console.log('🔐 DEBUG: Token available:', token ? 'YES' : 'NO');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 DEBUG: Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('🔐 DEBUG: No token found, making unauthenticated request');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log('🔐 DEBUG: Response status:', response.status);
    
    if (response.status === 401) {
      console.log('🔐 DEBUG: 401 Unauthorized - token may be invalid or expired');
      await AsyncStorage.removeItem('authToken');
    }

    return response;
  }

  static async get(endpoint: string): Promise<Response> {
    return this.makeAuthenticatedRequest(endpoint, { method: 'GET' });
  }

  static async post(endpoint: string, data: any): Promise<Response> {
    return this.makeAuthenticatedRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put(endpoint: string, data: any): Promise<Response> {
    return this.makeAuthenticatedRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint: string): Promise<Response> {
    return this.makeAuthenticatedRequest(endpoint, { method: 'DELETE' });
  }
}
