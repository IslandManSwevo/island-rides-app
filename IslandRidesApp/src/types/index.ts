export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  daily_rate: number;
  location: string;
  owner_id: number;
  description?: string;
  features?: string[];
  photos?: string[];
  available: boolean;
  created_at?: string;
}

export type Island = 'Nassau' | 'Freeport' | 'Exuma';
