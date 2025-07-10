import { BusinessLogicError } from './BusinessLogicError';

export class VehicleUnavailableError extends BusinessLogicError {
  constructor(vehicleId: string, message?: string) {
    super(
      message || 'The requested vehicle is currently unavailable',
      'VEHICLE_UNAVAILABLE',
      { vehicleId }
    );
  }
}

export class BookingConflictError extends BusinessLogicError {
  constructor(bookingId: string, message?: string) {
    super(
      message || 'There is a conflict with an existing booking',
      'BOOKING_CONFLICT',
      { bookingId }
    );
  }
}

export class PaymentFailedError extends BusinessLogicError {
  constructor(details: any, message?: string) {
    super(
      message || 'Payment processing failed',
      'PAYMENT_FAILED',
      details
    );
  }
}

export class InvalidBookingDatesError extends BusinessLogicError {
  constructor(startDate: Date, endDate: Date, message?: string) {
    super(
      message || 'The selected booking dates are invalid',
      'INVALID_BOOKING_DATES',
      { startDate, endDate }
    );
  }
}
