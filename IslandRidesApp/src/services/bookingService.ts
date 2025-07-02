import { BookingRequest, BookingResponse } from '../types';
import { ApiService } from './apiService';

export class BookingService {
  static async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    const response = await ApiService.post('/bookings', bookingData);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Booking creation failed');
    }

    return response.json();
  }

  static calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
}
