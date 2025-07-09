import { apiService } from './apiService';
import { BookingRequest, BookingResponse } from '../types';

export class BookingService {
  static async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await apiService.post<BookingResponse>('/api/bookings', bookingData);
      return response;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  static async getBookings(): Promise<BookingResponse[]> {
    try {
      const response = await apiService.get<BookingResponse[]>('/api/bookings');
      return response;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  static async getBookingById(bookingId: string): Promise<BookingResponse> {
    try {
      const response = await apiService.get<BookingResponse>(`/api/bookings/${bookingId}`);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch booking: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  }

  static async updateBooking(bookingId: string, updateData: Partial<BookingRequest>): Promise<BookingResponse> {
    try {
      const response = await apiService.put<BookingResponse>(`/api/bookings/${bookingId}`, updateData);
      return response;
    } catch (error) {
      throw new Error(`Failed to update booking: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  }

  static async cancelBooking(bookingId: string): Promise<void> {
    try {
      await apiService.delete(`/api/bookings/${bookingId}`);
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  }

  static calculateDays(startDate: string, endDate: string): number {
    if (!startDate || !endDate) {
      return 0;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid date provided to calculateDays');
      return 0;
    }

    // Normalize dates to midnight to avoid timezone issues
    const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (endOfDay < startOfDay) {
      console.warn('End date is before start date in calculateDays');
      return 0;
    }

    const diffTime = endOfDay.getTime() - startOfDay.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Rental period is inclusive, so add 1
    return diffDays + 1;
  }
}