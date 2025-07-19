import { Booking } from '../types';
import { BookingForReview } from '../services/reviewPromptService';

/**
 * Interface for booking data that includes vehicle information
 */
interface BookingWithVehicle extends Booking {
  vehicle: {
    id: number;
    make: string;
    model: string;
    year: number;
  };
}

/**
 * Transforms a booking object into the format required for the review prompt service.
 * @param booking - The booking object containing vehicle and booking details.
 * @returns {BookingForReview|null} The transformed booking data for review with the following structure:
 *   - id: booking identifier
 *   - vehicle: { id, make, model, year }
 *   - startDate: booking start date
 *   - endDate: booking end date
 *   - status: booking status
 *   Returns null if the booking is invalid or missing required vehicle data.
 * @throws {Error} Does not throw errors - returns null for invalid input instead.
 */
export const transformBookingForReview = (booking: BookingWithVehicle): BookingForReview | null => {
  if (!booking || !booking.vehicle) {
    return null;
  }

  return {
    id: booking.id,
    vehicle: {
      id: booking.vehicle.id,
      make: booking.vehicle.make,
      model: booking.vehicle.model,
      year: booking.vehicle.year,
    },
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
  };
};