import { BusinessLogicError } from './BusinessLogicError';
import { notificationService } from '../notificationService';
import { authService } from '../authService';
import { BaseService } from '../base/BaseService';
import { environmentService } from '../EnvironmentService';

export interface RecoveryStrategy {
  priority: number;
  canRecover(error: BusinessLogicError): boolean;
  recover(error: BusinessLogicError): Promise<void>;
}

export abstract class BaseRecoveryStrategy extends BaseService implements RecoveryStrategy {
  abstract priority: number;
  abstract canRecover(error: BusinessLogicError): boolean;
  abstract recover(error: BusinessLogicError): Promise<void>;

  protected async showRecoveryPrompt(
    message: string,
    actionLabel: string,
    handler: () => Promise<void>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = `recovery-${Date.now()}`;
      notificationService.warning(message, {
        id,
        persistent: true,
        closable: false,
        action: {
          label: actionLabel,
          handler: async () => {
            try {
              await handler();
              notificationService.dismiss(id);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        }
      });
    });
  }
}

export class SessionRecoveryStrategy extends BaseRecoveryStrategy {
  priority = 10;

  canRecover(error: BusinessLogicError): boolean {
    return error.code === 'SESSION_EXPIRED';
  }

  async recover(error: BusinessLogicError): Promise<void> {
    return this.showRecoveryPrompt(
      'Your session has expired. Would you like to continue?',
      'Continue Session',
      async () => {
        await authService.refreshSession();
      }
    );
  }
}
