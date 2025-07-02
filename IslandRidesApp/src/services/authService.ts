import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const authResponse = await response.json();
    
    console.log('🔐 DEBUG: Login successful, received token:', authResponse.token ? 'TOKEN_RECEIVED' : 'NO_TOKEN');
    
    if (authResponse.token) {
      await AsyncStorage.setItem('authToken', authResponse.token);
      console.log('🔐 DEBUG: Token stored in AsyncStorage');
    }

    return authResponse;
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const authResponse = await response.json();
    
    console.log('🔐 DEBUG: Registration successful, received token:', authResponse.token ? 'TOKEN_RECEIVED' : 'NO_TOKEN');
    
    if (authResponse.token) {
      await AsyncStorage.setItem('authToken', authResponse.token);
      console.log('🔐 DEBUG: Token stored in AsyncStorage after registration');
    }

    return authResponse;
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    console.log('🔐 DEBUG: Token removed from AsyncStorage');
  }

  static async getToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔐 DEBUG: Retrieved token from AsyncStorage:', token ? 'TOKEN_FOUND' : 'NO_TOKEN');
    return token;
  }

  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true };
  }
}
