import { Booking } from '../types';

/**
 * Transforms a booking object into the format required for the review prompt service.
 * @param booking - The booking object containing vehicle and booking details.
 * @returns {Object|null} The transformed booking data for review with the following structure:
 *   - id: booking identifier
 *   - vehicle: { id, make, model, year }
 *   - startDate: booking start date
 *   - endDate: booking end date
 *   - status: booking status
 *   Returns null if the booking is invalid or missing required vehicle data.
 * @throws {Error} Does not throw errors - returns null for invalid input instead.
 */
export const transformBookingForReview = (booking: any): {
  id: any;
  vehicle: {
    id: any;
    make: any;
    model: any;
    year: any;
  };
  startDate: any;
  endDate: any;
  status: any;
} | null => {
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