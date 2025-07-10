import { Booking } from '../types';

/**
 * Transforms a booking object into the format required for the review prompt service.
 * @param booking - The booking object.
 * @returns The transformed booking data for review.
 */
export const transformBookingForReview = (booking: any) => {
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