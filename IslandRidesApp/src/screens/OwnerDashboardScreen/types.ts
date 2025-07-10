export interface DashboardOverview {
  grossRevenue: number;
  netRevenue: number;
  activeVehicles: number;
  totalVehicles: number;
  totalBookings: number;
  pendingBookings: number;
  occupancyRate: number;
  averageRating: number;
  totalReviews: number;
  newBookingsThisWeek: number;
}

export interface DailyRevenue {
  date: string;
  grossRevenue: number;
}

export interface VehicleRevenue {
  id: string;
  make: string;
  model: string;
  year: number;
  bookings: number;
  grossRevenue: number;
}

export interface RevenueData {
  dailyData: DailyRevenue[];
  vehicleBreakdown: VehicleRevenue[];
}

export interface Goal {
  id: string;
  goalType: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  targetPeriod: 'monthly' | 'quarterly' | 'yearly';
  createdAt: string;
  updatedAt: string;
}

export interface NewGoal {
  goalType: string;
  targetValue: string;
  targetPeriod: 'monthly' | 'quarterly' | 'yearly';
}