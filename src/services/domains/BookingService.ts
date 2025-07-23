import { apiService } from '../apiService';

export interface Booking {
  id: string;
  vehicleId: string;
  userId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface BookingCreateData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface BookingUpdateData {
  status?: Booking['status'];
  notes?: string;
}

/**
 * BookingService - Domain service for booking-related operations
 * Consolidates all booking API calls into a single service layer
 */
export class BookingService {
  
  /**
   * Create a new booking
   */
  async createBooking(bookingData: BookingCreateData): Promise<Booking> {
    return await apiService.post<Booking>('/api/bookings', bookingData);
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(): Promise<Booking[]> {
    const response = await apiService.get<{ bookings: Booking[] }>('/api/bookings/user');
    return response.bookings;
  }

  /**
   * Get host's bookings
   */
  async getHostBookings(): Promise<Booking[]> {
    const response = await apiService.get<{ bookings: Booking[] }>('/api/bookings/host');
    return response.bookings;
  }

  /**
   * Get booking details by ID
   */
  async getBookingDetails(bookingId: string): Promise<Booking> {
    return await apiService.get<Booking>(`/api/bookings/${bookingId}`);
  }

  /**
   * Update booking status
   */
  async updateBooking(bookingId: string, updateData: BookingUpdateData): Promise<Booking> {
    return await apiService.put<Booking>(`/api/bookings/${bookingId}`, updateData);
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    return await apiService.put<Booking>(`/api/bookings/${bookingId}/cancel`, { reason });
  }

  /**
   * Confirm a booking (host action)
   */
  async confirmBooking(bookingId: string): Promise<Booking> {
    return await apiService.put<Booking>(`/api/bookings/${bookingId}/confirm`, {});
  }

  /**
   * Complete a booking
   */
  async completeBooking(bookingId: string): Promise<Booking> {
    return await apiService.put<Booking>(`/api/bookings/${bookingId}/complete`, {});
  }

  /**
   * Get booking history
   */
  async getBookingHistory(filters?: { 
    status?: string; 
    vehicleId?: string; 
    startDate?: string; 
    endDate?: string; 
  }): Promise<Booking[]> {
    const response = await apiService.get<{ bookings: Booking[] }>('/api/bookings/history', filters);
    return response.bookings;
  }

  /**
   * Process booking payment
   */
  async processPayment(bookingId: string, paymentData: any): Promise<{ success: boolean; transactionId?: string }> {
    return await apiService.post<{ success: boolean; transactionId?: string }>(`/api/bookings/${bookingId}/payment`, paymentData);
  }

  /**
   * Request booking refund
   */
  async requestRefund(bookingId: string, reason: string): Promise<{ success: boolean; refundId?: string }> {
    return await apiService.post<{ success: boolean; refundId?: string }>(`/api/bookings/${bookingId}/refund`, { reason });
  }
}

export const bookingService = new BookingService();