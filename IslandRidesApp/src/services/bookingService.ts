import { apiService } from './apiService';
import { BookingRequest, BookingResponse } from '../types';
import { calculateDays } from '../utils/dateUtils';

export class BookingService {
  static async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await apiService.post<BookingResponse>('/api/bookings', bookingData);
      return response;
    } catch (error) {
      throw new Error(`Failed to create booking: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  }

  static async getBookings(): Promise<BookingResponse[]> {
    try {
      const response = await apiService.get<BookingResponse[]>('/api/bookings');
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
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
    return calculateDays(startDate, endDate);
  }


}