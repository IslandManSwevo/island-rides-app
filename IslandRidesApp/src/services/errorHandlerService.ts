import { ApiErrorCode, ErrorCategory, ErrorMeta } from '../types';
import { notificationService } from './notificationService';
import { navigationRef } from '../navigation/navigationRef';
import { ROUTES } from '../navigation/routes';
import { apiService } from './apiService';

class ErrorHandlerService {
  private handleAuthErrorRedirect() {
    const handler = async () => {
      await apiService.clearToken();
      if (navigationRef.isReady()) {
        navigationRef.navigate(ROUTES.LOGIN as any);
      }
    };
    handler();
  }

  handleApiError(error: Error | unknown, category: ErrorCategory = ErrorCategory.TECHNICAL) {
    let code: ApiErrorCode = 'SERVER_ERROR';
    let message = 'An unexpected error occurred';

    const errorWithResponse = error as Error & { 
      response?: { 
        data?: Record<string, unknown>;
        status?: number;
      } 
    };

    if (errorWithResponse.response && errorWithResponse.response.data) {
      const data = errorWithResponse.response.data;
      if (typeof data === 'object' && data !== null && typeof data.code === 'string') {
        code = data.code as ApiErrorCode;
        message = typeof data.message === 'string' 
                  ? data.message 
                  : 'An error occurred. Please try again.';

        switch (code) {
          case 'TOKEN_EXPIRED':
            notificationService.error('Your session has expired. Please log in again.', {
              title: 'Session Expired',
              duration: 5000
            });
            this.handleAuthErrorRedirect();
            break;

          case 'UNAUTHORIZED':
            notificationService.error('Your session is invalid. Please log in again.', {
              title: 'Authentication Required',
              duration: 4000
            });
            this.handleAuthErrorRedirect();
            break;

          case 'VALIDATION_ERROR':
            notificationService.warning(message, {
              title: 'Validation Error',
              duration: 5000
            });
            break;

          case 'RATE_LIMITED':
            notificationService.warning('Too many attempts. Please try again later.', {
              title: 'Rate Limited',
              duration: 6000
            });
            break;

          case 'MAINTENANCE_MODE':
            notificationService.info('System is under maintenance. Please try again later.', {
              title: 'Maintenance',
              duration: 0,
              closable: false
            });
            break;

          default:
            notificationService.error(message, {
              title: 'Error',
              duration: 5000
            });
        }
      }
    }

    return {
      code,
      message,
      category,
      timestamp: new Date().toISOString()
    } as ErrorMeta;
  }
}

export const errorHandlerService = new ErrorHandlerService();
