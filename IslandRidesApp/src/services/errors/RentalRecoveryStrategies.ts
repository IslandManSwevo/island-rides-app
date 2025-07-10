import { RecoveryStrategy } from './RecoveryStrategy';
import { BusinessLogicError } from './BusinessLogicError';
import { notificationService } from '../notificationService';
import { vehicleService } from '../vehicleService';

export class AlternativeVehicleStrategy implements RecoveryStrategy {
  priority = 80;

  canRecover(error: BusinessLogicError): boolean {
    return error.code === 'VEHICLE_UNAVAILABLE';
  }

  async recover(error: BusinessLogicError): Promise<void> {
    if (!error.meta || typeof error.meta.vehicleId !== 'string') {
      console.error('Invalid error metadata for AlternativeVehicleStrategy, cannot recover.');
      return;
    }
    const { vehicleId } = error.meta as { vehicleId: string };
    
    try {
      const alternatives = await vehicleService.findSimilarVehicles(vehicleId);
      if (alternatives.length > 0) {
        return new Promise((resolve, reject) => {
          notificationService.warning(
            'This vehicle is unavailable. Would you like to see similar vehicles?',
            {
              persistent: true,
              action: {
                label: 'View Alternatives',
                handler: async () => {
                  try {
                    // Navigate to search results with alternatives
                    // This would be handled by your navigation system
                    resolve();
                  } catch (e) {
                    reject(e);
                  }
                }
              }
            }
          );
        });
      }
    } catch (error) {
      console.error('Failed to find alternative vehicles:', error);
      throw error;
    }
  }
}

export class DateConflictStrategy implements RecoveryStrategy {
  priority = 85;

  canRecover(error: BusinessLogicError): boolean {
    return error.code === 'BOOKING_CONFLICT';
  }

  async recover(error: BusinessLogicError): Promise<void> {
    return new Promise((resolve, reject) => {
      notificationService.warning(
        'The selected dates conflict with another booking. Would you like to see available dates?',
        {
          persistent: true,
          action: {
            label: 'View Available Dates',
            handler: async () => {
              try {
                // This would typically open a date picker with available dates highlighted
                resolve();
              } catch (e) {
                reject(e);
              }
            }
          }
        }
      );
    });
  }
}

export class PaymentRetryStrategy implements RecoveryStrategy {
  priority = 90;
  private static maxRetries = 3;
  private static retryCounts = new Map<string, number>();

  private getErrorId(error: BusinessLogicError): string | undefined {
    return error.meta?.paymentId || error.meta?.transactionId;
  }

  canRecover(error: BusinessLogicError): boolean {
    const errorId = this.getErrorId(error);
    if (error.code !== 'PAYMENT_FAILED' || !errorId) {
      return false;
    }
    const retryCount = PaymentRetryStrategy.retryCounts.get(errorId) || 0;
    return retryCount < PaymentRetryStrategy.maxRetries;
  }

  async recover(error: BusinessLogicError): Promise<void> {
    const errorId = this.getErrorId(error);
    if (!errorId) {
      throw new Error('Cannot recover payment without a unique error identifier.');
    }

    const currentRetry = (PaymentRetryStrategy.retryCounts.get(errorId) || 0) + 1;
    PaymentRetryStrategy.retryCounts.set(errorId, currentRetry);

    return new Promise((resolve, reject) => {
      notificationService.warning(
        `Payment failed. Would you like to try again? (Attempt ${currentRetry}/${PaymentRetryStrategy.maxRetries})`,
        {
          persistent: true,
          action: {
            label: 'Retry Payment',
            handler: async () => {
              try {
                // This would retry the payment process
                // You would implement this based on your payment flow
                resolve();
              } catch (e) {
                reject(e);
              }
            }
          }
        }
      );
    });
  }
}
