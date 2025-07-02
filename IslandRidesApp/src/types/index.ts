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

export type Island = 'Nassau' | 'Freeport' | 'Exuma';

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  location: string;
  daily_rate: number;
  available: boolean;
  drive_side: 'LHD' | 'RHD';
  created_at: string;
}

export interface VehicleRecommendation {
  vehicle: Vehicle;
  recommendationScore: number;
  scoreBreakdown: {
    collaborativeFiltering: number;
    vehiclePopularity: number;
    vehicleRating: number;
    hostPopularity: number;
  };
}
