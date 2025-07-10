import { Booking } from '../types';

/**
 * Transforms a booking object into the format required for the review prompt service.
 * @param booking - The booking object.
 * @returns The transformed booking data for review.
 */
export const transformBookingForReview = (booking: Booking) => {
  return {
    id: booking.id,
    vehicle: {
      id: booking.vehicle.id,
      make: booking.vehicle.make,
      model: booking.vehicle.model,
      year: booking.vehicle.year,
    },
    startDate: booking.start_date,
    endDate: booking.end_date,
    status: booking.status,
  };
};