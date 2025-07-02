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

export interface Booking {
  id: number;
  user_id: number;
  vehicle_id: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BookingRequest {
  vehicleId: number;
  startDate: string;
  endDate: string;
}

export interface BookingResponse {
  message: string;
  booking: {
    id: number;
    vehicle: {
      id: number;
      make: string;
      model: string;
      year: number;
      location: string;
      daily_rate: number;
    };
    start_date: string;
    end_date: string;
    status: string;
    total_amount: number;
    created_at: string;
  };
}
