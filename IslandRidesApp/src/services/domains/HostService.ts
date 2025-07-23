import { apiService } from '../apiService';

export interface HostProfile {
  id: string;
  userId: string;
  businessName?: string;
  description?: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  responseRate: number;
  joinedAt: string;
  isVerified: boolean;
  contactInfo: {
    email: string;
    phone?: string;
    whatsapp?: string;
  };
  location: {
    island: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface HostDashboardData {
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  responseRate: number;
  recentBookings: any[];
  pendingActions: any[];
}

export interface HostVerificationData {
  businessLicense?: string;
  insuranceProof?: string;
  identityDocument?: string;
  addressProof?: string;
}

/**
 * HostService - Domain service for host-related operations
 * Consolidates all host API calls into a single service layer
 */
export class HostService {
  
  /**
   * Get host profile
   */
  async getHostProfile(): Promise<HostProfile> {
    return await apiService.get<HostProfile>('/api/host/profile');
  }

  /**
   * Update host profile
   */
  async updateHostProfile(profileData: Partial<HostProfile>): Promise<HostProfile> {
    return await apiService.put<HostProfile>('/api/host/profile', profileData);
  }

  /**
   * Get host dashboard data
   */
  async getDashboardData(): Promise<HostDashboardData> {
    return await apiService.get<HostDashboardData>('/api/host/dashboard');
  }

  /**
   * Get host's vehicles
   */
  async getHostVehicles(): Promise<any[]> {
    const response = await apiService.get<{ vehicles: any[] }>('/api/host/vehicles');
    return response.vehicles;
  }

  /**
   * Get host's bookings
   */
  async getHostBookings(status?: string): Promise<any[]> {
    const params = status ? { status } : undefined;
    const response = await apiService.get<{ bookings: any[] }>('/api/host/bookings', params);
    return response.bookings;
  }

  /**
   * Get host's financial data
   */
  async getFinancialData(period?: 'week' | 'month' | 'year'): Promise<{
    totalRevenue: number;
    pendingPayouts: number;
    completedPayouts: number;
    transactions: any[];
  }> {
    const params = period ? { period } : undefined;
    return await apiService.get('/api/host/financials', params);
  }

  /**
   * Get host's earnings history
   */
  async getEarningsHistory(startDate?: string, endDate?: string): Promise<any[]> {
    const params = { startDate, endDate };
    const response = await apiService.get<{ earnings: any[] }>('/api/host/earnings', params);
    return response.earnings;
  }

  /**
   * Request payout
   */
  async requestPayout(amount: number): Promise<{ success: boolean; payoutId?: string }> {
    return await apiService.post<{ success: boolean; payoutId?: string }>('/api/host/payout', { amount });
  }

  /**
   * Get host verification status
   */
  async getVerificationStatus(): Promise<{
    isVerified: boolean;
    pendingVerification: boolean;
    requiredDocuments: string[];
    submittedDocuments: string[];
  }> {
    return await apiService.get('/api/host/verification/status');
  }

  /**
   * Submit host verification documents
   */
  async submitVerificationDocuments(documents: FormData): Promise<{ success: boolean; message: string }> {
    return await apiService.uploadFile<{ success: boolean; message: string }>('/api/host/verification', documents);
  }

  /**
   * Get host reviews
   */
  async getHostReviews(): Promise<any[]> {
    const response = await apiService.get<{ reviews: any[] }>('/api/host/reviews');
    return response.reviews;
  }

  /**
   * Respond to a review
   */
  async respondToReview(reviewId: string, response: string): Promise<{ success: boolean }> {
    return await apiService.post<{ success: boolean }>(`/api/host/reviews/${reviewId}/respond`, { response });
  }

  /**
   * Get host analytics
   */
  async getAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    views: number;
    bookings: number;
    revenue: number;
    occupancyRate: number;
    averageBookingValue: number;
    topPerformingVehicles: any[];
  }> {
    return await apiService.get('/api/host/analytics', { period });
  }

  /**
   * Update host availability settings
   */
  async updateAvailabilitySettings(settings: {
    autoAccept?: boolean;
    minimumBookingDuration?: number;
    maximumBookingDuration?: number;
    advanceBookingTime?: number;
  }): Promise<{ success: boolean }> {
    return await apiService.put<{ success: boolean }>('/api/host/settings/availability', settings);
  }

  /**
   * Get host's messaging conversations
   */
  async getConversations(): Promise<any[]> {
    const response = await apiService.get<{ conversations: any[] }>('/api/host/messages');
    return response.conversations;
  }

  /**
   * Send message to customer
   */
  async sendMessage(conversationId: string, message: string): Promise<{ success: boolean }> {
    return await apiService.post<{ success: boolean }>(`/api/host/messages/${conversationId}`, { message });
  }

  /**
   * Become a host (host registration)
   */
  async registerAsHost(hostData: {
    businessName?: string;
    description: string;
    contactInfo: HostProfile['contactInfo'];
    location: HostProfile['location'];
  }): Promise<HostProfile> {
    return await apiService.post<HostProfile>('/api/host/register', hostData);
  }
}

export const hostService = new HostService();