import { BusinessLogicError } from './BusinessLogicError';
import { RecoveryStrategy } from './RecoveryStrategy';
import { loggingService } from '../LoggingService';

export class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager;
  private strategies: RecoveryStrategy[] = [];

  private constructor() {}

  static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    // Sort strategies by priority (highest first)
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  async attemptRecovery(error: BusinessLogicError): Promise<boolean> {
    loggingService.info(`Attempting recovery for error: ${error.message}`, { error });
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        loggingService.info(`Selected recovery strategy: ${strategy.constructor.name}`);
        try {
          await strategy.recover(error);
          loggingService.info(`Successfully recovered using strategy: ${strategy.constructor.name}`);
          return true;
        } catch (recoveryError) {
          loggingService.error(`Recovery strategy ${strategy.constructor.name} failed`, recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)));
          continue;
        }
      }
    }
    loggingService.warn(`No suitable recovery strategy found for error: ${error.message}`);
    return false;
  }
}
