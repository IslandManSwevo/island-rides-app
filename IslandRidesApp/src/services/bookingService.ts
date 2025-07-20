import { BookingRequest, BookingResponse } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export class BookingService {
  static async createBooking(bookingData: BookingRequest, token: string): Promise<BookingResponse> {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Booking creation failed');
    }

    return response.json();
  }

  static calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
}
